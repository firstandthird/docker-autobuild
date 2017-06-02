'use strict';
const crypto = require('crypto');
const Boom = require('boom');
const runshell = require('runshell');
const async = require('async');
const wreck = require('wreck');
//const tmpl = require('tinytemplate');

exports.github = {
  method: 'POST',
  path: '/github',
  handler: {
    autoInject: {
      secret(settings, done) {
        done(null, settings.secret);
      },
      validate(secret, request, done) {
        const headerSig = request.headers['x-hub-signature'];
        const payload = request.payload;
        const sig = `sha1=${crypto.createHmac('sha1', secret).update(JSON.stringify(payload)).digest('hex')}`;
        // confirm signature:
        if (headerSig !== sig) {
          request.server.log(['github', 'secret'], 'Secret didnt match');
          return done(Boom.unauthorized('Permission Denied'));
        }
        done();
      },
      event(validate, request, done) {
        const event = request.headers['x-github-event'];
        if (event === 'push' && request.payload.deleted) {
          //if push and deleted, do nothing
          return done(null, 'delete');
        }
        done(null, event);
      },
      data(event, server, request, done) {
        const payload = request.payload;
        const data = {
          event,
          type: payload.ref_type ? payload.ref_type : null,
          user: payload.repository ? payload.repository.owner.login : null,
          repo: payload.repository ? payload.repository.name : null
        };

        if (payload.ref) {
          if (payload.ref.startsWith('refs/tags')) {
            data.tag = payload.ref.replace('refs/tags/', '');
          } else {
            data.branch = payload.ref.replace('refs/heads/', '');
          }
        }
        server.log(['github', 'debug'], data);

        done(null, data);
      },
      send(reply, validate, done) {
        reply(null, 'ok');
        done();
      },
      config(settings, data, done) {
        const matchedConfig = [];
        if (data.event !== 'push') {
          return done(null, matchedConfig);
        }
        const repoSettings = settings.repos[data.repo];
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
          //tagName = tmpl(tagName, { sourceref: data.tag || data.branch });
          matchedConfig.push({
            image: `${namespace}/${data.repo}:${tagName}`,
            hook: config.hook,
            data,
            config
          });
        });
        done(null, matchedConfig);
      },
      build(server, settings, config, data, done) {
        const hooks = [];
        if (config.length === 0) {
          server.log(['github', 'debug'], { message: 'no matches, skipping', data });
        }
        async.eachSeries(config, (item, next) => {
          server.log(['builder', 'notice', item.image], `Building ${item.image}`);
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
              DEBUG: 1
            }
          }, (err) => {
            if (err) {
              server.log(['builder', 'error', item.image], err);
            } else {
              const duration = (new Date().getTime() - start) / 1000;
              server.log(['builder', 'success', item.image], {
                message: `${item.image} built successfully in ${duration}s`,
                item,
                duration
              });
              if (item.hook) {
                hooks.push(item);
              }
            }
            next();
          });
        }, (err) => {
          if (err) {
            return done(err);
          }
          done(null, hooks);
        });
      },
      hooks(server, build, done) {
        async.each(build, (item, next) => {
          server.log(['hook', 'notice'], {
            message: `Sending webhook: ${item.hook}`,
            item
          });
          wreck.post(item.hook, {
            payload: JSON.stringify({
              image: item.image,
              item
            })
          }, (err) => {
            if (err) {
              server.log(['hook', 'error', item.hook, item.image], err);
            } else {
              server.log(['hook', 'success'], item);
            }
            next();
          });
        }, done);
      }
    }
  }
};
