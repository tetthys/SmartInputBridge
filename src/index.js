// src/index.js

// Public exports for the package

const { spaContextMiddleware } = require("./middleware/spaContextMiddleware");
const {
  spaResponseMiddleware,
  frontRoutes,
} = require("./middleware/spaResponseMiddleware");
const {
  createSmartInputMiddleware,
} = require("./middleware/createSmartInputMiddleware");

module.exports = {
  spaContextMiddleware,
  spaResponseMiddleware,
  frontRoutes,
  createSmartInputMiddleware,
};
