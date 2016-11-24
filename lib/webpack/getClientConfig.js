'use strict';

const webpack = require('webpack');
const path = require('path');

const utils = require('../utils');

const projectRoot = process.cwd();
const rwbRoot = path.resolve(__dirname, '../../');
const projectModuleDir = path.join(projectRoot, 'node_modules');
const rwbModuleDir = path.join(rwbRoot, 'node_modules');

const packageJsonData = utils.loadProjectPkg();
const rootComponentPath = path.join(projectRoot, packageJsonData.rwb.main);
const mountPoint = utils.parseIDString(packageJsonData.rwb.dom_node);

const NODE_ENV = process.env.NODE_ENV || 'development';
const RWB_PORT = process.env.RWB_PORT || 3000;
const RWB_PUBLIC_URL = process.env.RWB_PUBLIC_URL || `http://localhost:${RWB_PORT}/`;
const RWB_SKIP_SOURCEMAPS = !!JSON.parse(process.env.RWB_SKIP_SOURCEMAPS || 'false');
const RWB_DISABLE_CACHEBUSTER = !!JSON.parse(process.env.RWB_DISABLE_CACHEBUSTER || 'false');

function getClientConfig() {
  const moduleRequireRoots = [
    // Prefer project node_modules, fall back to rwb modules
    projectModuleDir,
    rwbModuleDir,
  ];

  const entrypoint = require.resolve('../entrypoint.js');

  const clientConfig = {
    entry: [
      require.resolve('react-hot-loader/patch'),
      require.resolve('webpack-dev-server/client') + '?' + RWB_PUBLIC_URL,
      require.resolve('webpack/hot/only-dev-server'),
      entrypoint,
    ],

    output: {
      // path: dirPath,
      // publicPath: '/',
      filename: 'bundle.js',
      devtoolModuleFilenameTemplate: '[absolute-resource-path]',
    },

    devtool: RWB_SKIP_SOURCEMAPS ? undefined : 'cheap-module-eval-source-map',

    plugins: [
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(NODE_ENV),
        'RWB.DOM_NODE_ID': JSON.stringify(mountPoint[1]),
        'RWB.DOM_NODE_ELEMENT': JSON.stringify(mountPoint[0]),
        'RWB.PROJECT_ROOT': JSON.stringify(projectRoot),
      }),
      new webpack.HotModuleReplacementPlugin(),
      new webpack.NoErrorsPlugin(),
    ],

    resolve: {
      root: moduleRequireRoots,
      alias: {
        __rwb_root__: rootComponentPath,
      },
      extensions: ['.web.js', '', '.js', '.json'],
    },

    resolveLoader: {
      root: moduleRequireRoots,
    },

    module: {
      loaders: [
        {
          // seems Babel freaks out unless everything is absolute
          test: /\.js$/,
          loader: require.resolve('babel-loader'),
          query: {
            presets: [
              require.resolve('babel-preset-react'),
              require.resolve('babel-preset-es2015'),
            ],
            plugins: [
              require.resolve('react-hot-loader/babel'),
              require.resolve('babel-plugin-add-module-exports'),
              require.resolve('babel-plugin-transform-object-rest-spread'),
            ],
          },
          include(absPath) {
            return (
              absPath === entrypoint ||
              (!!~absPath.indexOf(rwbRoot) && !~absPath.indexOf(rwbModuleDir)) ||
              (!!~absPath.indexOf(projectRoot) && !~absPath.indexOf(projectModuleDir))
            );
          },
        },
        {
          test: /\.json$/,
          loader: 'json-loader',
        },
        {
          test: /\.(png|jpg)$/,
          loader: 'url-loader',
          query: {
            limit: 8192,
            name: RWB_DISABLE_CACHEBUSTER ? '[path][name].[ext]' : 'image-[hash].[ext]',
          },
        },
        {
          test: /\.svg$/,
          loader: 'raw-loader',
        },
        {
          test: /\.svg$/,
          loader: 'svgo-loader',
          query: {
            plugins: [
              {removeTitle: true},
              {convertPathData: false},
            ],
          },
        },
        {
          test: /\.css$/,
          loader: 'style-loader',
        },
        {
          test: /\.css$/,
          loader: 'css-loader',
          query: {
            localIdentName: '[name]__[local]___[hash:base64:5]',
            sourceMap: !RWB_SKIP_SOURCEMAPS,
          },
        },
        {
          test: /\.css$/,
          loader: 'postcss-loader',
        },
      ],
    },

    postcss() {
      return [
        require('autoprefixer'),
      ];
    },
  };

  return clientConfig;
}

module.exports = getClientConfig;
