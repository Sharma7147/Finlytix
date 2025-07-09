const { pathToRegexp } = require('../src/utils/safe-path-to-regexp');

module.exports = function validateRoutes(app) {
  const methods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'];
  
  methods.forEach(method => {
    const original = app[method];
    app[method] = function(path, ...handlers) {
      if (typeof path === 'string') {
        try {
          pathToRegexp(path);
        } catch (err) {
          console.error(`\n❌ Invalid ${method.toUpperCase()} route: ${path}`);
          console.error(`🔧 Problem: ${err.message}\n`);
          throw new Error(`Fix route: ${method.toUpperCase()} ${path}`);
        }
      }
      return original.call(this, path, ...handlers);
    };
  })
};
