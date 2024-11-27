// eslint.config.js
const eslint = require('@eslint/js');
const tseslint = require('@typescript-eslint/eslint-plugin');
const tsparser = require('@typescript-eslint/parser');
const globals = require('globals');

module.exports = [
    // Ignore patterns
    {
        ignores: [
            'out/**',
            'dist/**',
            'node_modules/**',
            '.vscode-test/**',
            'examples/**'
        ]
    },
    // TypeScript files configuration
    {
        files: ['**/*.ts'],
        languageOptions: {
            parser: tsparser,
            parserOptions: {
                ecmaVersion: 2020,
                sourceType: 'module',
                project: ['./tsconfig.json', './tsconfig.test.json']
            },
            globals: {
                ...globals.node,
                ...globals.mocha
            }
        },
        plugins: {
            '@typescript-eslint': tseslint
        },
        rules: {
            // ESLint recommended rules
            ...eslint.configs.recommended.rules,
            // TypeScript recommended rules
            ...tseslint.configs.recommended.rules,
            
            // Naming conventions
            '@typescript-eslint/naming-convention': [
                'error',
                {
                    selector: 'default',
                    format: ['camelCase']
                },
                {
                    selector: 'variable',
                    format: ['camelCase', 'UPPER_CASE']
                },
                {
                    selector: 'parameter',
                    format: ['camelCase'],
                    leadingUnderscore: 'allow'
                },
                {
                    selector: 'memberLike',
                    modifiers: ['private'],
                    format: ['camelCase'],
                    leadingUnderscore: 'require'
                },
                {
                    selector: 'typeLike',
                    format: ['PascalCase']
                }
            ],

            // TypeScript specific rules
            '@typescript-eslint/explicit-function-return-type': ['warn', {
                allowExpressions: true,
                allowTypedFunctionExpressions: true
            }],
            '@typescript-eslint/explicit-member-accessibility': ['warn', {
                accessibility: 'explicit'
            }],
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-unused-vars': ['warn', {
                argsIgnorePattern: '^_',
                varsIgnorePattern: '^_'
            }],
            '@typescript-eslint/semi': 'warn',
            '@typescript-eslint/type-annotation-spacing': 'warn',

            // General ESLint rules
            'curly': 'warn',
            'eqeqeq': 'warn',
            'no-throw-literal': 'warn',
            'semi': 'off', // Handled by @typescript-eslint/semi
            'quotes': ['warn', 'single', { avoidEscape: true }],
            'no-console': ['warn', { allow: ['warn', 'error'] }],
            'no-debugger': 'warn',
            'no-duplicate-case': 'error',
            'no-empty': 'warn',
            'no-extra-semi': 'warn',
            'no-unused-expressions': 'warn',
            'no-var': 'error',
            'prefer-const': 'warn',

            // Code style
            'array-bracket-spacing': ['warn', 'never'],
            'block-spacing': ['warn', 'always'],
            'brace-style': ['warn', '1tbs', { allowSingleLine: true }],
            'comma-dangle': ['warn', 'never'],
            'comma-spacing': ['warn', { before: false, after: true }],
            'comma-style': ['warn', 'last'],
            'computed-property-spacing': ['warn', 'never'],
            'key-spacing': ['warn', { beforeColon: false, afterColon: true }],
            'keyword-spacing': ['warn', { before: true, after: true }],
            'object-curly-spacing': ['warn', 'always'],
            'space-before-blocks': 'warn',
            'space-before-function-paren': ['warn', {
                anonymous: 'always',
                named: 'never',
                asyncArrow: 'always'
            }],
            'space-in-parens': ['warn', 'never'],
            'space-infix-ops': 'warn'
        }
    }
];