const crypto = require("crypto");
const { promisify } = require("util");
const jwt = require("jsonwebtoken");

const msg = require("../../languages/pt-BR.json");
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
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_DAYS * 24 * 60 * 60 * 1000
    ),
    // parâmetro que não deixa o cookie ser acessado ou modificado pelo browser;
    //  -> evita ataques de cross-site scripting;
    //  -> o browser apenas pode receber, guardar e enviar o cookie nas requisições;
    httpOnly: true,
  };

  // parâmetro que obriga o cookie a ser enviado apenas em conexão encriptada (https);
  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;

  res.cookie("jwt", token, cookieOptions);

  user.password = undefined;

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
    return next(new AppError(msg["error.pleaseProvideEmailAndPassword"], 400));
  }

  // mesma coisa que:
  //  -> const user = User.findOne({ email: email });
  // o .select("+password") força o select do password, já que no model ele tá select: false;
  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError(msg["error.incorrectEmailOrPassword"], 401));
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
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(new AppError(msg["error.youAreNotLoggedIn"], 401));
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
      new AppError(msg["error.userOfThisTokenDoesNoLongerExist"], 401)
    );
  }

  // 4) verifica se o usuário desse token alterou o password depois do token ser criado;
  if (freshUser.changedPasswordAfter(decoded.iat)) {
    return next(new AppError(msg["error.userRecentlyChangedPassword"], 401));
  }

  req.user = freshUser;
  next();
});

exports.isLoggedIn = catchAsync(async (req, res, next) => {
  const token = req.cookies.jwt;
  if (!token) return next();

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  const freshUser = await User.findById(decoded.id);
  if (!freshUser) return next();
  if (freshUser.changedPasswordAfter(decoded.iat)) return next();

  // req.locals pode ser acessado pelo .pug;
  res.locals.user = freshUser;
  next();
});

exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    // req.user.role é setado no final do middleware "authController.protect"
    if (!roles.includes(req.user.role)) {
      return next(new AppError(msg["error.permission"], 403));
    }

    next();
  };

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError(msg["error.noUserWithThisEmail"], 404));
  }

  const resetToken = user.createPasswordResetToken();
  // "validateModifiedOnly: true" porque "user.passwordConfirm" é required mas não é salvo no banco;
  await user.save({ validateModifiedOnly: true });

  // ATENÇÃO -> url em hardcode não é o ideal
  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/users/resetPassword/${resetToken}`;

  try {
    await sendEmail({
      email: user.email,
      subject: msg["msg.forgotYourPasswordEmailSubject"],
      message: msg["msg.forgotYourPasswordEmailMessage"].replace(
        "{{resetURL}}",
        resetURL
      ),
    });

    res.status(200).json({
      status: "success",
      message: msg["msg.tokenSentToEmail"],
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateModifiedOnly: true });

    return next(new AppError(msg["error.sendingEmail"]), 500);
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
    return next(new AppError(msg["error.tokenInvalidOrExpired"], 400));
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
    return next(new AppError(msg["error.yourCurrentPasswordIsWrong"], 401));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  createSendToken(user, 200, res);
});
