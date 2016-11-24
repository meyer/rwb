'use strict';

const WebpackDevServer = require('webpack-dev-server');
const fs = require('fs-extra');
const invariant = require('invariant');
const path = require('path');
const temp = require('temp');
const webpack = require('webpack');

const utils = require('../utils');

exports.command = 'serve [port]';
exports.describe = 'Serve React component in a hot-reloading environment';

exports.builder = function(yargs) {
  return yargs
    .default('port', 3000);
};

exports.handler = function serveHandler(argv) {
  const packageJsonData = utils.loadProjectPkg();
  const RWB_PORT = process.env.RWB_PORT || parseInt(argv.port) || 3000;
  const RWB_PUBLIC_URL = process.env.RWB_PUBLIC_URL || `http://localhost:${RWB_PORT}/`;

  invariant(
    typeof packageJsonData === 'object' && typeof packageJsonData.rwb === 'object',
    'rwb key does not exist in package.json. Did you forget to run `rwb init`?'
  );

  const mountPoint = utils.parseIDString(packageJsonData.rwb.dom_node);

  temp.track();
  temp.mkdir('rwb-serve', function(err, dirPath) {
    invariant(!err, `temp.mkdir error: ${err}`);

    const documentContents = [
      '<!doctype html>',
      '<meta charset="utf-8">',
      '<title>rwb</title>',
      utils.buildMountPoint(mountPoint),
      '<script src="/bundle.js"></script>',
    ].join('\n');

    fs.writeFileSync(
      path.join(dirPath, 'index.html'),
      documentContents,
      {encoding: 'utf8'}
    );

    const config = require('../webpack/generateConfig')('client');
    config.output.path = dirPath;
    config.output.publicPath = '/';

    const compiler = webpack(config);
    new WebpackDevServer(compiler, {
      contentBase: dirPath,
      publicPath: config.output.publicPath,
      hot: true,
      historyApiFallback: true,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    }).listen(RWB_PORT, function (err) {
      invariant(!err, `WebpackDevServer error: ${err}`);
      console.info(`Serving ${dirPath} at ${RWB_PUBLIC_URL}`);
    });
  });
};
