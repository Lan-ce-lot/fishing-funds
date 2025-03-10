import 'webpack-dev-server';
import path from 'path';
import fs from 'fs';
import webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import chalk from 'chalk';
import { merge } from 'webpack-merge';
import { execSync, spawn } from 'child_process';
import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin';
import baseConfig from './webpack.config.base.mjs';
import webpackPaths from './webpack.paths.mjs';
import checkNodeEnv from '../scripts/check-node-env.js';

// When an ESLint server is running, we can't set the NODE_ENV so we'll check if it's
// at the dev webpack config is not accidentally run in a production environment
if (process.env.NODE_ENV === 'production') {
  checkNodeEnv('development');
}

const port = process.env.PORT || 3456;
// const manifest = path.resolve(webpackPaths.dllPath, 'renderer.json');
const skipDLLs = false;
// module.parent?.filename.includes('webpack.config.renderer.dev.dll') ||
// module.parent?.filename.includes('webpack.config.eslint');

/**
 * Warn if the DLL is not built
 */
// if (
//   !skipDLLs &&
//   !(fs.existsSync(webpackPaths.dllPath) && fs.existsSync(manifest))
// ) {
//   console.log(
//     chalk.black.bgYellow.bold(
//       'The DLL files are missing. Sit back while we build them for you with "npm run build-dll"'
//     )
//   );
//   execSync('npm run postinstall');
// }

/**
 * @type {typeof import("webpack").Configuration }
 */
const configuration = {
  devtool: 'inline-source-map',

  mode: 'development',

  target: ['web', 'electron-renderer'],

  entry: path.join(webpackPaths.srcRendererPath, 'index.tsx'),

  output: {
    path: webpackPaths.distRendererPath,
    publicPath: '/',
    filename: 'renderer.dev.js',
    library: { type: 'module' },
  },

  experiments: {
    outputModule: true,
  },

  module: {
    rules: [
      {
        test: /\.s?css$/,
        use: [
          'style-loader',
          {
            loader: '@teamsupercell/typings-for-css-modules-loader',
          },
          {
            loader: 'css-loader',
            options: {
              modules: {
                localIdentName: '[name]__[local]__[hash:base64:5]',
              },
              sourceMap: true,
              importLoaders: 1,
            },
          },
          'sass-loader',
        ],
        include: /\.module\.s?(c|a)ss$/,
      },
      {
        test: /\.s?css$/,
        use: ['style-loader', 'css-loader', 'sass-loader'],
        exclude: /\.module\.s?(c|a)ss$/,
      },
      //Font Loader
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
      },
      // Images
      {
        test: /\.(png|jpg|jpeg|gif)$/i,
        resourceQuery: { not: [/url/] },
        type: 'asset/resource',
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg)$/i,
        type: 'asset/inline',
        resourceQuery: /url/,
      },
      // SVG
      {
        test: /\.svg$/,
        issuer: /\.[jt]sx?$/,
        resourceQuery: { not: [/url/] },
        use: ['@svgr/webpack'],
      },
    ],
  },
  plugins: [
    // ...(skipDLLs
    //   ? []
    //   : [
    //       new webpack.DllReferencePlugin({
    //         context: webpackPaths.dllPath,
    //         manifest,
    //         sourceType: 'var',
    //       }),
    //     ]),

    new webpack.NoEmitOnErrorsPlugin(),

    /**
     * Create global constants which can be configured at compile time.
     *
     * Useful for allowing different behaviour between development builds and
     * release builds
     *
     * NODE_ENV should be production so that modules do not perform certain
     * development checks
     *
     * By default, use 'development' as NODE_ENV. This can be overriden with
     * 'staging', for example, by changing the ENV variables in the npm scripts
     */
    new webpack.EnvironmentPlugin({
      NODE_ENV: 'development',
    }),

    new webpack.ProvidePlugin({
      React: 'react',
    }),

    new webpack.LoaderOptionsPlugin({
      debug: true,
    }),

    new ReactRefreshWebpackPlugin(),

    new HtmlWebpackPlugin({
      filename: path.join('index.html'),
      template: path.join(webpackPaths.srcRendererPath, 'index.ejs'),
      minify: {
        collapseWhitespace: true,
        removeAttributeQuotes: true,
        removeComments: true,
      },
      isBrowser: false,
      env: process.env.NODE_ENV,
      isDevelopment: process.env.NODE_ENV !== 'production',
      nodeModules: webpackPaths.appNodeModulesPath,
      scriptLoading: 'module',
    }),
  ],

  node: {
    __dirname: false,
    __filename: false,
  },

  stats: {
    children: true,
  },

  devServer: {
    port,
    compress: true,
    hot: true,
    headers: { 'Access-Control-Allow-Origin': '*' },
    static: {
      publicPath: '/',
    },
    historyApiFallback: {
      verbose: true,
    },
    setupMiddlewares(middlewares) {
      console.log('Starting preload.js builder...');
      const preloadProcess = spawn('npm', ['run', 'start:preload'], {
        shell: true,
        stdio: 'inherit',
      })
        .on('close', (code) => process.exit(code))
        .on('error', (spawnError) => console.error(spawnError));

      console.log('Starting Main Process...');
      let args = ['run', 'start:main'];
      if (process.env.MAIN_ARGS) {
        args = args.concat(['--', ...process.env.MAIN_ARGS.matchAll(/"[^"]+"|[^\s"]+/g)].flat());
      }
      spawn('npm', args, {
        shell: true,
        stdio: 'inherit',
      })
        .on('close', (code) => {
          preloadProcess.kill();
          process.exit(code);
        })
        .on('error', (spawnError) => console.error(spawnError));

      return middlewares;
    },
  },
};

export default merge(baseConfig, configuration);
