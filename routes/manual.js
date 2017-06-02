'use strict';
const Boom = require('boom');
const Joi = require('joi');

exports.github = {
  method: 'POST',
  path: '/manual',
  config: {
    validate: {
      payload: {
        secret: Joi.string().required(),
        event: Joi.string().required().default('push'),
        repo: Joi.string().required(),
        branch: Joi.string().optional().allow(''),
        tag: Joi.string().optional().allow(''),
        user: Joi.string().required()
      }
    }
  },
  handler: {
    autoInject: {
      secret(settings, done) {
        done(null, settings.secret);
      },
      validate(settings, server, request, done) {
        if (request.payload.secret !== settings.secret) {
          server.log(['manual', 'secret'], 'Secret didnt match');
          return done(Boom.unauthorized('Permission Denied'));
        }
        done();
      },
      data(server, request, done) {
        const payload = request.payload;
        if (!payload.tag && !payload.branch) {
          payload.branch = 'master';
        }
        server.log(['manual', 'debug'], payload);

        done(null, payload);
      },
      send(reply, validate, done) {
        reply(null, 'ok');
        done();
      },
      config(send, server, settings, data, done) {
        server.methods.getConfig(settings, data, done);
      },
      build(server, settings, config, data, done) {
        server.methods.build(config, settings, data, done);
      },
      hooks(server, build, done) {
        server.methods.processHooks(build, done);
      }
    }
  }
};
