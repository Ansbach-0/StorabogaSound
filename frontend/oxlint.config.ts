import { defineConfig } from "oxlint";

// anti-slop: opinionated rules rejecting low-evidence TypeScript patterns.
// Vendored from dmmulroy/anti-slop (MIT) — see tools/oxlint/anti-slop/LICENSE.
// All 15 generic rules enabled at error. Effect plugin not registered (no Effect here).
export default defineConfig({
	ignorePatterns: ["dist/**", "tools/oxlint/anti-slop/**"],
	jsPlugins: [{ name: "anti-slop", specifier: "./tools/oxlint/anti-slop/src/index.ts" }],
	rules: {
		"anti-slop/no-chained-type-assertions": "error",
		"anti-slop/no-conditional-empty-object-spread": "error",
		"anti-slop/no-known-value-widening": "error",
		"anti-slop/no-module-mocking": "error",
		"anti-slop/no-object-parameters": "error",
		"anti-slop/no-reflect-apply": "error",
		"anti-slop/no-reflect-get": "error",
		"anti-slop/no-runtime-typeof": "error",
		"anti-slop/no-shape-in-symbol-names": "error",
		"anti-slop/no-unknown-parameters": "error",
		"anti-slop/no-unknown-returns": "error",
		"anti-slop/no-unknown-type-aliases": "error",
		"anti-slop/no-unsafe-dictionary-type": "error",
		"anti-slop/no-widen-then-assert": "error",
		"anti-slop/require-safety-comment-for-type-assertion": "error",
	},
});
