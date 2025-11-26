// src/middleware/spaResponseMiddleware.js
//
// Provides SPA-style response builders:
//   res.back().withInput().send()
//   res.back().withoutInput().send()
//   res.redirectTo('home').withInput().send()
//   res.redirectTo('home').withoutInput().send()
//

// Minimal front route map.
// Users can override this object after import if needed.
const frontRoutes = {
  home: "/",
  dashboard: "/dashboard",
  profile: "/me",
  settings: "/settings",
};

// Build SPA response body
function buildSpaResponse(state) {
  const body = {
    ok: state.status < 400,
  };

  if (typeof state.data !== "undefined") body.data = state.data;
  if (state.message) body.message = state.message;
  if (state.errors) body.errors = state.errors;
  if (state.navigation) body.navigation = state.navigation;

  // oldInput: undefined = untouched, null = explicitly cleared
  if (typeof state.oldInput !== "undefined") {
    if (state.oldInput !== null) {
      body.oldInput = state.oldInput;
    }
  }

  if (state.meta) body.meta = state.meta;

  return body;
}

// Create a fluent builder for SPA responses
function createSpaBuilder(req, res, baseNavigation) {
  const state = {
    status: 200,
    data: undefined,
    message: undefined,
    errors: undefined,
    navigation: baseNavigation || undefined,
    oldInput: undefined, // undefined: untouched, null: withoutInput, object: withInput
    meta: undefined,
  };

  const api = {
    // withInput(input?)
    // If input is not provided, default to req.body.payload
    withInput: function (input) {
      const payload =
        typeof input !== "undefined"
          ? input
          : (req.body && req.body.payload) || {};
      state.oldInput = payload;
      return api;
    },

    // withoutInput()
    withoutInput: function () {
      state.oldInput = null;
      return api;
    },

    withData: function (data) {
      state.data = data;
      return api;
    },

    withErrors: function (errors) {
      state.errors = errors;
      return api;
    },

    withMessage: function (message) {
      state.message = message;
      return api;
    },

    withStatus: function (status) {
      state.status = status;
      return api;
    },

    withMeta: function (meta) {
      state.meta = meta;
      return api;
    },

    // Final send
    send: function () {
      const body = buildSpaResponse(state);
      res.status(state.status).json(body);
    },
  };

  return api;
}

// Middleware that extends res with back()/redirectTo()
function spaResponseMiddleware(req, res, next) {
  // back()
  res.back = function () {
    const navigation = {
      action: "back",
      useOrigin: true,
      fallbackUrl: req.spa && req.spa.originUrl ? req.spa.originUrl : undefined,
    };

    return createSpaBuilder(req, res, navigation);
  };

  // redirect()->to(...)
  res.redirectTo = function (routeKeyOrPath) {
    const isKey = !!frontRoutes[routeKeyOrPath];
    const resolvedUrl = isKey ? frontRoutes[routeKeyOrPath] : routeKeyOrPath;

    const navigation = {
      action: "redirect",
      target: routeKeyOrPath,
      resolvedUrl: resolvedUrl,
    };

    return createSpaBuilder(req, res, navigation);
  };

  next();
}

module.exports = {
  spaResponseMiddleware,
  frontRoutes,
};
