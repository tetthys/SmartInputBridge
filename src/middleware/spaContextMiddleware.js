// src/middleware/spaContextMiddleware.js

// This middleware extracts SPA-related headers and stores them on req.spa.
// It does not depend on any external libraries.

function spaContextMiddleware(req, _res, next) {
  const originUrl = req.header && req.header("x-spa-origin");
  const currentRouteKey = req.header && req.header("x-spa-route-key");
  const frontRouteVersion = req.header && req.header("x-spa-routes-version");

  req.spa = {
    originUrl: originUrl || undefined,
    currentRouteKey: currentRouteKey || undefined,
    frontRouteVersion: frontRouteVersion || undefined,
  };

  next();
}

module.exports = {
  spaContextMiddleware,
};
