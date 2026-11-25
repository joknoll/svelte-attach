import { defineConfig } from "vite-plus";

export default defineConfig({
  staged: {
    "*": "vp check --fix",
  },
  fmt: {},
  lint: {
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    rules: { "vite-plus/prefer-vite-plus-imports": "error" },
    options: { typeAware: true, typeCheck: true },
  },
  pack: {
    entry: {
      key: "src/key/index.ts",
      sound: "src/sound.ts",
      haptic: "src/haptic.ts",
      gamepad: "src/gamepad.ts",
    },
    dts: true,
    format: ["esm"],
    platform: "neutral",
    deps: { neverBundle: ["svelte", /^svelte\//] },
  },
  test: {
    include: ["test/**/*.test.ts"],
  },
  run: {
    cache: true,
  },
});
