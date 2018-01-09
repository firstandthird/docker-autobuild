const wreck = require('wreck');
const async = require('async');

module.exports = function(item, done) {
  const server = this;
  if (typeof item.hook === 'string') {
    item.hooks = [{ url: item.hook }];
  }

  async.each(item.hooks, (hook, cb) => {
    if (!hook || !hook.url) {
      return cb();
    }
    if (!hook.payload) {
      hook.payload = {};
    }
    hook.payload.image = item.image;
    server.log(['hook', 'notice'], {
      message: `Sending webhook: ${hook.url}`,
      payload: hook.payload
    });
    wreck.post(hook.url, {
      payload: JSON.stringify(hook.payload)
    }, (err) => {
      if (err) {
        server.log(['hook', 'error', hook.url, item.image], err);
      } else {
        server.log(['hook'], {
          message: `Sent webhook: ${hook.url}`,
          payload: hook.payload
        });
      }
      cb();
    });
  }, done);
};
