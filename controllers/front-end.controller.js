const threadsDAO = require("./threads.DAO");
const { convertTitle, convertText, fixBlockQuote } = require("../src/lib");

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
async function insertThread(req, res, next) {
  asyncWrapper(req, res, next, async () => {
    const board = getBoardName(req);
    const { title, text, password } = req.body;
    if (!board || !title || !text || !password) {
      const err = new Error("Board, title, text, and password are required");
      err.code = 400;
      throw err;
    }
    const thread = await threadsDAO.insertThread(board, title, text, password);
    res.redirect(`/b/${board}/${thread._id}`);
  })();
}
exports.insertThread = insertThread;

async function insertReply(req, res, next) {
  asyncWrapper(req, res, next, async () => {
    const board = getBoardName(req);
    const thread_id = req.params.thread_id;
    const { text, password } = req.body;
    if (!board || !thread_id || !text || !password) {
      const err = new Error(
        "Board, thread_id, text, and password are required"
      );
      err.code = 400;
      throw err;
    }
    await threadsDAO.insertReply(board, thread_id, text, password);
    res.redirect(`/b/${board}/${thread_id}`);
  })();
}
exports.insertReply = insertReply;

// (R)ead
async function getBoard(req, res, next) {
  asyncWrapper(req, res, next, async () => {
    const board = getBoardName(req);
    const { page = 1, threadsPerPage = 10 } = req.query;
    const currentPage = Math.max(Math.floor(page), 1);
    const { threads, totalNumThreads } = await threadsDAO.getThreads(
      board,
      currentPage,
      +threadsPerPage
    );
    const totalPages = Math.ceil(totalNumThreads / threadsPerPage);
    res.render("pages/board", {
      pageTitle: `Welcome to Bill's Anonymous Message Board`,
      board,
      threads,
      convertTitle,
      convertText,
      fixBlockQuote,
      pageControl: {
        currentPage: Math.min(currentPage),
        totalPages,
        totalItems: totalNumThreads,
        itemsPerPage: threadsPerPage,
        firstItemOnPage: Math.min(
          (currentPage - 1) * threadsPerPage + 1,
          totalNumThreads
        ),
        lastItemOnPage: Math.min(currentPage * threadsPerPage, totalNumThreads),
        firstPage: `/b/${board}?page=1&threadsPerPage=${threadsPerPage}`,
        lastPage: `/b/${board}?page=${totalPages}&threadsPerPage=${threadsPerPage}`,
        nextPage:
          currentPage < totalPages
            ? `/b/${board}?page=${
                currentPage + 1
              }&threadsPerPage=${threadsPerPage}`
            : "",
        prevPage:
          currentPage > 1
            ? `/b/${board}?page=${
                currentPage - 1
              }&threadsPerPage=${threadsPerPage}`
            : "",
      },
    });
  })();
}
exports.getBoard = getBoard;

async function getThread(req, res, next) {
  asyncWrapper(req, res, next, async () => {
    const board = getBoardName(req);
    const thread_id = req.params.thread_id;
    const thread = await threadsDAO.getThread(board, thread_id);
    if (!thread) {
      res.status(404).send("Not found");
    } else {
      res.render("pages/thread", {
        pageTitle: `Welcome to Bill's Anonymous Message Board`,
        board,
        thread,
        convertTitle,
        convertText,
        fixBlockQuote,
      });
    }
  })();
}
exports.getThread = getThread;

async function getAbout(req, res, next) {
  asyncWrapper(req, res, next, async () => {
    res.render("pages/about", {
      pageTitle: "Welcome to Bill's Anonymous Message Board",
      board: "",
    });
  })();
}
exports.getAbout = getAbout;

async function getApiTests(req, res, next) {
  asyncWrapper(req, res, next, async () => {
    res.render("pages/api-tests", {
      pageTitle: "Welcome to Bill's Anonymous Message Board",
      board: "",
    });
  })();
}
exports.getApiTests = getApiTests;

async function getHome(req, res, next) {
  asyncWrapper(req, res, next, async () => {
    const boards = await threadsDAO.getBoards();
    res.render("pages/home", {
      pageTitle: "Welcome to Bill's Anonymous Message Board",
      board: "",
      boards,
    });
  })();
}
exports.getHome = getHome;
