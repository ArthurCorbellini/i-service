const msg = require("../../languages/pt-BR.json");
const catchAsync = require("../utils/catchAsync");
const factory = require("./handlerFactory");
const User = require("../models/userModel");
const AppError = require("../utils/appError");

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });

  return newObj;
};

exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(msg["error.thisRouteIsNotForPasswordUpdates"], 400)
    );
  }

  // mantém apenas os parâmetros que o usuário pode atualizar do body, e remove o resto;
  //  -> evita, por exemplo, que o usuário coloque o parâmetro "password" no corpo da requisição;
  const filteredBody = filterObj(req.body, "name", "email");

  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  factory.sendResponse(updatedUser, 200, res);
});

exports.inactivateMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  factory.sendResponse(null, 204, res);
});
