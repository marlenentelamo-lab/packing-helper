const assert = require('node:assert/strict');
const { beforeEach, test } = require('node:test');

const queries = [];
let pictureRows;
let cloudinaryDestroy;

const databasePath = require.resolve('../db/db');
require.cache[databasePath] = {
  id: databasePath,
  filename: databasePath,
  loaded: true,
  exports: {
    query: async (text, params) => {
      queries.push({ text, params });
      return { rows: text.includes('SELECT p.cloudinary_public_id') ? pictureRows : [{ id: 8 }] };
    },
  },
};

const cloudinaryPath = require.resolve('../config/cloudinary');
require.cache[cloudinaryPath] = {
  id: cloudinaryPath,
  filename: cloudinaryPath,
  loaded: true,
  exports: {
    uploader: {
      destroy: (...args) => cloudinaryDestroy(...args),
    },
  },
};

const { deletePicture } = require('../controllers/pictureController');

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

beforeEach(() => {
  queries.length = 0;
  pictureRows = [{ cloudinary_public_id: 'folder/image' }];
  cloudinaryDestroy = async () => ({ result: 'ok' });
});

test('picture deletion removes the owned Cloudinary asset and database row', async () => {
  let deletedPublicId;
  cloudinaryDestroy = async (publicId) => {
    deletedPublicId = publicId;
    return { result: 'ok' };
  };
  const res = responseRecorder();

  await deletePicture({ params: { id: '8' }, user: { id: 17 } }, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { message: 'Picture deleted' });
  assert.equal(deletedPublicId, 'folder/image');
  assert.match(queries[0].text, /owner_user_id = \$2/);
  assert.match(queries[1].text, /owner_user_id = \$2/);
  assert.deepEqual(queries.map(({ params }) => params), [['8', 17], ['8', 17]]);
});

test('picture deletion returns 404 for pictures not owned by the user', async () => {
  pictureRows = [];
  let cloudinaryCalled = false;
  cloudinaryDestroy = async () => {
    cloudinaryCalled = true;
  };
  const res = responseRecorder();

  await deletePicture({ params: { id: '8' }, user: { id: 17 } }, res);

  assert.equal(res.statusCode, 404);
  assert.deepEqual(res.body, { error: 'Picture not found' });
  assert.equal(cloudinaryCalled, false);
  assert.equal(queries.length, 1);
});

test('picture row is retained when Cloudinary deletion fails', async () => {
  cloudinaryDestroy = async () => {
    throw new Error('Cloudinary unavailable');
  };
  const res = responseRecorder();

  await deletePicture({ params: { id: '8' }, user: { id: 17 } }, res);

  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.body, { error: 'Cloudinary unavailable' });
  assert.equal(queries.length, 1);
});
