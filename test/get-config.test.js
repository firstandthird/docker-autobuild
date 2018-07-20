const Rapptor = require('rapptor');
const tap = require('tap');
const path = require('path');

const workDir = path.resolve(__dirname, '../');

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

const testPayload = {
  secret: 'secret',
  event: 'push',
  repo: 'flatiron',
  branch: 'master',
  tag: '',
  user: 'james'
};

tap.test('getConfig', async (t) => {
  await start();
  const settings = rapptor.server.settings.app;
  const result = await rapptor.server.methods.getConfig(settings, testPayload);
  t.equal(result.length, 1);
  const bldpl = result[0];
  t.equal(bldpl.image, 'james/flatiron:concrete_master');
  t.equal(bldpl.config.type, 'branch');

  await stop();
  t.ok(true);
  t.end();
});

tap.test('getConfig non push', async (t) => {
  await start();
  const settings = rapptor.server.settings.app;
  const pl = Object.assign({}, testPayload);
  pl.event = 'pull';
  const result = await rapptor.server.methods.getConfig(settings, pl);

  t.equal(result.length, 0);
  t.same(result, []);

  await stop();
  t.ok(true);
  t.end();
});

tap.test('getConfig skip', async (t) => {
  await start();
  const settings = rapptor.server.settings.app;
  const pl = Object.assign({}, testPayload);
  pl.repo = 'transamerica';

  const result = await rapptor.server.methods.getConfig(settings, pl);

  t.equal(result.length, 0);

  await stop();
  t.ok(true);
  t.end();
});

tap.test('getConfig name Match', async (t) => {
  await start();
  const settings = rapptor.server.settings.app;
  const pl = Object.assign(testPayload, {});
  pl.repo = 'chrysler-building';

  const result = await rapptor.server.methods.getConfig(settings, pl);
  t.equal(result.length, 1);

  await stop();
  t.ok(true);
  t.end();
});

tap.test('getConfig tag Match nameExp', async (t) => {
  await start();
  const settings = rapptor.server.settings.app;
  const pl = Object.assign(testPayload, {});
  pl.repo = 'ford-building';
  pl.branch = '';
  pl.tag = 'tag1';
  const result = await rapptor.server.methods.getConfig(settings, pl);
  t.equal(result.length, 1);

  await stop();
  t.ok(true);
  t.end();
});

tap.test('getConfig tag Match', async (t) => {
  await start();
  const settings = rapptor.server.settings.app;
  const pl = Object.assign(testPayload, {});
  pl.repo = 'ford-building';
  pl.branch = '';
  pl.tag = 'tag3';
  const result = await rapptor.server.methods.getConfig(settings, pl);
  t.equal(result.length, 1);

  await stop();
  t.ok(true);
  t.end();
});
