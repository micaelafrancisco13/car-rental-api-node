import globals from "globals"
import pluginJs from "@eslint/js"
import pluginNode from "eslint-plugin-node"

/** @type {import("eslint").Linter.Config[]} */
export default [
	{
		files: ["**/*.js"],
		languageOptions: {
			sourceType: "commonjs",
			globals: {
				...globals.node,
			},
		},
		plugins: {
			node: pluginNode,
		},
	},
	pluginJs.configs.recommended,
]
