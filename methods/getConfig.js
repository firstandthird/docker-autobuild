const confi = require('confi');

module.exports = async function(settings, repoInfo) {
  const matchedConfig = [];

  if (repoInfo.event !== 'push') {
    return [];
  }

  let configUrl = settings.configUrl;
  if (configUrl) {
    configUrl = configUrl
      .replace('{user}', repoInfo.user)
      .replace('{repo}', repoInfo.repo);
  }

  const buildConfig = await confi({
    configFile: settings.configPath,
    url: configUrl,
    context: repoInfo
  });
  const repoSettings = buildConfig.repos[repoInfo.repo];
  if (!repoSettings) {
    return [];
  }

  repoSettings.forEach((config) => {
    const namespace = config.namespace || repoInfo.user;
    let tagName;
    if (config.type === 'branch' && repoInfo.branch && repoInfo.branch.match(config.name)) {
      tagName = config.tagName || repoInfo.branch;
    }
    if (config.type === 'tag' && repoInfo.tag && repoInfo.tag.match(config.name)) {
      tagName = config.tagName || repoInfo.tag;
    }
    if (config.skip) {
      if (config.type === 'branch' && repoInfo.branch === config.skip) {
        return;
      }
      if (config.type === 'tag' && repoInfo.tag === config.skip) {
        return;
      }
    }
    if (!tagName) {
      return;
    }

    const repoName = config.repoName || repoInfo.repo;
    // For backwards compatability.
    const hooks = (config.hooks) ? config.hooks : [config.hook];

    matchedConfig.push({
      image: `${namespace}/${repoName}:${tagName}`,
      hooks,
      repoInfo,
      config
    });
  });
  return matchedConfig;
};
