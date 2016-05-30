'use strict';
const path = require('path');
const webpack = require('webpack');

const generateConfig = require('./generateConfig');
const utils = require('../utils');

const projectRoot = process.cwd();
const rwbRoot = path.resolve(__dirname, '../../');
const projectModuleDir = path.join(projectRoot, 'node_modules');
const rwbModuleDir = path.join(rwbRoot, 'node_modules');

const {pkgData} = utils.loadProjectPkg();
const rootComponentPath = path.join(projectRoot, pkgData.rwb.main);
const mountPoint = utils.parseIDString(pkgData.rwb.dom_node);

function rwbWebpackConfig() {
  const entrypoint = require.resolve('../entrypoint.js');

  const config = generateConfig({
    dest: 'client',
    hot: true,
    babelWhitelist(absPath) {
      return (
        absPath === entrypoint ||
        (!!~absPath.indexOf(rwbRoot) && !~absPath.indexOf(rwbModuleDir)) ||
        (!!~absPath.indexOf(projectRoot) && !~absPath.indexOf(projectModuleDir))
      );
    },
  });

  config.entry = entrypoint;
  config.plugins = [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      'RWB.DOM_NODE_ID': JSON.stringify(mountPoint[1]),
      'RWB.DOM_NODE_ELEMENT': JSON.stringify(mountPoint[0]),
      'RWB.PROJECT_ROOT': JSON.stringify(projectRoot),
    }),
  ];

  config.resolve.alias.__rwb_root__ = rootComponentPath;
}

module.exports = rwbWebpackConfig;
