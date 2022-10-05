const mongoose = require("mongoose");
const dotenv = require("dotenv"); // Salva na aplicação as variáveis de ambiente listada no arquivo de configuração;

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
  .then(() => console.log("Database connection Successful!"));

// Lista as variáveis de ambiente da aplicação;
// console.log(process.env);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});
