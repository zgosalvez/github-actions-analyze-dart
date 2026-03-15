import { builtinModules } from 'node:module';
import path from 'node:path';
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

function stubUnusedActionsCoreOidc() {
  const coreModuleSuffix = `${path.sep}@actions${path.sep}core${path.sep}lib${path.sep}core.js`;

  return {
    name: 'stub-unused-actions-core-oidc',
    transform(code, id) {
      if (!id.endsWith(coreModuleSuffix)) {
        return null;
      }

      const transformed = code.replace(
        'const oidc_utils_1 = require("./oidc-utils");',
        'const oidc_utils_1 = { getIDToken: async function getIDToken() { throw new Error("OIDC token requests are not supported in this action bundle."); } };'
      );

      return transformed === code
        ? null
        : {
            code: transformed,
            map: { mappings: '' },
          };
    },
  };
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
    stubUnusedActionsCoreOidc(),
    commonjs(),
    json(),
    license({
      thirdParty: {
        output: 'dist/licenses.txt',
      },
    }),
  ],
};
