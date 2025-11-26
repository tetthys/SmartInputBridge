// src/middleware/spaResponseMiddleware.js

// Minimal front route map (can be customized by users if needed)
const frontRoutes = {
  home: "/",
  dashboard: "/dashboard",
  profile: "/me",
  settings: "/settings",
};

// Build a unified SPA response body
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

  if (state.smartinput) body.smartinput = state.smartinput;
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
    smartinput: undefined,
    meta: undefined,
  };

  const api = {
    // withInput(input?)
    // If input is not provided, it uses req.body.payload by default.
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

    // Attach SmartInput payload
    withSmartInput: function (smartPayload) {
      state.smartinput = smartPayload;
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

// Middleware that extends res with back()/redirectTo() builders
function spaResponseMiddleware(req, res, next) {
  // back()
  // usage: return res.back().withInput().send();
  res.back = function () {
    const navigation = {
      action: "back",
      useOrigin: true,
      fallbackUrl: req.spa && req.spa.originUrl ? req.spa.originUrl : undefined,
    };

    return createSpaBuilder(req, res, navigation);
  };

  // redirect()->to(...)
  // usage:
  //   return res.redirectTo("home").withInput().send();
  //   return res.redirectTo("/custom").withoutInput().send();
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

  // Simple helpers (optional)
  res.spaOk = function (data) {
    const body = buildSpaResponse({
      status: 200,
      data: data,
    });
    res.json(body);
  };

  res.spaError = function (message, errors, status) {
    const code = status || 400;
    const body = buildSpaResponse({
      status: code,
      message: message,
      errors: errors,
    });
    res.status(code).json(body);
  };

  next();
}

module.exports = {
  spaResponseMiddleware,
  frontRoutes,
};
