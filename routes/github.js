'use strict';
const crypto = require('crypto');
const Boom = require('boom');

exports.github = {
  method: 'POST',
  path: '/github',
  handler: {
    autoInject: {
      secret(settings, done) {
        done(null, settings.secret);
      },
      validate(secret, request, done) {
        const headerSig = request.headers['x-hub-signature'];
        const payload = request.payload;
        const sig = `sha1=${crypto.createHmac('sha1', secret).update(JSON.stringify(payload)).digest('hex')}`;
        // confirm signature:
        if (headerSig !== sig) {
          request.server.log(['github', 'secret'], 'Secret didnt match');
          return done(Boom.unauthorized('Permission Denied'));
        }
        done();
      },
      event(validate, request, done) {
        const event = request.headers['x-github-event'];
        if (event === 'push' && request.payload.deleted) {
          //if push and deleted, do nothing
          return done(null, 'delete');
        }
        done(null, event);
      },
      data(event, server, request, done) {
        const payload = request.payload;
        const data = {
          event,
          type: payload.ref_type ? payload.ref_type : null,
          user: payload.repository ? payload.repository.owner.login : null,
          repo: payload.repository ? payload.repository.name : null,
          tag: '',
          branch: ''
        };

        if (payload.ref) {
          if (payload.ref.startsWith('refs/tags')) {
            data.tag = payload.ref.replace('refs/tags/', '');
          } else {
            data.branch = payload.ref.replace('refs/heads/', '');
          }
        }
        server.log(['github', 'debug'], data);

        done(null, data);
      },
      send(reply, validate, done) {
        reply(null, 'ok');
        done();
      },
      config(server, settings, data, done) {
        server.methods.getConfig(settings, data, done);
      },
      build(server, settings, config, data, done) {
        server.methods.build(config, settings, data, done);
      }
    }
  }
};
