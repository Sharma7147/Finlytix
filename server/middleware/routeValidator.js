const { pathToRegexp } = require('../src/utils/safe-path-to-regexp');


function validateRoutes(app) {
  const methods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'];
  
  methods.forEach(method => {
    const original = app[method];
    app[method] = function(path, ...handlers) {
      // Skip validation for certain paths (like static files)
      if (typeof path !== 'string' || path.startsWith('/uploads/')) {
        return original.call(this, path, ...handlers);
      }

      try {
        pathToRegexp(path);
      } catch (err) {
        console.error(`\n❌ Invalid route path: ${method.toUpperCase()} ${path}`);
        console.error(`🔧 Error: ${err.message}\n`);
        throw new Error(`Invalid route path: ${path}`);
      }
      
      return original.call(this, path, ...handlers);
    };
  });
}

module.exports = validateRoutes;
