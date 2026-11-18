const assert = require("node:assert/strict");
const { test } = require("node:test");

const queries = [];
const db = {
  async query(text, params) {
    queries.push({ text, params });
    return { rows: [] };
  },
};

const dbPath = require.resolve("../db/db");
require.cache[dbPath] = {
  id: dbPath,
  filename: dbPath,
  loaded: true,
  exports: db,
};

const notificationController = require("../controllers/notificationController");

test("notification generation and retrieval exclude completed tasks, moves, and trips", async () => {
  queries.length = 0;

  await notificationController.generateNotifications(7);

  const moveQueries = queries.filter(({ text }) => /FROM moves t\s+WHERE/.test(text));
  const tripQueries = queries.filter(({ text }) => /FROM trips t\s+WHERE/.test(text));
  const taskQueries = queries.filter(({ text }) => /FROM tasks t\s+WHERE/.test(text));

  assert.equal(moveQueries.length, 4);
  assert.equal(tripQueries.length, 4);
  assert.equal(taskQueries.length, 4);
  for (const { text } of [...moveQueries, ...tripQueries, ...taskQueries]) {
    assert.match(text, /t\.completion_status = FALSE/);
  }

  queries.length = 0;
  const res = {
    body: undefined,
    json(body) {
      this.body = body;
    },
  };

  await notificationController.getAll({ user: { id: 7 }, query: {} }, res);

  const fetchQuery = queries.find(({ text }) => text.includes("SELECT n.* FROM notifications"));
  assert.ok(fetchQuery);
  assert.match(fetchQuery.text, /m\.completion_status = TRUE/);
  assert.match(fetchQuery.text, /tr\.completion_status = TRUE/);
  assert.match(fetchQuery.text, /t\.completion_status = TRUE/);
  assert.deepEqual(res.body, []);
});
