const crypto = require("crypto");
const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const sendEmail = require("../utils/email");

// método que assina o token recebendo o id do usuário por parâmetro;
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  // mesma coisa que:
  //  -> "const email = req.body.email" e "const password = req.body.password" ;
  //  -> variável possui o mesmo nome que o atributo no body (object destructuring);
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError("Please provide e-mail and password!", 400));
  }

  // mesma coisa que:
  //  -> const user = User.findOne({ email: email });
  // o .select("+password") força o select do password, já que no model ele tá select: false;
  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Incorrect e-mail or password", 401));
  }

  createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  let token;

  // 1) checa se o token existe (ele precisa vir no header da requisição);
  //     -> a key sendo "Authorization", e o valor sendo com o prefixo "Bearer " + o token em si;
  //     -> exemplo - Authorization: "Bearer iundafiuvnadfiuvadvianfdi";
  //        -> o Express já coloca as chaves em lowercase automaticamente;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(
      new AppError("You are not logged in. Please log in to get access.", 401)
    );
  }

  // 2) verifica se o token enviado é válido;
  //    -> o método "promisify" força o retorno de uma promessa;
  //    -> jwt.verify(token, process.env.JWT_SECRET);
  //    -> caso for um token inválido, dentro do método verify há um catch que acionará um next(err);
  //       -> esse next(err) vai cair lá no errorHandler do errorController;
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) verifica se o usuário ainda existe
  //    -> "decoded" é basicamente o payload do jwt:
  //       {
  //          id: '6344a93ba739370e68d79b99', -> id do usuário
  //          iat: 1665624150, -> data de criação do token
  //          exp: 1673400150  -> validade do token
  //       }
  const freshUser = await User.findById(decoded.id);
  if (!freshUser) {
    return next(
      new AppError(
        "The user belonging to this token does no longer exist.",
        401
      )
    );
  }

  // 4) verifica se o usuário desse token alterou o password depois do token ser criado;
  if (freshUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError("User recently changed password. Please log in again.", 401)
    );
  }

  req.user = freshUser;
  next();
});

exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    // req.user.role é setado no final do middleware "authController.protect"
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action.", 403)
      );
    }

    next();
  };

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(
      new AppError("There is no user with this e-mail address.", 404)
    );
  }

  const resetToken = user.createPasswordResetToken();
  // "validateModifiedOnly: true" porque "user.passwordConfirm" é required mas não é salvo no banco;
  await user.save({ validateModifiedOnly: true });

  // ATENÇÃO -> url em hardcode não é o ideal
  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password and 
  passwordConfirm to: ${resetURL}.\nIf you didn't forget, please ignore this e-mail.`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Your password reset token (valid for 10 min)",
      message,
    });

    res.status(200).json({
      status: "success",
      message: "Token sent to e-mail.",
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateModifiedOnly: true });

    return next(
      new AppError("There was an error sending the e-mail. Try again later."),
      500
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError("Token is invalid or expired.", 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("+password");

  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError("Your current password is wrong.", 401));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  createSendToken(user, 200, res);
});
