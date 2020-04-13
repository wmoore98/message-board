const ObjectId = require("mongodb").ObjectID;
const sanitizeHtml = require("sanitize-html");

let threads;

async function injectDb(client) {
  try {
    const dbName = process.env.DB_NAME || "fcc_msg_brd";
    threads = await client.db(dbName).collection("threads");
  } catch (err) {
    throw err;
  }
}
exports.injectDb = injectDb;

// (C)reate
async function insertThread(dirtyBoard, dirtyTitle, dirtyText, dirtyPassword) {
  try {
    if (
      typeof dirtyBoard !== "string" ||
      typeof dirtyTitle !== "string" ||
      typeof dirtyText !== "string" ||
      typeof dirtyPassword !== "string"
    ) {
      const err = new Error("Input values must be string.");
      err.code = 400;
      throw err;
    }

    if (isBadInput(dirtyBoard) || isBadInput(dirtyPassword)) {
      const err = new Error(
        "Board and password cannot contain tags or be empty."
      );
      err.code = 400;
      throw err;
    }

    const board = dirtyBoard.toLowerCase().trim();
    const title = scrubInput(dirtyTitle).trim();
    const text = scrubInput(dirtyText).trim();
    const password = dirtyPassword.trim();
    const now = new Date();
    const doc = {
      board,
      title,
      text,
      created_on: now,
      bumped_on: now,
      last_edited_on: null,
      deleted_on: null,
      reported: false,
      password,
      replies: [],
    };
    const result = await threads.insertOne(doc);
    return result.ops[0];
  } catch (err) {
    console.error("There was an error inserting thread:", err);
  }
}
exports.insertThread = insertThread;

async function insertReply(board, thread_id, dirtyText, dirtyPassword) {
  try {
    if (isBadInput(dirtyPassword)) {
      const err = new Error("password cannot contain tags or be empty.");
      err.code = 400;
      throw err;
    }
    const text = scrubInput(dirtyText).trim();
    const password = dirtyPassword.trim();
    const now = new Date();
    const embedDoc = {
      _id: ObjectId(),
      text,
      created_on: now,
      last_edited_on: null,
      reported: false,
      password,
    };
    const filter = { _id: ObjectId(thread_id), board, deleted_on: null };
    const update = {
      $push: { replies: embedDoc },
      $set: { bumped_on: now },
    };
    const projection = {
      password: 0,
      reported: 0,
      "replies.password": 0,
      "replies.reported": 0,
    };
    const options = { projection, returnOriginal: false };
    const result = await threads.findOneAndUpdate(filter, update, options);
    return result.value;
  } catch (err) {
    console.error("There was an error inserting reply:", err);
  }
}
exports.insertReply = insertReply;

// (R)ead
async function getBoards(maxCount) {
  try {
    // Need a algo for top boards
    const matchStage = { $match: { deleted_on: null } };
    const groupStage = {
      $group: {
        _id: "$board",
        minCreated: { $min: "$created_on" },
        maxCreated: { $max: "$created_on" },
        minBumped: { $min: "$bumped_on" },
        maxBumped: { $max: "$bumped_on" },
        numThreads: { $sum: 1 },
        numReplies: { $sum: { $size: "$replies" } },
      },
    };
    const sortStage = {
      $sort: {
        maxBumped: -1,
        numThreads: -1,
      },
    };
    const pipeline = [matchStage, groupStage, sortStage];
    const result = await threads.aggregate(pipeline).toArray();
    return result;
  } catch (err) {
    console.error("There was an error getting boards:", err);
  }
}
exports.getBoards = getBoards;

async function getThreads(board, page = 1, threadsPerPage = 10) {
  try {
    const scrubbedPage = Math.max(Math.floor(page - 1), 0);
    const matchStage = {
      $match: { board, deleted_on: null },
    };
    const sortStage = { $sort: { bumped_on: -1 } };
    const skipStage = { $skip: scrubbedPage * threadsPerPage };
    const limitStage = { $limit: +threadsPerPage };
    const projectStage = {
      $project: {
        board: 1,
        title: 1,
        text: 1,
        created_on: 1,
        bumped_on: 1,
        last_edited_on: 1,
        "replies._id": 1,
        "replies.text": 1,
        "replies.created_on": 1,
        "replies.last_edited_on": 1,
        reply_count: { $size: "$replies" },
      },
    };
    const limitRepliesStage = {
      $addFields: {
        replies: {
          $slice: ["$replies", -3],
        },
      },
    };

    const pipeline = [
      matchStage,
      sortStage,
      skipStage,
      limitStage,
      projectStage,
      limitRepliesStage,
    ];
    const results = await threads.aggregate(pipeline).toArray();
    const totalNumThreads = await threads.countDocuments({
      board,
      deleted_on: null,
    });

    return { threads: results, totalNumThreads };
  } catch (err) {
    console.error("There was an error getting threads:", err);
    return { threads: [], totalNumThreads: 0 };
  }
}
exports.getThreads = getThreads;

async function getThread(board, thread_id) {
  try {
    const matchStage = {
      $match: { board, _id: ObjectId(thread_id), deleted_on: null },
    };
    const projectStage = {
      $project: {
        board: 1,
        title: 1,
        text: 1,
        created_on: 1,
        bumped_on: 1,
        last_edited_on: 1,
        "replies._id": 1,
        "replies.text": 1,
        "replies.created_on": 1,
        "replies.last_edited_on": 1,
        reply_count: { $size: "$replies" },
      },
    };

    const pipeline = [matchStage, projectStage];
    const result = await threads.aggregate(pipeline).toArray();
    return result[0];
  } catch (err) {
    console.error("There was an error getting thread:", err);
  }
}
exports.getThread = getThread;

// (U)pdate
async function updateThread(
  board,
  thread_id,
  dirtyTitle,
  dirtyText,
  dirtyPassword
) {
  try {
    const title = scrubInput(dirtyTitle).trim();
    const text = scrubInput(dirtyText).trim();
    const password = dirtyPassword.trim();
    const filter = {
      _id: ObjectId(thread_id),
      board,
      password,
      deleted_on: null,
    };
    const update = {
      $set: { title, text },
      $currentDate: {
        bumped_on: true,
        last_edited_on: true,
      },
    };
    const doc = await threads.findOneAndUpdate(filter, update);
    if (!doc.value) {
      return "incorrect password";
    } else {
      return "success";
    }
  } catch (err) {
    console.error("There was an error updating thread:", err);
  }
}
exports.updateThread = updateThread;

async function updateReply(
  board,
  thread_id,
  reply_id,
  dirtyText,
  dirtyPassword
) {
  try {
    const text = scrubInput(dirtyText).trim();
    const password = dirtyPassword.trim();
    const filter = {
      _id: ObjectId(thread_id),
      board,
      deleted_on: null,
      replies: {
        $elemMatch: {
          _id: ObjectId(reply_id),
          password,
        },
      },
    };
    const update = {
      $set: {
        "replies.$.text": text,
      },
      $currentDate: {
        bumped_on: true,
        "replies.$.last_edited_on": true,
      },
    };
    const doc = await threads.updateOne(filter, update);
    if (doc.result.nModified === 1) {
      return "success";
    } else {
      return "incorrect password";
    }
  } catch (err) {
    console.error("There was an error updating reply:", err);
  }
}
exports.updateReply = updateReply;

async function reportThread(board, thread_id) {
  try {
    const filter = { _id: ObjectId(thread_id), board, deleted_on: null };
    const update = { $set: { reported: true } };
    const doc = await threads.findOneAndUpdate(filter, update);
    return "success";
  } catch (err) {
    console.error("There was an error reporting thread:", err);
  }
}
exports.reportThread = reportThread;

async function reportReply(board, thread_id, reply_id) {
  try {
    const filter = {
      _id: ObjectId(thread_id),
      board,
      deleted_on: null,
      "replies._id": ObjectId(reply_id),
    };
    const update = {
      $set: {
        "replies.$.reported": true,
      },
    };
    const doc = await threads.updateOne(filter, update);
    return "success";
  } catch (err) {
    console.error("There was an error reporting reply:", err);
  }
}
exports.reportReply = reportReply;

// (D)elete
async function deleteThread(board, thread_id, password) {
  try {
    const filter = {
      _id: ObjectId(thread_id),
      board,
      password,
      deleted_on: null,
    };
    const update = { $currentDate: { deleted_on: true } };
    const doc = await threads.findOneAndUpdate(filter, update);
    // const doc = await threads.findOneAndDelete(filter);
    if (!doc.value) {
      return "incorrect password";
    } else {
      return "success";
    }
  } catch (err) {
    console.error("There was an error deleting thread:", err);
  }
}
exports.deleteThread = deleteThread;

async function deleteReply(board, thread_id, reply_id, password) {
  try {
    const filter = {
      _id: ObjectId(thread_id),
      board,
      deleted_on: null,
      replies: { $elemMatch: { _id: ObjectId(reply_id), password } },
    };
    const update = {
      $set: {
        "replies.$.text": "deleted",
      },
    };
    const doc = await threads.updateOne(filter, update);
    if (doc.result.nModified === 1) {
      return "success";
    } else {
      return "incorrect password";
    }
  } catch (err) {
    console.error("There was an error deleting reply:", err);
  }
}
exports.deleteReply = deleteReply;

function isBadInput(input) {
  return (
    !input ||
    input !== sanitizeHtml(input, { allowedTags: [], allowedAttributes: [] })
  );
}

function scrubInput(input) {
  return (
    sanitizeHtml(input, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(["tfoot"]),
    }) || "*Input text was scrubbed.*"
  );
}
