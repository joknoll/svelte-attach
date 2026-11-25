import adapter from "@sveltejs/adapter-static";
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig, lazyPlugins } from "vite-plus";

export default defineConfig({
  fmt: {},
  lint: {
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    rules: { "vite-plus/prefer-vite-plus-imports": "error" },
    options: { typeAware: true, typeCheck: true },
  },
  plugins: lazyPlugins(() => [
    sveltekit({
      compilerOptions: {
        // Dependencies retain their own compiler mode so legacy components still compile.
        // Recheck the override when upgrading to Svelte 6, which defaults to runes mode.
        runes: ({ filename }) =>
          filename.split(/[/\\]/).includes("node_modules") ? undefined : true,
      },

      adapter: adapter({ pages: "build", assets: "build", fallback: "404.html" }),
      // GitHub Pages serves the site from /<repository>/. The Pages workflow sets BASE_PATH.
      paths: { base: (process.env.BASE_PATH ?? "") as "" | `/${string}` },
      prerender: { entries: ["*"] },
    }),
  ]),
});
