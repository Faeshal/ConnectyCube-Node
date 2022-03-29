const log = require("log4js").getLogger("errorHandler");
log.level = "error";

class ErrorResponse extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;

    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  log.error(err);
  if (err.response) {
    if (err.response.data) {
      log.error("axios error detail:", err.response.data);
      return res.status(error.statusCode || 500).json({
        success: false,
        message: err.response.data.message || "Server Error",
      });
    }
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || "Server Error",
  });
};

module.exports = { ErrorResponse, errorHandler };
