module.exports = {
  env: {
    es6: true,
    node: true,
    jest: true,
  },
  extends: "eslint:recommended",
  parserOptions: {
    ecmaVersion: 2020,
  },
  plugins: ["jest", "prettier"],
  rules: {
    "no-console": "off",
  },
};
