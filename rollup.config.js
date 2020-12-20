import nodeResolve from '@rollup/plugin-node-resolve'
import babel from 'rollup-plugin-babel'
import replace from '@rollup/plugin-replace'
import typescript from 'rollup-plugin-typescript2'
import { terser } from 'rollup-plugin-terser'

import pkg from './package.json'

const extensions = ['.ts']
const noDeclarationFiles = { compilerOptions: { declaration: false } }

const babelRuntimeVersion = pkg.dependencies['@babel/runtime'].replace(
    /^[^0-9]*/,
    ''
)

const makeExternalPredicate = (externalArr) => {
    if (externalArr.length === 0) {
        return () => false
    }
    const pattern = new RegExp(`^(${externalArr.join('|')})($|/)`)
    return (id) => pattern.test(id)
}

export default [
    // CommonJS
    // {
    //     input: 'src/index.ts',
    //     output: { file: 'lib/mozaik.js', format: 'cjs', indent: false },
    //     plugins: [
    //         nodeResolve({
    //             extensions,
    //         }),
    //         typescript({ useTsconfigDeclarationDir: true }),
    //         babel({
    //             extensions,
    //             plugins: [
    //                 ['@babel/plugin-transform-runtime', { version: babelRuntimeVersion }],
    //             ],
    //             runtimeHelpers: true,
    //         }),
    //     ],
    // },
    //
    // // ES
    // {
    //     input: 'src/index.ts',
    //     output: { file: 'es/mozaik.js', format: 'es', indent: false },
    //     plugins: [
    //         nodeResolve({
    //             extensions,
    //         }),
    //         typescript({ tsconfigOverride: noDeclarationFiles }),
    //         babel({
    //             extensions,
    //             plugins: [
    //                 [
    //                     '@babel/plugin-transform-runtime',
    //                     { version: babelRuntimeVersion, useESModules: true },
    //                 ],
    //             ],
    //             runtimeHelpers: true,
    //         }),
    //     ],
    // },
    //
    // // ES for Browsers
    // {
    //     input: 'src/index.ts',
    //     output: { file: 'es/mozaik.mjs', format: 'es', indent: false },
    //     plugins: [
    //         nodeResolve({
    //             extensions,
    //         }),
    //         replace({
    //             'process.env.NODE_ENV': JSON.stringify('production'),
    //         }),
    //         typescript({ tsconfigOverride: noDeclarationFiles }),
    //         babel({
    //             extensions,
    //             exclude: 'node_modules/**',
    //         }),
    //         terser({
    //             compress: {
    //                 pure_getters: true,
    //                 unsafe: true,
    //                 unsafe_comps: true,
    //                 warnings: false,
    //             },
    //         }),
    //     ],
    // },

    // UMD Development
    {
        input: 'src/index.ts',
        output: {
            file: 'dist/mozaik.js',
            format: 'umd',
            name: 'Mozaik',
            indent: false,
        },
        plugins: [
            nodeResolve({
                extensions,
            }),
            typescript({ tsconfigOverride: noDeclarationFiles, check: false}),
            babel({
                extensions,
                exclude: 'node_modules/**',
            }),
            replace({
                'process.env.NODE_ENV': JSON.stringify('development'),
            }),
        ],
    },

    // UMD Production
    // {
    //     input: 'src/index.ts',
    //     output: {
    //         file: 'dist/mozaik.min.js',
    //         format: 'umd',
    //         name: 'Mozaik',
    //         indent: false,
    //     },
    //     plugins: [
    //         nodeResolve({
    //             extensions,
    //         }),
    //         typescript({ tsconfigOverride: noDeclarationFiles }),
    //         babel({
    //             extensions,
    //             exclude: 'node_modules/**',
    //         }),
    //         replace({
    //             'process.env.NODE_ENV': JSON.stringify('production'),
    //         }),
    //         terser({
    //             compress: {
    //                 pure_getters: true,
    //                 unsafe: true,
    //                 unsafe_comps: true,
    //                 warnings: false,
    //             },
    //         }),
    //     ],
    // },
]
