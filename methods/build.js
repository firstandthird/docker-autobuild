const qs = require('qs');


module.exports = function (config, settings, data) {
  const server = this;
  if (config.length === 0) {
    server.log(['github', 'debug'], { message: 'no matches, skipping', data });
  }
  const buildService = async function(item) {
    let before = data.before || null;

    if (item.config.alwaysBuild) {
      before = null;
    }

    const envVars = {
      USER: data.user,
      REPO: data.repo,
      DOCKER_REGISTRY: item.config.namespace,
      BRANCH: data.branch || data.tag,
      TOKEN: settings.githubToken,
      DOCKERFILE: item.config.dockerfile || 'Dockerfile',
      BEFORE: before || '',
      MONOREPO: item.config.monorepo || false,
      CONTEXT: item.config.context || '.',
      DEBUG: 1,
    };

    if (item.config.tagPrefix) {
      envVars.TAG_PREFIX = item.config.tagPrefix;
    }

    if (item.config.hook) {
      envVars.WEBHOOK = item.config.hook.urls;
      envVars.WEBHOOK_DATA = qs.stringify(item.config.hook.payload, { encode: false });
    }

    if (item.config.monorepo && item.config.monorepoHook) {
      envVars.WEBHOOK_MONOREPO = item.config.monorepoHook.urls;
      envVars.WEBHOOK_DATA = qs.stringify(item.config.monorepoHook.payload);
    }

    server.log(['builder', 'notice', envVars.USER, envVars.REPO, envVars.BRANCH], {
      message: `Building: ${envVars.USER}/${envVars.REPO} branch:${envVars.BRANCH}`,
      envs: envVars
    });
    let results = {};
    try {
      results = await server.methods.runBuilder(envVars);
    } catch (e) {
      server.log(['docker-autobuild', 'build', 'error'], { message: `Error: ${envVars.USER}/${envVars.REPO} branch:${envVars.BRANCH} failed to build`, err: e, envVars });
      return;
    }
    if (!results.noDiff) {
      const branch = data.branch || data.tag;
      server.log(['builder', 'success', envVars.USER, envVars.REPO, envVars.BRANCH], {
        message: `Success: ${data.user}/${data.repo} branch:${branch} built in ${results.duration}s`,
        user: data.user,
        repo: data.repo,
        branch,
        dockerfile: item.config.dockerfile || 'Dockerfile',
        context: item.config.context || '.',
        before
      });
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
