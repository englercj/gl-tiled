const fs = require('fs-extra');
const glob = require('glob');

fs.mkdirpSync('docs/_demo/basic');
fs.mkdirpSync('docs/_demo/dist');
fs.mkdirpSync('docs/_demo/node_modules/resource-loader/dist');
fs.mkdirpSync('docs/_demo/node_modules/stats.js/build');

fs.copySync('test/index.html', 'docs/_demo/basic/index.html');
fs.copySync('test/demo.js', 'docs/_demo/basic/demo.js');
fs.copySync('test/maps', 'docs/_demo/basic/maps');

fs.copySync('dist', 'docs/_demo/dist');

const resLoaderPath = 'node_modules/resource-loader/dist/resource-loader.js';
fs.copySync(resLoaderPath, `docs/_demo/${resLoaderPath}`);

const statsPath = 'node_modules/stats.js/build/stats.min.js'
fs.copySync(statsPath, `docs/_demo/${statsPath}`);
