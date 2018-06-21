'use strict';
const Joi = require('joi');
const Boom = require('boom');
exports.ui = {
  path: '/ui',
  method: 'GET',
  config: {
    validate: {
      query: {
        secret: Joi.string().required()
      }
    }
  },
  handler(request, h) {
    const secret = request.query.secret;
    if (secret !== request.server.settings.app.secret) {
      throw Boom.unauthorized('Secret not valid');
    }
    const html = `
      <html>
        <form action="/manual" method="POST">
          <input type="hidden" name="secret" value="${secret}"/>
          <label>Type</label>
          <select name="event">
            <option value="push">Push</option>
            <option value="delete">Delete</option>
          </select>
          <label>User</label>
          <input type="text" name="user" value="${request.query.user || ''}"/>
          <label>Repo</label>
          <input type="text" name="repo" value="${request.query.repo || ''}"/>
          <label>Branch</label>
          <input type="text" name="branch" value=""/>
          <label>Tag</label>
          <input type="text" name="tag" value=""/>
          <input type="submit" value="Build"/>
        </form>
      </html>
    `;
    return html;
  }
};
