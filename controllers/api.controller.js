const threadsDAO = require("./threads.DAO");

function asyncWrapper(req, res, next, func) {
  return async () => {
    try {
      await func();
    } catch (err) {
      next(err);
    }
  };
}

function getBoardName(req) {
  return req.params.board && req.params.board.toLowerCase().trim();
}

// (C)reate
async function apiInsertThread(req, res, next) {
  asyncWrapper(req, res, next, async () => {
    const board = getBoardName(req);
    const { title, text, password } = req.body;
    if (!board || !title || !text || !password) {
      const err = new Error("Board, title, text, and password are required");
      err.code = 400;
      throw err;
    }
    const thread = await threadsDAO.insertThread(board, title, text, password);
    res.json(thread);
  })();
}
exports.apiInsertThread = apiInsertThread;

async function apiInsertReply(req, res, next) {
  asyncWrapper(req, res, next, async () => {
    const board = getBoardName(req);
    const { thread_id, text, password } = req.body;
    if (!board || !thread_id || !text || !password) {
      const err = new Error(
        "Board, thread_id, text, and password are required"
      );
      err.code = 400;
      throw err;
    }
    const newDoc = await threadsDAO.insertReply(
      board,
      thread_id,
      text,
      password
    );
    res.json(newDoc);
  })();
}
exports.apiInsertReply = apiInsertReply;

// (R)ead
async function apiGetThreads(req, res, next) {
  asyncWrapper(req, res, next, async () => {
    const board = getBoardName(req);
    const { page = 1, threadsPerPage = 10 } = req.query;
    const results = await threadsDAO.getThreads(board, +page, +threadsPerPage);
    res.json(results); // { threads, totalNumThreads }
  })();
}
exports.apiGetThreads = apiGetThreads;

async function apiGetThread(req, res, next) {
  asyncWrapper(req, res, next, async () => {
    const board = getBoardName(req);
    const { thread_id } = req.query;
    const thread = await threadsDAO.getThread(board, thread_id);
    if (!thread) {
      res.status(404);
    }
    res.json(thread);
  })();
}
exports.apiGetThread = apiGetThread;

// (U)pdate
async function apiUpdateThread(req, res, next) {
  asyncWrapper(req, res, next, async () => {
    const board = getBoardName(req);
    const { thread_id, title, text, password } = req.body;
    if (!board || !thread_id || !title || !text || !password) {
      const err = new Error(
        "Board, thread_id, title, text, and password are required"
      );
      err.code = 400;
      throw err;
    }
    const result = await threadsDAO.updateThread(
      board,
      thread_id,
      title,
      text,
      password
    );
    if (result !== "success") {
      res.status(400);
    }
    res.send(result);
  })();
}
exports.apiUpdateThread = apiUpdateThread;

async function apiUpdateReply(req, res, next) {
  asyncWrapper(req, res, next, async () => {
    const board = getBoardName(req);
    const { thread_id, reply_id, text, password } = req.body;
    if (!board || !thread_id || !reply_id || !text || !password) {
      const err = new Error(
        "Board, thread_id, reply_id, text, and password are required"
      );
      err.code = 400;
      throw err;
    }
    const result = await threadsDAO.updateReply(
      board,
      thread_id,
      reply_id,
      text,
      password
    );
    if (result !== "success") {
      res.status(400);
    }
    res.send(result);
  })();
}
exports.apiUpdateReply = apiUpdateReply;

async function apiReportThread(req, res, next) {
  asyncWrapper(req, res, next, async () => {
    const board = getBoardName(req);
    const { thread_id } = req.body;
    if (!board || !thread_id) {
      const err = new Error("Board and thread_id are required");
      err.code = 400;
      throw err;
    }
    const result = await threadsDAO.reportThread(board, thread_id);
    if (result !== "success") {
      res.status(400);
    }
    res.send(result);
  })();
}
exports.apiReportThread = apiReportThread;

async function apiReportReply(req, res, next) {
  asyncWrapper(req, res, next, async () => {
    const board = getBoardName(req);
    const { thread_id, reply_id } = req.body;
    if (!board || !thread_id || !reply_id) {
      const err = new Error("Board, thread_id, and reply_id are required");
      err.code = 400;
      throw err;
    }
    const result = await threadsDAO.reportReply(board, thread_id, reply_id);
    if (result !== "success") {
      res.status(400);
    }
    res.send(result);
  })();
}
exports.apiReportReply = apiReportReply;

// (D)elete
async function apiDeleteThread(req, res, next) {
  asyncWrapper(req, res, next, async () => {
    const board = getBoardName(req);
    const { thread_id, password } = req.body;
    if (!board || !thread_id || !password) {
      const err = new Error("Board, thread_id, and password are required");
      err.code = 400;
      throw err;
    }
    const result = await threadsDAO.deleteThread(board, thread_id, password);
    if (result !== "success") {
      res.status(400);
    }
    res.send(result);
  })();
}
exports.apiDeleteThread = apiDeleteThread;

async function apiDeleteReply(req, res, next) {
  asyncWrapper(req, res, next, async () => {
    const board = getBoardName(req);
    const { thread_id, reply_id, password } = req.body;
    if (!board || !thread_id || !reply_id || !password) {
      const err = new Error(
        "Board, thread_id, reply_id, and password are required"
      );
      err.code = 400;
      throw err;
    }
    const result = await threadsDAO.deleteReply(
      board,
      thread_id,
      reply_id,
      password
    );
    if (result !== "success") {
      res.status(400);
    }
    res.send(result);
  })();
}
exports.apiDeleteReply = apiDeleteReply;
