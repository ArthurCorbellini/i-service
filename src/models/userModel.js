const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name required!"],
  },
  email: {
    type: String,
    require: [true, "E-mail required!"],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Invalid e-mail!"],
  },
  photo: String,
  password: {
    type: String,
    required: [true, "Password required!"],
    minlength: 6,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, "Confirm your password!"],
    validate: {
      // esse  validator só funciona em "User.create(..." ou "User.save(...";
      validator: function (el) {
        return el === this.password;
      },
      message: "Passwords are not the same!",
    },
  },
  passwordChangedAt: Date,
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;

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

  return JWTTimestamp < changedTimestamp;
};

module.exports = mongoose.model("User", userSchema);
