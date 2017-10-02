import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import string from 'rollup-plugin-string';

const pkg = require('./package.json');

export default {
    input: './src/index.ts',
    plugins: [
        string({
            include: [
                '**/*.vert',
                '**/*.frag',
                '**/*.glsl',
            ],
        }),
        typescript({ typescript: require('typescript') }),
        resolve(),
        commonjs(),
    ],
    output: {
        file: pkg.main,
        format: 'umd',
        name: 'glTiled',
        sourcemap: false
    },
};
