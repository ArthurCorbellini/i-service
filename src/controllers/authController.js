const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

// método que assina o token recebendo o id do usuário por parâmetro;
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  const token = signToken(newUser._id);

  res.status(201).json({
    status: "success",
    token,
    data: {
      user: newUser,
    },
  });
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

  const token = signToken(user._id);

  res.status(200).json({
    status: "success",
    token,
  });
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
