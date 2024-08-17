import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';

export default {
    input: 'src/main.ts',
    output: {
        file: 'dist/ocarina.js',
        format: 'iife',
        name: 'ocarina',
        globals: {
            '@tensorflow/tfjs': 'tf'
        }
    },
    plugins: [
        nodeResolve({
            browser: true,
            preferBuiltins: false
        }),
        commonjs(),
        json(),
        typescript()
    ],
    external: ['@tensorflow/tfjs', "@tensorflow-models/speech-commands"]
};