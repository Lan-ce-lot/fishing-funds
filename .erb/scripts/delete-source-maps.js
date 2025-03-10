import fs from 'fs';
import path from 'path';
import rimraf from 'rimraf';
import webpackPaths from '../configs/webpack.paths.mjs';

export default function deleteSourceMaps() {
  if (fs.existsSync(webpackPaths.distMainPath))
    rimraf.sync(path.join(webpackPaths.distMainPath, '*.js.map'));
  if (fs.existsSync(webpackPaths.distRendererPath))
    rimraf.sync(path.join(webpackPaths.distRendererPath, '*.js.map'));
}
