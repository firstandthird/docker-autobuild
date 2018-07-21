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

tap.test('builder configs for branch settings', async (t) => {
  await start();

  rapptor.server.methods.runBuilder = function(envVars) {
    t.same(envVars, {
      USER: 'james',
      REPO: 'chrysler-building',
      BRANCH: 'new-work-branch',
      TOKEN: '',
      IMAGE_NAME: 'james-george/chrysler-building:new-work-branch',
      DOCKERFILE: 'Dockerfile',
      BEFORE: '',
      MONOREPO: false,
      CONTEXT: '.',
      DEBUG: 1
    });
    return { noDiff: false, duration: '7.0' };
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

tap.test('builder configs for hook settings', async (t) => {
  await start();

  rapptor.server.methods.runBuilder = function(envVars) {
    t.same(envVars, {
      USER: 'james',
      REPO: 'flatiron',
      BRANCH: 'hooks-branch',
      TOKEN: '',
      IMAGE_NAME: 'james/flatiron:concrete_hooks-branch',
      DOCKERFILE: 'concrete/Dockerfile',
      BEFORE: '',
      MONOREPO: false,
      CONTEXT: 'concrete',
      DEBUG: 1,
      WEBHOOK: 'http://localhost:8080/hook-route',
      WEBHOOK_DATA: 'something=new'
    });
    return { noDiff: false, duration: '7.0' };
  };

  const res = await rapptor.server.inject({
    url: '/manual',
    method: 'post',
    payload: {
      event: 'push',
      secret: 'secret',
      user: 'james',
      repo: 'flatiron',
      branch: 'hooks-branch'
    }
  });

  t.equal(res.statusCode, 200);

  await stop();

  t.ok(true);
  t.end();
});

tap.test('builder configs for monorepo hook settings', async (t) => {
  await start();

  rapptor.server.methods.runBuilder = function(envVars) {
    t.same(envVars, {
      USER: 'james',
      REPO: 'transamerica',
      BRANCH: 'hooks-branch',
      TOKEN: '',
      IMAGE_NAME: 'james/transamerica:concrete_hooks-branch',
      DOCKERFILE: 'concrete/Dockerfile',
      BEFORE: '',
      MONOREPO: true,
      CONTEXT: 'concrete',
      DEBUG: 1,
      WEBHOOK_MONOREPO: 'http://localhost:8080/hook-route',
      WEBHOOK_DATA: 'something=new'
    });
    return { noDiff: false, duration: '7.0' };
  };

  const res = await rapptor.server.inject({
    url: '/manual',
    method: 'post',
    payload: {
      event: 'push',
      secret: 'secret',
      user: 'james',
      repo: 'transamerica',
      branch: 'hooks-branch'
    }
  });

  t.equal(res.statusCode, 200);

  await stop();

  t.ok(true);
  t.end();
});

tap.test('builder configs for multiple matches', async (t) => {
  await start();
  let count = 0;
  rapptor.server.methods.runBuilder = async function(envVars) {
    count = count + 1;
    await wait(10);
    return { noDiff: false, duration: '7.0' };
  };

  const res = await rapptor.server.inject({
    url: '/manual',
    method: 'post',
    payload: {
      event: 'push',
      secret: 'secret',
      user: 'james',
      repo: 'thirty-rock',
      branch: 'master'
    }
  });

  t.equal(res.statusCode, 200);

  await stop();
  t.equals(count, 2);
  t.ok(true);
  t.end();
});

