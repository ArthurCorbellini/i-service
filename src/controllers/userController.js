const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");

exports.getAllUsers = catchAsync(async (req, res, next) => {
  // provisório
  const users = await User.find();

  res.status(200).json({
    status: "success",
    results: users.length,
    data: {
      users,
    },
  });
});

exports.createUser = (req, res) => {
  res.status(500).json({
    status: "error",
    message: "Rota ainda não definida",
  });
};

exports.getUser = (req, res) => {
  res.status(500).json({
    status: "error",
    message: "Rota ainda não definida",
  });
};

exports.updateUser = (req, res) => {
  res.status(500).json({
    status: "error",
    message: "Rota ainda não definida",
  });
};

exports.deleteUser = (req, res) => {
  res.status(500).json({
    status: "error",
    message: "Rota ainda não definida",
  });
};
