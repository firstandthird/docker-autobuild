const confi = require('confi');

module.exports = function(settings, data, done) {
  const matchedConfig = [];
  
  if (data.event !== 'push') {
    return done(null, matchedConfig);
  }
  
  confi({
    configFile: settings.configPath,
    url: settings.configUrl
  }, (err, config) => {
    const repoSettings = config.repos[data.repo];
    if (!repoSettings) {
      return done(null, matchedConfig);
    }
    repoSettings.forEach((config) => {
      const namespace = config.namespace || data.user;
      let tagName;
      if (config.type === 'branch' && data.branch && data.branch.match(config.name)) {
        tagName = config.tagName || data.branch;
      }
      if (config.type === 'tag' && data.tag && data.tag.match(config.name)) {
        tagName = config.tagName || data.tag;
      }
      if (!tagName) {
        return;
      }
      if (tagName === '${sourceref}') {
        tagName = data.tag || data.branch;
      }
      matchedConfig.push({
        image: `${namespace}/${data.repo}:${tagName}`,
        hook: config.hook,
        data,
        config
      });
    });
    done(null, matchedConfig);
  });
};
