const msg = require("../../languages/pt-BR.json");
const AppError = require("../utils/appError");

const handleCastErrorDB = (err) =>
  new AppError(
    msg["error.handleCastErrorDB"]
      .replace("{{path}}", err.path)
      .replace("{{value}}", err.value),
    400
  );

const handleDuplicateFieldsDB = (err) =>
  new AppError(
    msg["error.handleDuplicateFieldsDB"]
      .replace("{{value}}", Object.values(err.keyValue)[0])
      .replace("{{key}}", Object.keys(err.keyValue)[0]),
    400
  );

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = msg["error.handleValidationErrorDB"].replace(
    "{{errors}}",
    errors.join(". ")
  );
  return new AppError(message, 400);
};

const handleJWTError = () => new AppError(msg["error.handleJWTError"], 401);

const handleJWTExpiredError = () =>
  new AppError(msg["error.handleJWTExpiredError"], 401);

const sendErrorDev = (err, req, res) => {
  if (req.originalUrl.startsWith("/api")) {
    // api
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }

  // rendered website
  return res.status(err.statusCode).render("error", {
    title: msg["error.somethingWentWrong"],
    msg: err.message,
  });
};

const sendErrorProd = (err, req, res) => {
  // api
  if (req.originalUrl.startsWith("/api")) {
    // erros operacionais: envia o erro ao client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }
    // erros de desenvolvimento (não previstos): envia uma mensagem padrão
    console.log("Error", err);

    return res.status(500).json({
      status: "error",
      message: msg["error.somethingWentWrongFull"],
    });
  }

  // rendered website
  // erros operacionais: envia o erro ao client
  if (err.isOperational) {
    return res.status(err.statusCode).render("error", {
      title: msg["error.somethingWentWrong"],
      msg: err.message,
    });
  }

  // erros de desenvolvimento (não previstos): envia uma mensagem padrão
  console.log("Error", err);
  return res.status(err.statusCode).render("error", {
    title: msg["error.somethingWentWrong"],
    msg: msg["error.pleaseTryAgainLater"],
  });
};

// ao receber 4 parâmetros no middleware, o express sabe que essa função é um error handling
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === "production") {
    let error = { ...err };
    error.message = err.message;

    // erros que não possuem o atributo "isOperational" e também devem ser tratados;

    // erros vindos do model;
    //  -> é preciso tratar os erros do mongoose antes (isOperational = true);
    //  -> o banco pode disparar três dipos de erros distintos:
    //     -> name: "CastError" - quando o tipo do parâmetro passado na request não é válido para aquele parâmetro
    //        por exemplo passar uma String em um parâmetro tipo Number;
    //     -> name: "ValidationError" - quando há quaisquer erros de validação dos campos informados;
    //     -> code: 11000 - quando há a tentantiva de inserir um valor "unique" que já existe;
    if (err.name === "CastError") error = handleCastErrorDB(err);
    if (err.name === "ValidationError") error = handleValidationErrorDB(err);
    if (err.code === 11000) error = handleDuplicateFieldsDB(err);

    // erros vindos do jwt de autenticação;
    if (err.name === "JsonWebTokenError") error = handleJWTError();
    if (err.name === "TokenExpiredError") error = handleJWTExpiredError();

    sendErrorProd(error, req, res);
  }
};
