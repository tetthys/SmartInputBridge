// src/middleware/spaContextMiddleware.js
//
// Extract SPA-related headers and store them on req.spa.
//

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
