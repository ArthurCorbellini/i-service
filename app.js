// app.js serve apenas para parâmetros de configuração da aplicação atrelados ao Express;

const express = require("express");
const morgan = require("morgan");

const tourRouter = require("./routes/tourRoutes");
const userRouter = require("./routes/userRoutes");

const app = express();

// --------------------- Middlewares
// só ativa o log caso o ambiente for de desenvolvimento;
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}
app.use(express.json());

// --------------------- Routes
app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter);

module.exports = app;
