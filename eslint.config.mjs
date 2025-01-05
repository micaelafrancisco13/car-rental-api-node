import globals from "globals"
import pluginJs from "@eslint/js"
import pluginNode from "eslint-plugin-node"
import prettier from "eslint-plugin-prettier"

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
			prettier,
		},
		rules: {
			"prettier/prettier": "error",
		},
	},
	pluginJs.configs.recommended,
]
