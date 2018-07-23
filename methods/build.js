const qs = require('qs');


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

    const envVars = {
      USER: data.user,
      REPO: data.repo,
      BRANCH: data.branch || data.tag,
      TOKEN: settings.githubToken,
      DOCKERFILE: item.config.dockerfile || 'Dockerfile',
      BEFORE: before || '',
      MONOREPO: item.config.monorepo || false,
      CONTEXT: item.config.context || '.',
      DEBUG: 1,
    };

    if (item.config.hook) {
      envVars.WEBHOOK = item.config.hook.urls;
      envVars.WEBHOOK_DATA = qs.stringify(item.config.hook.payload);
    }

    if (item.config.monorepo && item.config.monorepoHook) {
      envVars.WEBHOOK_MONOREPO = item.config.hook.urls;
      envVars.WEBHOOK_DATA = qs.stringify(item.config.hook.payload);
      delete envVars.WEBHOOK;
    }

    server.log(['builder', 'notice', item.image], {
      message: `Building: ${item.image}`,
      envs: envVars
    });
    let results = {};
    try {
      results = await server.methods.runBuilder(envVars);
    } catch (e) {
      server.log(['docker-autobuild', 'build', 'error'], { message: `Error: ${envVars.IMAGE_NAME} failed to build`, err: e });
      return;
    }
    if (!results.noDiff) {
      server.log(['builder', 'success', item.image], {
        message: `Success: ${item.image} built in ${results.duration}s`,
        user: data.user,
        repo: data.repo,
        branch: data.branch || data.tag,
        dockerfile: item.config.dockerfile || 'Dockerfile',
        context: item.config.context || '.',
        before
      });
    }
  };

  const buildServices = function(list) {
    for (const d of list) {
      buildService(d);
    }
  };

  buildServices(config);
  return true;
};
