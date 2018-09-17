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
        user: Joi.string().required(),
        context: Joi.string().optional().allow('')
      }
    }
  },
  async handler(request, h) {
    const server = request.server;
    const settings = server.settings.app;
    const secret = settings.secret;
    const payload = request.payload;

    if (payload.secret !== secret) {
      server.log(['manual', 'secret'], 'Secret didnt match');
      return Boom.unauthorized('Permission Denied');
    }
    payload.branch = payload.branch || '';
    if (!payload.tag && !payload.branch) {
      payload.branch = 'master';
    }
    payload.tag = payload.tag || '';
    server.log(['manual', 'debug'], payload);
    const config = await server.methods.getConfig(settings, payload);
    await server.methods.build(config, settings, payload);

    return { success: true };
  }
};
