// src/middleware/spaResponseMiddleware.js

const frontRoutes = {
  home: "/",
  dashboard: "/dashboard",
  profile: "/me",
  settings: "/settings",
};

/* ==========================================================
 * Build final SPA response JSON
 * ========================================================== */
function buildSpaResponse(state) {
  const body = {
    ok: state.status < 400,
  };

  // Navigation (back / redirect)
  if (state.navigation) body.navigation = state.navigation;

  // Main payload: ui, fields, flash, etc.
  if (state.payload && Object.keys(state.payload).length > 0) {
    Object.assign(body, state.payload);
  }

  if (state.data !== undefined) body.data = state.data;
  if (state.message) body.message = state.message;
  if (state.errors) body.errors = state.errors;
  if (state.meta) body.meta = state.meta;

  return body;
}

/* ==========================================================
 * Builder DSL
 * ========================================================== */
function createSpaBuilder(req, res, baseNavigation) {
  const state = {
    status: 200,
    data: undefined,
    message: undefined,
    errors: undefined,
    navigation: baseNavigation || undefined,
    payload: {
      ui: {},
      fields: {},
      flash: {},
    },
    meta: undefined,
  };

  const api = {
    /* ---------------------------------------------
     * Generic with()  (Laravel-like)
     * --------------------------------------------- */
    with(obj) {
      if (obj && typeof obj === "object") {
        state.payload = { ...state.payload, ...obj };
      }
      return api;
    },

    /* ---------------------------------------------
     * UI helpers
     * --------------------------------------------- */
    withUi(obj) {
      if (obj) state.payload.ui = { ...state.payload.ui, ...obj };
      return api;
    },

    /* ---------------------------------------------
     * Field helpers
     * --------------------------------------------- */
    withFields(obj) {
      if (obj) state.payload.fields = { ...state.payload.fields, ...obj };
      return api;
    },

    withInjectedFields(obj) {
      if (obj) {
        state.payload.fields.injected = {
          ...(state.payload.fields.injected || {}),
          ...obj,
        };
      }
      return api;
    },

    withOldInput(obj) {
      if (obj) {
        state.payload.fields.old = {
          ...(state.payload.fields.old || {}),
          ...obj,
        };
      }
      return api;
    },

    /* ---------------------------------------------
     * Flash (Laravel-style)
     * --------------------------------------------- */
    flash(key, value) {
      state.payload.flash[key] = value;
      return api;
    },

    /* ---------------------------------------------
     * Data, Meta, Message
     * --------------------------------------------- */
    withData(data) {
      state.data = data;
      return api;
    },

    withMeta(meta) {
      state.meta = meta;
      return api;
    },

    withMessage(message) {
      state.message = message;
      return api;
    },

    /* ---------------------------------------------
     * Error helpers
     * --------------------------------------------- */
    withError(msg) {
      state.message = msg;
      state.status = state.status >= 400 ? state.status : 400;
      return api;
    },

    withValidationErrors(obj) {
      state.errors = obj;
      state.status = 422;
      return api;
    },

    /* ---------------------------------------------
     * Status / redirect helpers
     * --------------------------------------------- */
    withStatus(code) {
      state.status = code;
      return api;
    },

    ok() {
      state.status = 200;
      return api;
    },

    fail(code = 400) {
      state.status = code;
      return api;
    },

    /* ---------------------------------------------
     * Final send()
     * --------------------------------------------- */
    send() {
      const body = buildSpaResponse(state);
      res.status(state.status).json(body);
    },
  };

  return api;
}

/* ==========================================================
 * Navigation helpers: res.back(), res.redirect(), res.route()
 * ========================================================== */

function resolveNavigationForRoute(routeKeyOrPath) {
  const isKey = !!frontRoutes[routeKeyOrPath];
  return {
    action: "redirect",
    target: routeKeyOrPath,
    resolvedUrl: isKey ? frontRoutes[routeKeyOrPath] : routeKeyOrPath,
  };
}

function spaResponseMiddleware(req, res, next) {
  res.back = function () {
    return createSpaBuilder(req, res, {
      action: "back",
      useOrigin: true,
      fallbackUrl: req.spa?.originUrl,
    });
  };

  res.redirect = function () {
    return {
      to(routeKeyOrPath) {
        const navigation = resolveNavigationForRoute(routeKeyOrPath);
        return createSpaBuilder(req, res, navigation);
      },
    };
  };

  res.route = function () {
    return res.redirect();
  };

  res.redirectTo = function (routeKeyOrPath) {
    const navigation = resolveNavigationForRoute(routeKeyOrPath);
    return createSpaBuilder(req, res, navigation);
  };

  next();
}

module.exports = {
  spaResponseMiddleware,
  frontRoutes,
};
