"use strict";

const frontEndController = require("../controllers/front-end.controller");

module.exports = function (app) {
  app
    .route("/b/:board")
    .get(frontEndController.getBoard)
    .post(frontEndController.insertThread);

  app
    .route("/b/:board/:thread_id")
    .get(frontEndController.getThread)
    .post(frontEndController.insertReply);

  app.route("/about").get(frontEndController.getAbout);
  app.route("/api-tests").get(frontEndController.getApiTests);
  app.route("/").get(frontEndController.getHome);
};
