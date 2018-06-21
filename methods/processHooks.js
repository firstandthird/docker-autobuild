const wreck = require('wreck');
const fs = require('fs');
const varson = require('varson');
const cloneDeep = require('lodash.clonedeep');
module.exports = async function(item) {
  const server = this;
  if (typeof item.hook === 'string') {
    item.hooks = [{ url: item.hook }];
  }

  if (item.config.monorepo) {
    const folders = [];
    const dirs = fs.readdirSync(`./repos/${item.repoInfo.user}_${item.repoInfo.repo}`);
    dirs.forEach(d => {
      if (d[0] === '.') {
        return;
      }
      const st = fs.statSync(`./repos/${item.repoInfo.user}_${item.repoInfo.repo}/${d}`);
      if (st.isDirectory()) {
        try {
          fs.statSync(`./repos/${item.repoInfo.user}_${item.repoInfo.repo}/${d}/Dockerfile`);
          folders.push(d);
        } catch (e) {
          // Nothing to see here.
        }
      }
    });

    const newHooks = [];
    item.hooks.forEach(hk => {
      folders.forEach(folder => {
        const hkObj = cloneDeep(hk);
        newHooks.push(varson(hkObj, { folder }, { start: '{%', end: '%}' }));
      });
    });

    item.hooks = newHooks;
  }

  const sendHook = async function(hook) {
    if (!hook || !hook.url) {
      return;
    }
    if (!hook.payload) {
      hook.payload = {};
    }
    hook.payload.image = item.image;
    server.log(['hook', 'notice'], {
      message: `Sending webhook: ${hook.url}`,
      payload: hook.payload
    });
    await wreck.post(hook.url, {
      payload: JSON.stringify(hook.payload)
    });
    server.log(['hook'], {
      message: `Sent webhook: ${hook.url}`,
      payload: hook.payload
    });
  };

  const promiseArr = item.hooks.map((hk) => sendHook(hk));

  await Promise.all(promiseArr);

  return true;
};
