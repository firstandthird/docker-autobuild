'use strict';
const crypto = require('crypto');
const Boom = require('boom');

exports.github = {
  method: 'POST',
  path: '/github',
  async handler(request, h) {
    const server = request.server;
    const settings = server.settings.app;
    const secret = settings.secret;

    const headerSig = request.headers['x-hub-signature'];
    const payload = request.payload;
    const sig = `sha1=${crypto.createHmac('sha1', secret).update(JSON.stringify(payload)).digest('hex')}`;

    if (headerSig !== sig) {
      server.log(['github', 'secret'], 'Secret did not match');
      throw Boom.unauthorized('Permission Denied');
    }
    let event = request.headers['x-github-event'];
    if (event === 'push' && request.payload.deleted) {
      event = 'delete';
    }

    const data = {
      event,
      type: payload.ref_type ? payload.ref_type : null,
      user: payload.repository ? payload.repository.owner.login : null,
      repo: payload.repository ? payload.repository.name : null,
      tag: '',
      branch: ''
    };
    const before = payload.before;
    if (before && before.substr(0, 4) !== '0000') {
      data.before = before;
    }

    if (payload.ref) {
      if (payload.ref.startsWith('refs/tags')) {
        data.tag = payload.ref.replace('refs/tags/', '');
      } else {
        data.branch = payload.ref.replace('refs/heads/', '');
      }
    }
    server.log(['github', 'debug'], data);

    const config = await server.methods.getConfig(settings, data);
    if (config.skipGithub) {
      server.log(['github', 'hook'], { message: 'Skipping build', data });
      return { success: 'true' };
    }
    await server.methods.build(config, settings, data);

    return { success: 'true' };
  }
};
