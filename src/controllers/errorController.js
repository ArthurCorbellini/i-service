// --------------------- Error handler
// ao receber 4 parâmetros no middleware, o express sabe que essa função é um error handling
module.exports = (err, req, res, next) => {
  res.status(err.statusCode || 500).json({
    status: err.status || "error",
    message: err.message,
  });
};
