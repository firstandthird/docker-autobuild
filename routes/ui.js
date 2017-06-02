'use strict';
const Joi = require('joi');
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
  handler(request, reply) {
    const secret = request.query.secret;
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
    reply(null, html);
  }
};
