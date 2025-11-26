// tests/smartinput.test.js

const Joi = require("joi");
const {
  createSmartInputMiddleware,
} = require("../src/middleware/createSmartInputMiddleware");
const {
  spaResponseMiddleware,
} = require("../src/middleware/spaResponseMiddleware");

describe("SmartInput Functional Middleware", () => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    name: Joi.string().min(2).required(),
  });

  const mockContext = ({
    payload = {},
    query = {},
    injected = {},
    old = {},
  }) => {
    const emitted = {};
    const socket = {
      emit: (event, data) => {
        emitted[event] = data;
      },
    };

    const req = {
      body: { sessionId: "abc", payload, injected, old },
      query,
      originalUrl: "/api/demo",
      app: { locals: { clients: new Map([["abc", socket]]) } },
    };

    const res = {
      status: jest.fn(() => res),
      json: jest.fn(),
    };

    const next = jest.fn();

    return { req, res, next, emitted };
  };

  it("emits valid result when all fields pass", () => {
    const ctx = mockContext({ payload: { email: "a@b.com", name: "Anna" } });
    const middleware = createSmartInputMiddleware(
      schema,
      (sid, payload, req) => {
        ctx.emitted["smartinput:validation"] = payload;
      }
    );
    middleware(ctx.req, ctx.res, ctx.next);

    expect(ctx.next).toHaveBeenCalled();
    const res = ctx.emitted["smartinput:validation"];
    expect(res.success).toBe(true);
    expect(res.results.name.origin).toBe("form");
    expect(res.results.email.is_error).toBe(false);
  });

  it("emits error when one field is invalid", () => {
    const ctx = mockContext({ payload: { email: "bad", name: "Anna" } });
    const middleware = createSmartInputMiddleware(
      schema,
      (sid, payload, req) => {
        ctx.emitted["smartinput:validation"] = payload;
      }
    );
    middleware(ctx.req, ctx.res, ctx.next);

    // Legacy behavior: next not called, 400 status set
    expect(ctx.next).not.toHaveBeenCalled();
    expect(ctx.res.status).toHaveBeenCalledWith(400);
    expect(ctx.emitted["smartinput:validation"].results.email.is_error).toBe(
      true
    );
    expect(ctx.emitted["smartinput:validation"].results.name.is_error).toBe(
      false
    );
  });

  it("integrates with SPA back()->withInput() when spaResponseMiddleware is present", () => {
    // Prepare context
    const ctx = mockContext({
      payload: { email: "bad", name: "A" },
    });

    // Attach spaResponseMiddleware (to provide res.back())
    spaResponseMiddleware(ctx.req, ctx.res, () => {});

    // SmartInput with simple emitter
    const middleware = createSmartInputMiddleware(
      schema,
      (sid, payload, req) => {
        ctx.emitted["smartinput:validation"] = payload;
      }
    );

    middleware(ctx.req, ctx.res, ctx.next);

    // Should still be 400 and not call next()
    expect(ctx.next).not.toHaveBeenCalled();
    expect(ctx.res.status).toHaveBeenCalledWith(400);

    // SPA-style JSON should be sent
    expect(ctx.res.json).toHaveBeenCalledTimes(1);
    const body = ctx.res.json.mock.calls[0][0];

    // Check protocol fields
    expect(body.ok).toBe(false);
    expect(body.oldInput).toEqual({ email: "bad", name: "A" });
    expect(body.navigation).toBeDefined();
    expect(body.navigation.action).toBe("back");

    // SmartInput payload should also be attached
    expect(body.smartinput).toBeDefined();
    expect(body.smartinput.success).toBe(false);
    expect(body.smartinput.results.email.is_error).toBe(true);
  });
});
