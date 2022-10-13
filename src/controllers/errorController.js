// --------------------- Error handler

const AppError = require("../utils/appError");

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const key = Object.keys(err.keyValue)[0];
  const value = Object.values(err.keyValue)[0];
  const message = `The value "${value}" already exists for the "${key}" field. Use another value.`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);

  const message = `Invalid input data: ${errors.join(". ")}.`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError("Invalid token. Please log in again!", 401);

const handleJWTExpiredError = () =>
  new AppError("Token expired. Please log in again!", 401);

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  // erros operacionais: envia o erro ao client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }
  // erros de desenvolvimento (não previstos): envia uma mensagem padrão
  else {
    console.log("Error", err);

    res.status(500).json({
      status: "error",
      message: "something went wrong",
    });
  }
};

// ao receber 4 parâmetros no middleware, o express sabe que essa função é um error handling
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === "production") {
    let error = { ...err };

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

    sendErrorProd(error, res);
  }
};
