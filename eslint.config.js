// eslint.config.js
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig([
    // Global ignores that apply to all configurations
    {
        ignores: ["node_modules/", ".next/", "out/", "public/"]
    },

    // Base configuration for all JavaScript files
    {
        files: ["**/*.js", "**/*.jsx"],
        name: "next-flask/javascript",
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
        },
        linterOptions: {
            reportUnusedDisableDirectives: "error",
        },
        rules: {
            // Your JavaScript rules here
            "semi": "error",
            "prefer-const": "error"
        }
    },

    // Configuration for TypeScript files
    {
        files: ["**/*.ts", "**/*.tsx"],
        name: "next-flask/typescript",
        languageOptions: {
            parser: tseslint.parser,
            parserOptions: {
                project: "./tsconfig.json",
            },
            sourceType: "module",
        },
        plugins: {
            "@typescript-eslint": tseslint.plugin,
        },
        rules: {
            // Your TypeScript rules here
            "semi": "error",
            "prefer-const": "error",
            "@typescript-eslint/no-explicit-any": "warn"
        }
    }
]);