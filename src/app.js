// app.js serve apenas para parâmetros de configuração da aplicação atrelados ao Express;

const path = require("path");
const express = require("express");
const morgan = require("morgan");
const hpp = require("hpp");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const cookieParser = require("cookie-parser");
const compression = require("compression");
const cors = require("cors");

const msg = require("../languages/pt-BR.json");
const hppWhitelist = require("./security/hppWhitelist.json");
const globalErrorHandler = require("./controllers/errorController");
const AppError = require("./utils/appError");

const tourRouter = require("./routes/tourRoutes");
const userRouter = require("./routes/userRoutes");
const jobRouter = require("./routes/jobRoutes");
const reviewRouter = require("./routes/reviewRoutes");
const viewRouter = require("./routes/viewRoutes");

const app = express();

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

// serving static files;
app.use(express.static(path.join(__dirname, "public")));

// ----------------------------------------
// --------------------- Global Middlewares
// ----------------------------------------

// CORS
//  -> permite que qualquer url consuma as "simple requests (get e post)" da API;
//  -> coloca o header Access-Control-Allow-Origin *;
app.use(cors());
//  -> abaixo segue exemplo que permite apenas o domínio iService.com consumir a API;
//     app.use(
//       cors({
//         origin: "https://www.iService.com",
//       })
//     );
//  -> permite que qualquer url consuma as "non-simple requests (put, patch e delete) da API";
app.options("*", cors());
// app.options("/api/v1/jobs/:id", cors());

// Set security http headers;
app.use(helmet());

// só ativa o log caso o ambiente for de desenvolvimento;
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// inclui um limite de 100 requisições por hora vindas de um determinado IP;
//  -> a ideia é evitar ataques de força bruta;
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: msg["error.toManyRequests"].replace("{{max}}", "100"),
});
app.use("/api", limiter);

// body parser, lê os dados do body para req.body;
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
// cookie parser, lê os dados dos cookies para req.cookies (que será resgatado no authController);
app.use(cookieParser());

// Data sanitization contra NoSQL query injections;
//  -> remove todos os "." e "$" da requisição e da query string, que são operadores do MongoDB;
app.use(mongoSanitize());

// Data sanitization contra XSS;
//  -> transforma qualquer tag html vinda em um parâmetro da requisição, evitando a injeção de scripts;
app.use(xss());

// Evita parameter pollution;
//  -> evita que haja parâmetros duplicados na query string;
app.use(hpp());

// comprime os textos que são mandados para o client;
app.use(compression());

// -----------------------------------------
// --------------------- Routes (middleware)
// -----------------------------------------

// rota das views
app.use("/", viewRouter);
//  -> whitelist dos parâmetros ignorados pelo hpp na query string;
app.use("/api/v1/tours", hpp({ whitelist: hppWhitelist.tour }), tourRouter);
app.use("/api/v1/users", hpp({ whitelist: hppWhitelist.user }), userRouter);
app.use("/api/v1/jobs", hpp({ whitelist: hppWhitelist.job }), jobRouter);
app.use(
  "/api/v1/reviews",
  hpp({ whitelist: hppWhitelist.review }),
  reviewRouter
);

// caso o request não acerte nenhuma url acima, ele vai parar no router abaixo
app.all("*", (req, res, next) => {
  // se a função next() receber um parâmetro, não importa qual for, o Express vai automaticamente
  // assumir que é um erro e pular direto para o middleware de error handling;
  next(
    new AppError(
      msg["error.urlNotFound"].replace("{{url}}", req.originalUrl),
      404
    )
  );
});

// -----------------------------------------
// -------------- Error handler (middleware)
// -----------------------------------------
//  -> acerta esse cara quando a função next() recebe um parâmetro;
app.use(globalErrorHandler);

module.exports = app;
