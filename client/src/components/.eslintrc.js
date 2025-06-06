module.exports = {
    "env": {
        "browser": true,
        "es6": true,
        "node": true
    },
    "extends": [
        "eslint:recommended",
        "plugin:react/recommended",
        "plugin:react-hooks/recommended"
    ],
    "parserOptions": {
        "ecmaFeatures": {
            "jsx": true
        },
        "ecmaVersion": 2020,
        "sourceType": "module"
    },
    "plugins": [
        "react",
        "react-hooks"
    ],
    "rules": {
        "no-unused-vars": "warn",
        "no-console": "off",
        "react/prop-types": "off",
        "react/react-in-jsx-scope": "off",
        "no-undef": "warn"
    },
    "globals": {
        "localStorage": "readonly",
        "fetch": "readonly",
        "console": "readonly",
        "process": "readonly"
    },
    "settings": {
        "react": {
            "version": "detect"
        }
    }
}; 