const async = require('async');
const runshell = require('runshell');
module.exports = function(config, settings, data, done) {
  const server = this;
  const hooks = [];
  if (config.length === 0) {
    server.log(['github', 'debug'], { message: 'no matches, skipping', data });
  }
  async.eachSeries(config, (item, next) => {
    server.log(['builder', 'notice', item.image], `Building ${item.image}`);
    const start = new Date().getTime();
    runshell('/home/app/builder', {
      log: true,
      verbose: true,
      env: {
        USER: data.user,
        REPO: data.repo,
        BRANCH: data.branch || data.tag,
        TOKEN: settings.githubToken,
        IMAGE_NAME: item.image,
        DEBUG: 1
      }
    }, (err) => {
      server.log(['builder', 'notice'], 'Build complete');
      if (err) {
        server.log(['builder', 'error', item.image], err);
      } else {
        const duration = (new Date().getTime() - start) / 1000;
        server.log(['builder', 'success', item.image], {
          message: `${item.image} built successfully in ${duration}s`,
          item,
          duration
        });
        if (item.hook) {
          hooks.push(item);
        }
      }
      next();
    });
  }, (err) => {
    if (err) {
      return done(err);
    }
    done(null, hooks);
  });
};
