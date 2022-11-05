const crypto = require("crypto");
const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const msg = require("../../languages/pt-BR.json");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, msg["vld.required"].replace("{{field}}", "name")],
    },
    email: {
      type: String,
      require: [true, msg["vld.required"].replace("{{field}}", "email")],
      unique: true,
      lowercase: true,
      validate: [
        validator.isEmail,
        msg["vld.invalidField"].replace("{{field}}", "email"),
      ],
    },
    photo: String,
    role: {
      type: String,
      enum: {
        values: ["user", "admin"],
        message: msg["vld.enumType"]
          .replace("{{field}}", "role")
          .replace("{{values}}", "user/admin"),
      },
      default: "user",
    },
    password: {
      type: String,
      required: [true, msg["vld.required"].replace("{{field}}", "password")],
      minlength: 6,
      select: false,
    },
    passwordConfirm: {
      type: String,
      required: [
        true,
        msg["vld.required"].replace("{{field}}", "passwordConfirm"),
      ],
      validate: {
        // esse  validator só funciona em "User.create(..." ou "User.save(...";
        validator: function (el) {
          return el === this.password;
        },
        message: msg["vld.userPasswordConfirm"],
      },
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
  },
  {
    toJSON: { virtuals: true },
    toOject: { virtuals: true },
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

// roda antes do "save" e verifica se o password foi modificado;
userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();
  this.passwordChangedAt = Date.now();
  next();
});

// força que qualquer .find nunca traga registros inativos;
userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

// -------- Instance method;
//  -> é um método que fica disponível em todos os documentos dessa coleção;
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (!this.passwordChangedAt) return false;

  const changedTimestamp = parseInt(
    this.passwordChangedAt.getTime() / 1000,
    10
  );

  return JWTTimestamp <= changedTimestamp;
};

userSchema.methods.createPasswordResetToken = function () {
  // cria um token aleatório;
  const resetToken = crypto.randomBytes(32).toString("hex");
  // encripta o token criado e salva no banco;
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  // validade do token criado, salvo no banco;
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  // retorna o token NÃO ENCRIPTADO, que será enviado por e-mail ao usuário pela chamada do método;
  //  -> porque salvar o token encriptado no banco? Para proteger caso algum hacker invada o banco,
  //     assim ele terá apenas acesso ao token de mudança de encriptado, o que é inútil.
  return resetToken;
};

module.exports = mongoose.model("User", userSchema);
