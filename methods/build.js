const runshell = require('runshell');

module.exports = function (config, settings, data) {
  const server = this;
  if (config.length === 0) {
    server.log(['github', 'debug'], { message: 'no matches, skipping', data });
  }

  const buildService = async function(item) {
    let before = data.before;
    if (item.config.alwaysBuild) {
      before = null;
    }

    server.log(['builder', 'notice', item.image], {
      message: `Building: ${item.image}`,
      user: data.user,
      repo: data.repo,
      branch: data.branch || data.tag,
      dockerfile: item.config.dockerfile || 'Dockerfile',
      context: item.config.context || '.',
      before
    });

    const start = new Date().getTime();
    let results = '';
    try {
      const resultObj = await runshell('/home/app/builder', {
        log: true,
        verbose: true,
        env: {
          USER: data.user,
          REPO: data.repo,
          BRANCH: data.branch || data.tag,
          TOKEN: settings.githubToken,
          IMAGE_NAME: item.image,
          DOCKERFILE: item.config.dockerfile || 'Dockerfile',
          BEFORE: before || '',
          CONTEXT: item.config.context || '.',
          DEBUG: 1
        }
      });
      ({ results } = resultObj);
    } catch (e) {
      server.log(['docker-autobuild', 'build', 'error'], { message: `Error: ${item.image} failed to build`, err: e });
      return;
    }
    const duration = (new Date().getTime() - start) / 1000;
    const noDiff = (results.search('No difference in context') !== -1);
    if (!noDiff) {
      server.log(['builder', 'success', item.image], {
        message: `Success: ${item.image} built in ${duration}s`,
        user: data.user,
        repo: data.repo,
        branch: data.branch || data.tag,
        dockerfile: item.config.dockerfile || 'Dockerfile',
        context: item.config.context || '.',
        before
      });
    }
    if (item.hooks && !noDiff) {
      try {
        await server.methods.processHooks(item);
      } catch (e) {
        const err = (e.output) ? { message: `Error: ${item.image} hook error`, output: e.output } : { message: `Error: ${item.image} hook error`, err: e };
        server.log(['docker-autobuild', 'hook', 'error'], err);
      }
    }
  };

  const buildServices = async function(list) {
    for (const d of list) {
      await buildService(d); // eslint-disable-line no-await-in-loop
    }
  };

  buildServices(config);

  return true;
};
