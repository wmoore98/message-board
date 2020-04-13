"use strict";

const apiController = require("../controllers/api.controller");

module.exports = function (app) {
  app
    .route("/api/threads/:board")
    .post(apiController.apiInsertThread)
    .get(apiController.apiGetThreads)
    .patch(apiController.apiUpdateThread)
    .put(apiController.apiReportThread)
    .delete(apiController.apiDeleteThread);

  app
    .route("/api/replies/:board")
    .post(apiController.apiInsertReply)
    .get(apiController.apiGetThread)
    .patch(apiController.apiUpdateReply)
    .put(apiController.apiReportReply)
    .delete(apiController.apiDeleteReply);
};
