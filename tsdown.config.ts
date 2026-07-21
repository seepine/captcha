import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts', 'src/assets/index.ts'],
  format: ['esm', 'cjs'],
  platform: 'node',
  exports: true,
  dts: true,
  minify: false,
  sourcemap: false,
  unbundle: true,
  treeshake: true,
})
