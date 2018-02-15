const wreck = require('wreck');

module.exports = async function(item) {
  const server = this;
  if (typeof item.hook === 'string') {
    item.hooks = [{ url: item.hook }];
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
