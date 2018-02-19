const Rapptor = require('rapptor');
const tap = require('tap');
const path = require('path');
const util = require('util');

const workDir = path.resolve(__dirname, '../');

const wait = util.promisify(setTimeout);

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
      name: '.*',
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

tap.test('configuration for tag settings', async (t) => {
  await start();

  rapptor.server.methods.build = function(data, settings, obj) {
    t.equal(data.length, 1);
    t.same(data[0].config, {
      type: 'tag',
      name: '.*',
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
      name: '.*',
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

tap.test('verify hooks are called with correct payload', async (t) => {
  await start();

  rapptor.server.methods.build = async function(data, settings, obj) {
    t.equal(data.length, 1);
    await rapptor.server.methods.processHooks(data[0]);

    return true;
  };

  rapptor.server.route({
    path: '/hook-route',
    method: '*',
    handler(request, h) {
      t.same(request.payload, {
        branch: 'floor-twenty-four',
        name: 'florence-gin',
        image: 'gustave/flatiron:concrete_floor-twenty-four'
      });
      return { success: 1 };
    }
  });

  const res = await rapptor.server.inject({
    url: '/manual',
    method: 'post',
    payload: {
      event: 'push',
      secret: 'secret',
      user: 'gustave',
      repo: 'flatiron',
      branch: 'floor-twenty-four'
    }
  });

  t.equal(res.statusCode, 200);

  await wait(500);

  await stop();

  t.ok(true);
  t.end();
});

tap.test('multiple hooks', async (t) => {
  await start();

  rapptor.server.methods.build = async function(data, settings, obj) {
    t.equal(data.length, 1);
    await rapptor.server.methods.processHooks(data[0]);

    return true;
  };

  rapptor.server.route({
    path: '/hook-route',
    method: '*',
    handler(request, h) {
      t.same(request.payload, {
        branch: 'wood_exterior',
        name: 'frank-ocean',
        image: 'radnofsky/the-dakota:doors_exterior'
      });
      return { success: 1 };
    }
  });

  rapptor.server.route({
    path: '/hook-route-two',
    method: '*',
    handler(request, h) {
      t.same(request.payload, {
        branch: 'french_exterior',
        name: 'frank-ocean',
        image: 'radnofsky/the-dakota:doors_exterior'
      });
      return { success: 1 };
    }
  });

  const res = await rapptor.server.inject({
    url: '/manual',
    method: 'post',
    payload: {
      event: 'push',
      secret: 'secret',
      user: 'radnofsky',
      repo: 'the-dakota',
      branch: 'exterior'
    }
  });

  t.equal(res.statusCode, 200);

  await wait(500);

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
