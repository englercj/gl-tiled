import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import string from 'rollup-plugin-string';
import preprocess from 'rollup-plugin-preprocess';

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
            exclude: 'node_modules/**',
        }),
        preprocess({
            include: [
                '**/*.ts',
            ],
            exclude: 'node_modules/**',
            context: {
                DEBUG: process.env.NODE_ENV !== 'production',
            },
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
