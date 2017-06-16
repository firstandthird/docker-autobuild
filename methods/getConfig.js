const confi = require('confi');

module.exports = function(settings, repoInfo, done) {
  const matchedConfig = [];

  if (repoInfo.event !== 'push') {
    return done(null, matchedConfig);
  }

  confi({
    configFile: settings.configPath,
    url: settings.configUrl,
    context: repoInfo
  }, (err, buildConfig) => {
    if (err) {
      return done(err);
    }
    const repoSettings = buildConfig.repos[repoInfo.repo];
    if (!repoSettings) {
      return done(null, matchedConfig);
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
      if (!tagName) {
        return;
      }
      matchedConfig.push({
        image: `${namespace}/${repoInfo.repo}:${tagName}`,
        hook: config.hook,
        repoInfo,
        config
      });
    });
    done(null, matchedConfig);
  });
};
