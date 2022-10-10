class AppError extends Error {
  constructor(message, statusCode) {
    super(message);

    // indica que foi um erro operacional (previsto);
    //  -> por exemplo um controle de acesso, e não um bug inesperado;
    //  -> essa flag indica que esses erros podem ser enviados ao usuário,
    //     para o mesmo entender o motivo do erro;
    //  -> flag usada no errorController
    this.isOperational = true;
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
