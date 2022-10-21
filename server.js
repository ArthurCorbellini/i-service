const mongoose = require("mongoose");
const dotenv = require("dotenv"); // Salva na aplicação as variáveis de ambiente listada no arquivo de configuração;
const msg = require("./languages/pt-BR.json");

// todos os erros que ocorrem em código síncrono e que não forem tratados em nenhum lugar são chamados de "uncaught
// exceptions" e irão acionar o eventListener abaixo:
//  -> esse eventListener precisa ficar no topo da aplicação;
process.on("uncaughtException", (err) => {
  console.log(" -> UNCAUGHT EXCEPTION:");
  console.log(err.name, err.message);
  console.log(" -> Shutting down.");
  process.exit(1);
});

dotenv.config({ path: "./config.env" });
const app = require("./src/app");

const db = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(db, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => console.log(msg["warn.databaseConnectionSuccessful"]));

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(msg["warn.appRunningPort"].replace("{{port}}", port));
});

// caso alguma promessa for rejeitada fora do escopo do Express e essa promessa não for tratada em
// nenhum outro lugar, o eventListener abaixo é acionado;
process.on("unhandledRejection", (err) => {
  console.log(" ------------ UNHANDLED REJECTION!");
  console.log(err.name, err.message);
  console.log(" ------------ UNHANDLED REJECTION! Shutting down!");
  server.close(() => {
    process.exit(1);
  });
});
