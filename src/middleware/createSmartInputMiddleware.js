// src/middleware/createSmartInputMiddleware.js

const Joi = require("joi");

/**
 * SmartInput middleware factory.
 *
 * schema: Joi schema
 * emitFn: (sessionId, payload, req) => void
 */
function createSmartInputMiddleware(schema, emitFn) {
  return function (req, res, next) {
    const body = req.body || {};
    const sessionId = body.sessionId;
    const payload = body.payload || {};
    const injected = body.injected || {};
    const old = body.old || {};

    // Validate with Joi
    const result = schema.validate(payload, {
      abortEarly: false,
      allowUnknown: true,
    });

    const error = result.error;
    const value = result.value;

    // Build SmartInput-style results
    const results = {};

    // Initialize fields from payload
    Object.keys(payload).forEach(function (key) {
      results[key] = {
        origin: "form",
        is_error: false,
        messages: [],
      };
    });

    // If error, mark each field
    if (error) {
      error.details.forEach(function (detail) {
        const key = detail.path.join(".");
        if (!results[key]) {
          results[key] = {
            origin: "form",
            is_error: false,
            messages: [],
          };
        }
        results[key].is_error = true;
        results[key].messages.push(detail.message);
      });
    }

    const smartPayload = {
      success: !error,
      results: results,
      payload: value,
      old: old,
      injected: injected,
    };

    // Emit via provided function (e.g., socket)
    if (sessionId && emitFn) {
      emitFn(sessionId, smartPayload, req);
    }

    // Valid: call next (legacy behavior)
    if (!error) {
      return next();
    }

    // Invalid: set status 400 (legacy expectation)
    res.status(400);

    // If SPA builder is available, integrate with back()->withInput()
    if (typeof res.back === "function") {
      return res
        .back()
        .withInput(payload)
        .withSmartInput(smartPayload)
        .withStatus(400)
        .send();
    }

    // Fallback: basic JSON (for non-SPA usage)
    return res.json({
      success: false,
      results: results,
    });
  };
}

module.exports = {
  createSmartInputMiddleware,
};
