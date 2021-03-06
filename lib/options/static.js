'use strict';

const fs = require('fs-extra');
const path = require('path');
const readlineSync = require('readline-sync');
const webpack = require('webpack');
const webpackRequire = require('webpack-require');
const invariant = require('invariant');

const utils = require('../utils');

exports.command = 'static [destination]';
exports.describe = 'Static render React component to provided directory';

exports.builder = function builder(yargs) {
  return yargs
    .showHelpOnFail(false)
    .default('destination', 'dist');
};

exports.handler = function staticHandler(argv) {
  const projectRoot = process.cwd();
  const fileDest = path.resolve(argv.destination);
  const packageJsonData = utils.loadProjectPkg();

  if (!packageJsonData.rwb.static_generator) {
    console.info('Looks like this is your first time running `rwb static`.');
    const doIt = readlineSync.question('Copy static generator to your project folder? [Y/n]: ', {defaultInput: 'y'}) === 'y';
    if (doIt) {
      fs.copySync(
        path.resolve(__dirname, '..', 'template/render-static-page.js'),
        path.join(projectRoot, 'render-static-page.js'),
        {clobber: false}
      );
      packageJsonData.rwb = packageJsonData.rwb || {};
      packageJsonData.rwb.static_generator = './render-static-page.js';

      // Update package.json
      fs.writeJsonSync('package.json', packageJsonData);

      console.info('Copied render-static-page.js to project folder.');
      process.exit(0);
    } else {
      console.error('rwb.static_generator key is not set in package.json');
      process.exit(1);
    }
  }

  const mountPoint = utils.parseIDString(packageJsonData.rwb.dom_node);

  if (!fs.existsSync(fileDest)) {
    fs.mkdirSync(fileDest);
  }

  let assetPath = '/';
  if (process.env.RWB_PUBLIC_PATH) {
    // webpack assumes output.publicPath has a trailing slash
    assetPath = path.join(path.resolve('/', process.env.RWB_PUBLIC_PATH), '/');
  }

  const config = require('../webpack/getServerConfig')();
  config.output.path = path.join(fileDest, assetPath);
  config.output.publicPath = assetPath;

  webpack(config).run(function(err, stats) {
    invariant(!err, err);
    console.info(stats.toString());

    const statsObj = stats.toJson();
    const assets = {
      css: [],
      js: [],
    };

    if (statsObj.assetsByChunkName && Array.isArray(statsObj.assetsByChunkName.main)) {
      statsObj.assetsByChunkName.main.forEach(function(f) {
        const ext = path.extname(f).replace(/^\./, '');
        const asset = path.join(statsObj.publicPath || '/', f);
        if (ext === '') {
          assets['misc'] = assets['misc'] || [];
          assets['misc'].push(asset);
        } else {
          assets[ext] = assets[ext] || [];
          assets[ext].push(asset);
        }
      });
    }

    webpackRequire(
      config,
      path.join(projectRoot, packageJsonData.rwb.static_generator),
      ['fs'],
      {
        console,
        RWB: {
          DOM_NODE_ID: mountPoint[1],
          DOM_NODE_ELEMENT: mountPoint[0],
          PROJECT_ROOT: projectRoot,
          STATIC_ROOT: path.resolve(projectRoot, fileDest),
          ASSETS: assets,
          STATS: statsObj,
        },
      },
      function(err, factory) {
        invariant(!err, err);
        factory()();
      }
    );
  });
};
