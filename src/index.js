// src/index.js

const { spaContextMiddleware } = require("./middleware/spaContextMiddleware");
const {
  spaResponseMiddleware,
  frontRoutes,
} = require("./middleware/spaResponseMiddleware");

module.exports = {
  spaContextMiddleware,
  spaResponseMiddleware,
  frontRoutes,
};
