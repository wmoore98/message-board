"use strict";

const express = require("express");
const bodyParser = require("body-parser");
const expect = require("chai").expect;
const cors = require("cors");

const apiRoutes = require("./routes/api.js");
const frontEndRoutes = require("./routes/front-end.js");
const fccTestingRoutes = require("./routes/fcctesting.js");
const runner = require("./test-runner");
const helmet = require("helmet");

const MongoClient = require("mongodb");
const { injectDb } = require("./controllers/threads.DAO");
const DB_CONN = process.env.DB_CONN;

const app = express();

app.use(helmet());
app.use(helmet.frameguard({ action: "sameorigin" }));
app.use(helmet.referrerPolicy({ policy: "same-origin" }));
app.use("/public", express.static(process.cwd() + "/public"));

app.use(cors({ origin: "*" })); //For FCC testing purposes only

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set("view engine", "ejs");

//Sample Front-end
frontEndRoutes(app);

//For FCC testing purposes
fccTestingRoutes(app);

//Routing for API
apiRoutes(app);

//404 Not Found Middleware
app.use(function(req, res, next) {
  res
    .status(404)
    .type("text")
    .send("Not Found");
});

app.use(function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }
  console.error(err);
  const { message, trace, code } = err;
  res.status(code || 500);
  res.send(message);
});

MongoClient.connect(DB_CONN, { useUnifiedTopology: true }, async function(
  err,
  client
) {
  if (err) {
    console.error("Unable to connect to database:", err);
    return;
  }

  try {
    await injectDb(client);
  } catch (err) {
    console.error("Unable to inject database:", err);
    return;
  }

  //Start our server and tests!
  app.listen(process.env.PORT || 3000, function() {
    console.log("Listening on port " + process.env.PORT);
    if (process.env.NODE_ENV === "test") {
      console.log("Running Tests...");
      setTimeout(function() {
        try {
          runner.run();
        } catch (e) {
          var error = e;
          console.log("Tests are not valid:");
          console.log(error);
        }
      }, 1500);
    }
  });
});

module.exports = app; //for testing
