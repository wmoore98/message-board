/*
 *
 *
 *       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
 *       -----[Keep the tests in the same order!]-----
 *       (if additional are added, keep them at the very end!)
 */

const chaiHttp = require("chai-http");
const chai = require("chai");
const assert = chai.assert;
const server = require("../server");

const MongoClient = require("mongodb");
const ObjectId = require("mongodb").ObjectID;
const DB_CONN = process.env.DB_CONN;
const DB_NAME = process.env.DB_NAME || "test";

const board = "func_test_brd";
const title = "Functional Test Title";
const text = "Functional Test text";
const delete_password = "del";

const testData = createTestData(board, title, text, 15, 5);

chai.use(chaiHttp);

before(async () => {
  await prepDatabase();
});

suite("Functional Tests", function() {
  suite("API ROUTING FOR /api/threads/:board", function() {
    suite("POST", function() {
      test("Test POST /api/threads/:board - missing text", function(done) {
        chai
          .request(server)
          .post(`/api/threads/${board}`)
          .send({ title, delete_password })
          .end(function(err, res) {
            assert.equal(res.status, 400);
            assert.equal(
              err.response.text,
              "Board, title, text, and delete_password are required"
            );
            done();
          });
      });

      test("Test POST /api/threads/:board - valid", function(done) {
        chai
          .request(server)
          .post(`/api/threads/${board}`)
          .send({ title, text, delete_password })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.req.method, "GET");
            assert.equal(res.req.path, `/b/${board}`);
            done();
          });
      });
    });

    suite("GET", function() {
      test("Test GET /api/threads/:board", function(done) {
        chai
          .request(server)
          .get(`/api/threads/${board}`)
          .end(function(err, res) {
            const data = res.body;
            const expected = testData[testData.length - 1];
            const actual = Array.isArray(data) && data[0];
            assert.equal(res.status, 200);
            assert.isArray(data, "Response data should be an array");
            assert.equal(data.length, 10, "Should be 10 most recent threads");
            assert.property(actual, "_id", "Should have _id property");
            assert.equal(
              actual._id,
              expected._id,
              "First entry should be most recent"
            );
            assert.property(actual, "board", "Should have board property");
            assert.equal(
              actual.board,
              expected.board,
              "First entry should be most recent"
            );
            assert.property(actual, "title", "Should have title property");
            assert.equal(
              actual.title,
              expected.title,
              "First entry should be most recent"
            );
            assert.property(actual, "text", "Should have text property");
            assert.equal(
              actual.text,
              expected.text,
              "First entry should be most recent"
            );
            assert.property(
              actual,
              "created_on",
              "Should have created_on property"
            );
            assert.property(
              actual,
              "bumped_on",
              "Should have bumped_on property"
            );
            assert.property(
              actual,
              "last_edited_on",
              "Should have last_edited_on property"
            );
            assert.notProperty(
              actual,
              "delete_passord",
              "Should NOT have delete_password property"
            );
            assert.notProperty(
              actual,
              "reported",
              "Should NOT have reported property"
            );
            assert.property(actual, "replies", "Should have replies property");
            assert.isArray(actual.replies, "Expected replies to be an array");
            assert.equal(
              actual.replies.length,
              3,
              "Expected only 3 most recent replies"
            );
            assert.property(
              actual.replies[0],
              "_id",
              "Reply should have _id property"
            );
            assert.property(
              actual.replies[0],
              "text",
              "Reply should have text property"
            );
            assert.property(
              actual.replies[0],
              "created_on",
              "Reply should have created_on property"
            );
            assert.property(
              actual.replies[0],
              "last_edited_on",
              "Reply should have last_edited_on property"
            );
            assert.notProperty(
              actual.replies[0],
              "delete_password",
              "Reply should NOT have delete_password property"
            );
            assert.notProperty(
              actual.replies[0],
              "reported",
              "Reply should NOT have reported property"
            );
            assert.equal(actual.replies[0].text, expected.replies[2].text);
            done();
          });
      });
    });

    suite("DELETE", function() {
      test("Test DELETE /api/threads/:board - missing ID", function(done) {
        chai
          .request(server)
          .delete(`/api/threads/${board}`)
          .send({ delete_password })
          .end(function(err, res) {
            assert.equal(res.status, 400);
            assert.equal(
              err.response.text,
              "Board, thread_id, and delete_password are required"
            );
            done();
          });
      });

      test("Test DELETE /api/threads/:board - wrong password", function(done) {
        chai
          .request(server)
          .delete(`/api/threads/${board}`)
          .send({ thread_id: testData[0]._id, delete_password: "wrong" })
          .end(function(err, res) {
            assert.equal(res.status, 400);
            assert.equal(res.text, "incorrect password");
            done();
          });
      });

      test("Test DELETE /api/threads/:board - valid", function(done) {
        const thread_id = testData[0]._id;
        chai
          .request(server)
          .delete(`/api/threads/${board}`)
          .send({ thread_id, delete_password })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, "success");
            chai
              .request(server)
              .get(`/api/replies/${board}?thread_id=${thread_id}`)
              .end(function(err, res) {
                assert.equal(res.status, 404);
                done();
              });
          });
      });
    });

    suite("PUT", function() {
      test("Test PUT /api/threads/:board - missing ID", function(done) {
        chai
          .request(server)
          .put(`/api/threads/${board}`)
          .end(function(err, res) {
            assert.equal(res.status, 400);
            assert.equal(err.response.text, "Board and thread_id are required");
            done();
          });
      });

      test("Test PUT /api/threads/:board - valid", function(done) {
        const thread_id = testData[1]._id;
        chai
          .request(server)
          .put(`/api/threads/${board}`)
          .send({ thread_id })
          .end(async function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, "success");
            getThread(board, thread_id, doc => {
              try {
                assert.equal(doc.reported, true);
                done();
              } catch (error) {
                done(error);
              }
            });
          });
      });
    });
  });

  suite("API ROUTING FOR /api/replies/:board", function() {
    suite("POST", function() {
      test("Test POST /api/replies/:board - missing text", function(done) {
        const thread_id = testData[1]._id;
        chai
          .request(server)
          .post(`/api/replies/${board}`)
          .send({ thread_id, delete_password })
          .end(function(err, res) {
            assert.equal(res.status, 400);
            assert.equal(
              err.response.text,
              "Board, thread_id, text, and delete_password are required"
            );
            done();
          });
      });

      test("Test POST /api/replies/:board - valid", function(done) {
        const thread_id = testData[1]._id;
        chai
          .request(server)
          .post(`/api/replies/${board}`)
          .send({ thread_id, text: "Functional test reply", delete_password })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.req.method, "GET");
            assert.equal(res.req.path, `/b/${board}/${thread_id}`);
            getThread(board, thread_id, doc => {
              try {
                assert.equal(doc.replies.length, 6);
                assert.equal(doc.replies[5].text, "Functional test reply");
                assert.equal(doc.replies[5].delete_password, delete_password);
                assert.equal(doc.replies[5].reported, false);
                done();
              } catch (error) {
                done(error);
              }
            });
          });
      });
    });

    suite("GET", function() {
      test("Test GET /api/replies/:board", function(done) {
        const thread_id = testData[1]._id;
        chai
          .request(server)
          .get(`/api/replies/${board}?thread_id=${thread_id}`)
          .end(function(err, res) {
            const expected = testData[1];
            const actual = res.body;
            const actualReply = actual.replies[5]; // check out the one posted in previous test
            assert.equal(res.status, 200);
            assert.isObject(actual, "Response should be an object");
            assert.property(actual, "_id", "Should have _id property");
            assert.equal(
              actual._id,
              expected._id,
              "Should retrieve the requested thread"
            );
            assert.property(actual, "board", "Should have board property");
            assert.equal(
              actual.board,
              expected.board,
              "Should retrieve the requested thread"
            );
            assert.property(actual, "title", "Should have title property");
            assert.equal(
              actual.title,
              expected.title,
              "Should retrieve the requested thread"
            );
            assert.property(actual, "text", "Should have text property");
            assert.equal(
              actual.text,
              expected.text,
              "Should retrieve the requested thread"
            );
            assert.property(
              actual,
              "created_on",
              "Should have created_on property"
            );
            assert.property(
              actual,
              "bumped_on",
              "Should have bumped_on property"
            );
            assert.property(
              actual,
              "last_edited_on",
              "Should have last_edited_on property"
            );
            assert.notProperty(
              actual,
              "delete_passord",
              "Should NOT have delete_password property"
            );
            assert.notProperty(
              actual,
              "reported",
              "Should NOT have reported property"
            );
            assert.property(actual, "replies", "Should have replies property");
            assert.isArray(actual.replies, "Expected replies to be an array");
            assert.equal(
              actual.replies.length,
              expected.replies.length + 1,
              "All replies should be returned"
            );
            assert.property(
              actualReply,
              "_id",
              "Reply should have _id property"
            );
            assert.property(
              actualReply,
              "text",
              "Reply should have text property"
            );
            assert.property(
              actualReply,
              "created_on",
              "Reply should have created_on property"
            );
            assert.property(
              actualReply,
              "last_edited_on",
              "Reply should have last_edited_on property"
            );
            assert.notProperty(
              actualReply,
              "delete_password",
              "Reply should NOT have delete_password property"
            );
            assert.notProperty(
              actualReply,
              "reported",
              "Reply should NOT have reported property"
            );
            assert.equal(actual.replies[0].text, expected.replies[0].text);
            done();
          });
      });
    });

    suite("PUT", function() {
      test("Test PUT /api/replies/:board - missing thread_id", function(done) {
        chai
          .request(server)
          .put(`/api/replies/${board}`)
          .end(function(err, res) {
            assert.equal(res.status, 400);
            assert.equal(
              err.response.text,
              "Board, thread_id, and reply_id are required"
            );
            done();
          });
      });

      test("Test PUT /api/replies/:board - valid", function(done) {
        const thread = testData[1];
        const thread_id = thread._id;
        const reply_id = thread.replies[0]._id;
        chai
          .request(server)
          .put(`/api/replies/${board}`)
          .send({ thread_id, reply_id })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, "success");
            getThread(board, thread_id, doc => {
              try {
                assert.equal(doc.replies[0].reported, true);
                done();
              } catch (error) {
                done(error);
              }
            });
          });
      });
    });

    suite("DELETE", function() {
      test("Test DELETE /api/replies/:board - missing delete_password", function(done) {
        const thread = testData[1];
        const thread_id = thread._id;
        const reply_id = thread.replies[0]._id;
        chai
          .request(server)
          .delete(`/api/replies/${board}`)
          .send({ board, thread_id, reply_id })
          .end(function(err, res) {
            assert.equal(res.status, 400);
            assert.equal(
              err.response.text,
              "Board, thread_id, reply_id, and delete_password are required"
            );
            done();
          });
      });

      test("Test DELETE /api/replies/:board - wrong password", function(done) {
        const thread = testData[1];
        const thread_id = thread._id;
        const reply_id = thread.replies[0]._id;
        chai
          .request(server)
          .delete(`/api/replies/${board}`)
          .send({ board, thread_id, reply_id, delete_password: "wrong" })
          .end(function(err, res) {
            assert.equal(res.status, 400);
            assert.equal(res.text, "incorrect password");
            done();
          });
      });

      test("Test DELETE /api/replies/:board - valid", function(done) {
        const thread = testData[1];
        const thread_id = thread._id;
        const reply_id = thread.replies[0]._id;
        chai
          .request(server)
          .delete(`/api/replies/${board}`)
          .send({ board, thread_id, reply_id, delete_password })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, "success");
            getThread(board, thread_id, doc => {
              try {
                assert.equal(doc.replies[0].text, "deleted");
                done();
              } catch (error) {
                done(error);
              }
            });
          });
      });
    });
  });
});

function prepDatabase() {
  MongoClient.connect(DB_CONN, { useUnifiedTopology: true }, function(
    err,
    client
  ) {
    if (err) {
      console.log(err);
      done();
      return;
    }
    const db = client.db(DB_NAME);
    db.collection("threads").deleteMany({ board }, () => {
      db.collection("threads")
        .insertMany(testData)
        .finally(() => {
          client.close();
        });
    });
  });
}

function createTestData(board, baseTitle, baseText, numThreads, numReplies) {
  const results = [];
  const anHourFromNow = Date.now() + 60 * 60 * 1000;
  for (i = 0; i < numThreads; i++) {
    const thread = {
      _id: ObjectId(),
      board,
      title: `${baseTitle} - ${i + 1}`,
      text: `${baseText} - ${i + 1}`,
      created_on: new Date(anHourFromNow + i * 5000),
      bumped_on: new Date(anHourFromNow + i * 5000),
      reported: false,
      delete_password,
      replies: []
    };
    for (j = 0; j < numReplies; j++) {
      const reply = {
        _id: ObjectId(),
        text: `Reply ${j + 1} for ${baseText} - ${i + 1}`,
        created_on: new Date(anHourFromNow + i * 5000 + j * 1000),
        reported: false,
        delete_password
      };
      thread.replies.push(reply);
    }
    results.push(thread);
  }
  return results;
}

function getThread(board, thread_id, done) {
  MongoClient.connect(DB_CONN, { useUnifiedTopology: true }, function(
    err,
    client
  ) {
    if (err) {
      console.log(err);
      done();
      return;
    }
    const db = client.db(DB_NAME);
    db.collection("threads")
      .findOne({ board, _id: ObjectId(thread_id) })
      .then(data => {
        done(data);
      })
      .finally(() => {
        client.close();
      });
  });
}
