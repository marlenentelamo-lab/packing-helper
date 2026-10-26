const assert = require('node:assert/strict');
const { beforeEach, test } = require('node:test');

const databasePath = require.resolve('../db');
const queries = [];
require.cache[databasePath] = {
  id: databasePath,
  filename: databasePath,
  loaded: true,
  exports: {
    query: async (text, params) => {
      queries.push({ text, params });
      return { rows: [{ id: 42, owner_user_id: params?.[params.length - 1] }] };
    },
  },
};

const { ensureAuth } = require('../middleware/authMiddleware');
const tripController = require('../controllers/tripController');
const moveController = require('../controllers/moveController');

beforeEach(() => {
  queries.length = 0;
});

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

async function call(handler, req) {
  const res = responseRecorder();
  await handler(req, res);
  return res;
}

test('authentication middleware rejects requests without a session user', () => {
  let continued = false;
  const res = responseRecorder();
  ensureAuth({ session: {} }, res, () => {
    continued = true;
  });

  assert.equal(res.statusCode, 401);
  assert.equal(continued, false);
});

test('authentication middleware attaches the session user to the request', () => {
  const req = { session: { user: { id: 17 } } };
  let continued = false;
  ensureAuth(req, responseRecorder(), () => {
    continued = true;
  });

  assert.deepEqual(req.user, { id: 17 });
  assert.equal(continued, true);
});

for (const [resource, controller, dateField] of [
  ['trip', tripController, 'trip_date'],
  ['move', moveController, 'target_date'],
]) {
  const table = `${resource}s`;
  const getList = resource === 'trip' ? controller.getTrips : controller.getMoves;
  const getSingle = resource === 'trip' ? controller.getTrip : controller.getMove;
  const create = resource === 'trip' ? controller.createTrip : controller.createMove;
  const update = resource === 'trip' ? controller.updateTrip : controller.updateMove;
  const remove = resource === 'trip' ? controller.deleteTrip : controller.deleteMove;

  test(`${resource} list query is scoped to the signed-in user`, async () => {
    await call(getList, { user: { id: 17 } });
    assert.match(queries[0].text, new RegExp(`FROM ${table} WHERE owner_user_id = \\$1`));
    assert.deepEqual(queries[0].params, [17]);
  });

  test(`${resource} read query is scoped to the signed-in user`, async () => {
    await call(getSingle, { params: { id: '42' }, user: { id: 17 } });
    assert.match(queries[0].text, /owner_user_id = \$2/);
    assert.deepEqual(queries[0].params, ['42', 17]);
  });

  test(`${resource} creation stores the signed-in user's ID`, async () => {
    await call(create, {
      body: { name: 'Personal plan', [dateField]: '2030-01-02' },
      user: { id: 17 },
    });
    assert.match(queries[0].text, /owner_user_id/);
    assert.deepEqual(queries[0].params, ['Personal plan', '2030-01-02', 17]);
  });

  test(`${resource} updates and deletes require ownership`, async () => {
    await call(update, {
      params: { id: '42' },
      body: { name: 'Updated plan', [dateField]: '2030-02-03', completion_status: true },
      user: { id: 17 },
    });
    assert.match(queries[0].text, /completion_status = COALESCE\(\$3, completion_status\)/);
    assert.match(queries[0].text, /owner_user_id = \$5/);
    assert.deepEqual(queries[0].params, ['Updated plan', '2030-02-03', true, '42', 17]);

    await call(remove, { params: { id: '42' }, user: { id: 17 } });
    assert.match(queries[1].text, /owner_user_id = \$2/);
    assert.deepEqual(queries[1].params, ['42', 17]);
  });
}
