import * as path from 'path';
import * as fs from 'fs';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import string from 'rollup-plugin-string';
import preprocess from 'rollup-plugin-preprocess';

// setup some common values
const pkg = require('./package.json');
const prod = process.env.NODE_ENV === 'production';
const compiled = (new Date()).toUTCString().replace(/GMT/g, 'UTC');
const banner = `/*!
* ${pkg.name} - v${pkg.version}
* Compiled ${compiled}
*
* ${pkg.name} is licensed under the MIT License.
* http://www.opensource.org/licenses/mit-license
*/\n`;

// create the common config values
const plugins = [
    string({
        include: [
            '**/*.vert',
            '**/*.frag',
            '**/*.glsl',
        ],
        exclude: 'node_modules/**',
    }),
    preprocess({
        include: [
            '**/*.ts',
        ],
        exclude: 'node_modules/**',
        context: {
            DEBUG: !prod,
        },
    }),
    typescript({ typescript: require('typescript'), }),
    resolve(),
    commonjs(),
];

const output = {
    format: 'umd',
    sourcemap: false
};

// generate configs for all the bundles
const bundleDir = 'bundles';
const dirs = fs.readdirSync(bundleDir);
const bundles = [];

for (let i = 0; i < dirs.length; ++i)
{
    const dirname = dirs[i];
    const folder = path.join(bundleDir, dirname);

    if (fs.existsSync(path.join(folder, 'index.ts')))
    {
        const ext = dirname === 'gl-tiled' ? '' : `.${dirname}`;
        const file = path.join('dist', `gl-tiled${ext}.js`);
        const name = `glTiled${ext}`;

        bundles.push({
            input: path.join('bundles', dirname, 'index.ts'),
            banner,
            plugins,
            output: Object.assign({ file, name }, output),
        });
    }
}

export default bundles;
