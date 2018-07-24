const runshell = require('runshell');

module.exports = async function(envVars) {
  const start = new Date().getTime();
  let results = '';
  try {
    const resultObj = await runshell('/home/app/builder', {
      log: true,
      verbose: true,
      env: envVars
    });
    ({ results } = resultObj);
  } catch (e) {
    throw e;
  }
  const duration = (new Date().getTime() - start) / 1000;
  const noDiff = (results.search('No difference in context') !== -1);

  return { success: 1, results, noDiff, duration };
};
