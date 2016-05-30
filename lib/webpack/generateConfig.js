'use strict';

const webpack = require('webpack');
const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

const projectRoot = process.cwd();
const rwbRoot = path.resolve(__dirname, '../../');
const projectModuleDir = path.join(projectRoot, 'node_modules');
const rwbModuleDir = path.join(rwbRoot, 'node_modules');

const NODE_ENV = process.env.NODE_ENV || 'development';
const WEBPACK_DEV_SERVER_PORT = process.env.WEBPACK_DEV_SERVER_PORT || 3000;
const WEBPACK_DEV_SERVER_URL = process.env.WEBPACK_DEV_SERVER_URL || `http://localhost:${WEBPACK_DEV_SERVER_PORT}/`;
const SKIP_SOURCEMAPS = !!JSON.parse(process.env.SKIP_SOURCEMAPS || 'false');
const DISABLE_CACHEBUSTER = !!JSON.parse(process.env.DISABLE_CACHEBUSTER || 'false');

const moduleRequireRoots = [
  // Prefer project node_modules, fall back to rwb modules
  projectModuleDir,
  rwbModuleDir,
];

function generateConfig(options) {
  const commonConfig = {
    entry: [],
    output: {},
    plugins: [],
    resolve: {
      root: moduleRequireRoots,
      alias: {},
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
              require.resolve('babel-plugin-add-module-exports'),
              require.resolve('babel-plugin-transform-object-rest-spread'),
            ],
          },
          include(absPath) {
            if (options.babelWhitelist) {
              return options.babelWhitelist(absPath);
            }
            return !/node_modules/.test(absPath);
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
            name: DISABLE_CACHEBUSTER ? '[path][name].[ext]' : 'image-[hash].[ext]',
          },
        },
        {
          test: /\.svg$/,
          loader: 'raw-loader',
        },
      ],
      postLoaders: [
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

  if (options.dest === 'client') {
    commonConfig.output = {
      filename: 'bundle.js',
      devtoolModuleFilenameTemplate: '[absolute-resource-path]',
    };

    commonConfig.devtool = SKIP_SOURCEMAPS ? undefined : 'cheap-module-eval-source-map';

    if (options.hot) {
      commonConfig.plugins.push(new webpack.HotModuleReplacementPlugin());

      commonConfig.entry.unshift(
        require.resolve('react-hot-loader/patch'),
        require.resolve('webpack-dev-server/client') + '?' + WEBPACK_DEV_SERVER_URL,
        require.resolve('webpack/hot/only-dev-server')
      );

      // TODO: better way to find babel loader?
      commonConfig.module.loaders[0].query.plugins.unshift(
        require.resolve('react-hot-loader/babel')
      );
    }

    commonConfig.plugins.push(new webpack.NoErrorsPlugin());

    commonConfig.module.loaders.push(
      {
        test: /\.css$/,
        loader: 'style-loader',
      },
      {
        test: /\.css$/,
        loader: 'css-loader',
        query: {
          localIdentName: '[name]__[local]___[hash:base64:5]',
          sourceMap: !SKIP_SOURCEMAPS,
        },
      }
    );
  } else if (options.dest === 'server') {
    commonConfig.output = {
      filename: DISABLE_CACHEBUSTER ? 'bundle.js' : 'bundle-[hash].js',
    };

    if (NODE_ENV === 'production') {
      commonConfig.plugins.push(new webpack.optimize.UglifyJsPlugin());
      commonConfig.plugins.push(new webpack.optimize.OccurenceOrderPlugin());
    }

    commonConfig.plugins.push(
      new ExtractTextPlugin(DISABLE_CACHEBUSTER ? 'style.css' : 'style-[contenthash].css')
    );

    commonConfig.module.loaders.push(
      {
        test: /\.css$/,
        loader: ExtractTextPlugin.extract('css-loader'),
      }
    );
  } else {
    throw new Error('generateConfig only supports `client` and `server` values.');
  }

  return commonConfig;
}

module.exports = generateConfig;
