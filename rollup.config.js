import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';

export default {
    input: 'src/Ocarina.ts',
    output: {
        file: 'dist/ocarina.js',
        format: 'esm',
        name: 'ocarina',
    },
    plugins: [
        nodeResolve({
            browser: true,
            preferBuiltins: false
        }),
        commonjs(),
        json(),
        typescript(),
    ]
};