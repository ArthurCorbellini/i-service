// app.js serve apenas para parâmetros de configuração da aplicação atrelados ao Express;

const express = require("express");
const morgan = require("morgan");

const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");
const tourRouter = require("./routes/tourRoutes");
const userRouter = require("./routes/userRoutes");

const app = express();

// --------------------- Middlewares
// só ativa o log caso o ambiente for de desenvolvimento;
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}
app.use(express.json());

// --------------------- Routes (middleware)
app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter);

// caso o request não acerte nenhuma url acima, ele vai parar no router abaixo
app.all("*", (req, res, next) => {
  // se a função next() receber um parâmetro, não importa qual for, o Express vai automaticamente
  // assumir que é um erro e pular direto para o middleware de error handling;
  next(new AppError(`Can't find ${req.originalUrl} on server`), 404);
});

// error handler middleware
//  -> acerta esse cara quando a função next() recebe um parâmetro;
app.use(globalErrorHandler);

module.exports = app;
