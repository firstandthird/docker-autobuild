const async = require('async');
const runshell = require('runshell');
module.exports = function(config, settings, data, done) {
  const server = this;
  if (config.length === 0) {
    server.log(['github', 'debug'], { message: 'no matches, skipping', data });
  }
  async.eachSeries(config, (item, next) => {
    server.log(['builder', 'notice', item.image], {
      message: `Building: ${item.image}`,
      user: data.user,
      repo: data.repo,
      branch: data.branch || data.tag,
      dockerfile: item.config.dockerfile || 'Dockerfile',
      context: item.config.context || '.',
      before: data.before
    });
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
        DOCKERFILE: item.config.dockerfile || 'Dockerfile',
        BEFORE: data.before || '',
        CONTEXT: item.config.context || '.',
        NODE_ENV: settings.buildNodeEnv,
        DEBUG: 1
      }
    }, (err, output) => {
      if (err) {
        server.log(['builder', 'error', item.image], err);
      } else {
        const duration = (new Date().getTime() - start) / 1000;

        const noDiff = (output.search('No difference in context') !== -1);
        if (!noDiff) {
          server.log(['builder', 'success', item.image], {
            message: `Success: ${item.image} built in ${duration}s`,
            user: data.user,
            repo: data.repo,
            branch: data.branch || data.tag,
            dockerfile: item.config.dockerfile || 'Dockerfile',
            context: item.config.context || '.',
            before: data.before
          });
        }
        if (item.hooks && !noDiff) {
          return server.methods.processHooks(item, next);
        }
      }
      next();
    });
  }, (err) => {
    if (err) {
      return done(err);
    }
    done();
  });
};
