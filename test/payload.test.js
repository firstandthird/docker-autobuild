const Rapptor = require('rapptor');
const tap = require('tap');
const path = require('path');
// const util = require('util');

const workDir = path.resolve(__dirname, '../');

// const wait = util.promisify(setTimeout);

process.env.SECRET = 'secret';
process.env.CONFIG_PATH = './test/test-config.yml';

let rapptor;
const start = async function(cb) {
  rapptor = new Rapptor({
    cwd: workDir
  });
  await rapptor.start(cb);
};

const stop = async function() {
  await rapptor.stop();
};

tap.test('configuration for branch settings', async (t) => {
  await start();

  rapptor.server.methods.build = function(data, settings, obj) {
    t.equal(data.length, 1);
    t.same(data[0].config, {
      type: 'branch',
      nameExp: '.*',
      tagName: 'new-work-branch',
      namespace: 'james-george'
    });
  };

  const res = await rapptor.server.inject({
    url: '/manual',
    method: 'post',
    payload: {
      event: 'push',
      secret: 'secret',
      user: 'james',
      repo: 'chrysler-building',
      branch: 'new-work-branch'
    }
  });

  t.equal(res.statusCode, 200);

  await stop();

  t.ok(true);
  t.end();
});

tap.test('configuration for similar branch settings', async (t) => {
  await start();

  rapptor.server.methods.build = function(data, settings, obj) {
    t.equal(data.length, 1);
    t.same(data[0].config, {
      type: 'branch',
      nameExp: '.*',
      tagName: 'something_master',
      namespace: 'james-george'
    });
  };

  const res = await rapptor.server.inject({
    url: '/manual',
    method: 'post',
    payload: {
      event: 'push',
      secret: 'secret',
      user: 'james',
      repo: 'chrysler-building',
      branch: 'something_master'
    }
  });

  t.equal(res.statusCode, 200);

  rapptor.server.methods.build = function(data, settings, obj) {
    t.equal(data.length, 2);
    t.same(data[0].config, {
      type: 'branch',
      name: 'master',
      tagName: 'master',
      namespace: 'jgwentworth'
    });
  };

  const res2 = await rapptor.server.inject({
    url: '/manual',
    method: 'post',
    payload: {
      event: 'push',
      secret: 'secret',
      user: 'james',
      repo: 'chrysler-building',
      branch: 'master'
    }
  });

  t.equal(res2.statusCode, 200);

  await stop();

  t.ok(true);
  t.end();
});

tap.test('configuration for tag settings', async (t) => {
  await start();

  rapptor.server.methods.build = function(data, settings, obj) {
    t.equal(data.length, 1);
    t.same(data[0].config, {
      type: 'tag',
      nameExp: '.*',
      tagName: 'milestone-one',
      namespace: 'george-james'
    });
  };

  const res = await rapptor.server.inject({
    url: '/manual',
    method: 'post',
    payload: {
      event: 'push',
      secret: 'secret',
      user: 'james',
      repo: 'chrysler-building',
      tag: 'milestone-one'
    }
  });

  t.equal(res.statusCode, 200);

  await stop();

  t.ok(true);
  t.end();
});

tap.test('context set as option', async (t) => {
  await start();

  rapptor.server.methods.build = function(data, settings, obj) {
    t.equal(data.length, 1);
    t.same(data[0].config, {
      context: 'concrete',
      dockerfile: 'concrete/Dockerfile',
      type: 'branch',
      nameExp: '.*',
      tagName: 'floor-nine',
      namespace: 'gilbert-cass'
    });
  };

  const res = await rapptor.server.inject({
    url: '/manual',
    method: 'post',
    payload: {
      event: 'push',
      secret: 'secret',
      user: 'nick',
      repo: 'woolworth-building',
      branch: 'floor-nine'
    }
  });

  t.equal(res.statusCode, 200);

  await stop();

  t.ok(true);
  t.end();
});

tap.test('matches multiple', async (t) => {
  await start();

  rapptor.server.methods.build = function(data, settings, obj) {
    t.equal(data.length, 2);
  };

  const res = await rapptor.server.inject({
    url: '/manual',
    method: 'post',
    payload: {
      event: 'push',
      secret: 'secret',
      user: 'mike',
      repo: 'thirty-rock',
      branch: 'master'
    }
  });

  t.equal(res.statusCode, 200);

  await stop();

  t.ok(true);
  t.end();
});
