import { builtinModules } from 'node:module';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import license from 'rollup-plugin-license';

const external = new Set([
  ...builtinModules,
  ...builtinModules.map((module) => `node:${module}`),
]);

function onwarn(warning, warn) {
  if (warning.code === 'THIS_IS_UNDEFINED') {
    return;
  }

  if (warning.code === 'CIRCULAR_DEPENDENCY') {
    return;
  }

  warn(warning);
}

export default {
  input: 'src/index.js',
  context: 'globalThis',
  onwarn,
  output: {
    file: 'dist/index.js',
    format: 'cjs',
    sourcemap: true,
    exports: 'auto',
    inlineDynamicImports: true,
    generatedCode: {
      arrowFunctions: false,
      constBindings: false,
      objectShorthand: false,
    },
  },
  external: (id) => external.has(id),
  plugins: [
    nodeResolve({
      preferBuiltins: true,
    }),
    commonjs(),
    json(),
    license({
      thirdParty: {
        output: 'dist/licenses.txt',
      },
    }),
  ],
};
