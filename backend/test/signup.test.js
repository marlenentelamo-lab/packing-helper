const assert = require("node:assert/strict");
const { test } = require("node:test");
const bcrypt = require("bcryptjs");

const pool = {
  async query(text, params) {
    assert.match(text, /INSERT INTO users/);
    assert.equal(params[0], "New User");
    assert.equal(params[1], "new@example.com");
    assert.equal(await bcrypt.compare("password123", params[2]), true);
    return { rows: [{ id: 1, name: "New User", email: "new@example.com" }] };
  },
};

const dbPath = require.resolve("../db/db");
require.cache[dbPath] = {
  id: dbPath,
  filename: dbPath,
  loaded: true,
  exports: pool,
};

const authController = require("../controllers/authController");

function responseRecorder() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

test("signup creates a session for the newly registered user", async () => {
  const req = {
    body: { name: "New User", email: " NEW@example.com ", password: "password123" },
    session: {},
  };
  const res = responseRecorder();

  await authController.signup(req, res);

  const user = { id: 1, name: "New User", email: "new@example.com" };
  assert.equal(res.statusCode, 201);
  assert.deepEqual(req.session.user, user);
  assert.deepEqual(res.body.user, user);
});
