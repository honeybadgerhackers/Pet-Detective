module.exports = {
  "env": {
    "node": true,
    "browser": true,
    "mocha": true
  },
  "extends": [
    "airbnb-base"
  ],
  "globals": {
    "_": true,
    "google": true,
    "pc3Hash": true,
    "angular": true,
    "InfoBox": true,
    "$": true
  },
  "settings": {
    "angular": 1
  },
  "rules": {
    "func-names": 0,
    "linebreak-style": 0,
    "prefer-arrow-callback": 0,
    "no-param-reassign": 0,
    "no-console": [0, { "allow": ["warn", "error"] }],
    "comma-dangle": ["error", {
      "arrays": "only-multiline",
      "objects": "always-multiline",
      "imports": "always-multiline",
      "exports": "always-multiline",
      "functions": "ignore"
    }],
    "no-underscore-dangle": [2, { "allow": [] }],
    "no-use-before-define": ["error", { "functions": false, "classes": true }],
    "no-tabs": 0,
    "wrap-iife": ["error", "inside"],
    "no-underscore-dangle": 0,
    "radix": ["error", "as-needed"]
  }

};
