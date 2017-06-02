const async = require('async');
const wreck = require('wreck');
module.exports = function(build, done) {
  const server = this;
  async.each(build, (item, next) => {
    server.log(['hook', 'notice'], {
      message: `Sending webhook: ${item.hook}`,
      item
    });
    wreck.post(item.hook, {
      payload: JSON.stringify({
        image: item.image,
        item
      })
    }, (err) => {
      if (err) {
        server.log(['hook', 'error', item.hook, item.image], err);
      } else {
        server.log(['hook', 'success'], item);
      }
      next();
    });
  }, done);
};
