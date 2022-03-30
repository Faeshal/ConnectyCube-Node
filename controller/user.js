require("dotenv").config();
require("pretty-error").start();
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");
const uniqid = require("uniqid");
const { models } = require("../model");
const User = models.user;
const ConnectyCube = require("connectycube");
const { validationResult } = require("express-validator");
const { ErrorResponse } = require("../middleware/errorHandler");
const {
  conCubeDeleteUser,
  conCubeRegister,
  conCubeUpdateEmail,
} = require("../util/conCube");

// * Cred ConnectyCube
const CREDENTIALS = {
  appId: process.env.CCUBE_APP_ID,
  authKey: process.env.CCUBE_AUTH_KEY,
  authSecret: process.env.CCUBE_AUTH_SECRET,
};
ConnectyCube.init(CREDENTIALS);

// * @route   POST api/auth/register
// @desc      Signup new user
// @access    Public
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password } = req.body;

  // *Express Validator
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new ErrorResponse(errors.array({ onlyFirstError: true })[0].msg, 400)
    );
  }

  // * Check Double Email
  const isExist = await User.findOne({ where: { email: email } });
  if (isExist) {
    return next(new ErrorResponse("Email Already Exist", 400));
  }

  // * Hash Password
  const hashedPw = await bcrypt.hash(password, 12);

  // * Generate Api_Key
  const apiKey = uniqid() + uniqid.process();

  // * ConnectyCube
  conCubeRegister({ name, email, password });

  const user = new User({
    name,
    email,
    password: hashedPw,
    apiKey,
  });
  await user.save();

  res.status(200).json({
    success: true,
    data: { name, email, apiKey },
  });
});

// * @route   POST api/auth/login
// @desc      Signin new user
// @access    Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // *Express Validator
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new ErrorResponse(errors.array({ onlyFirstError: true })[0].msg, 400)
    );
  }

  // * Check is email exist ?
  const user = await User.findOne({ where: { email: email } });
  if (!user) {
    return next(new ErrorResponse("user pass not valid", 400));
  }

  // * Compare Password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return next(new ErrorResponse("user pass not valid", 400));
  }

  res.status(200).json({ success: true, data: { msg: "login success" } });
});

// * @route POST  /api/users
// @desc    get all users
// @access  Private
exports.getUsers = asyncHandler(async (req, res, next) => {
  const data = await User.findAll();
  res.status(201).json({ success: true, totalData: data.length, data });
});

// * @route POST  /api/users
// @desc    update users email
// @access  Private
exports.updateEmail = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { currentEmail, newEmail } = req.body;

  // * Check Valid Email
  const isValid = await User.findOne({
    where: { email: currentEmail },
    raw: true,
  });
  if (!isValid) {
    return next(new ErrorResponse("current email was not found", 404));
  }

  // * Check Email was taken or not
  const isTaken = await User.findOne({
    where: { email: newEmail },
    attributes: ["id"],
    raw: true,
  });
  if (isTaken) {
    return next(new ErrorResponse("email already taken by another user", 400));
  }

  // * conCube utils
  const conCubeUtil = await conCubeUpdateEmail({
    conCubeId: isValid.conCubeId,
    conCubePassword: isValid.conCubePassword,
    email: currentEmail,
    newEmail,
  });
  if (conCubeUtil.success == false) {
    return next(new ErrorResponse("conCube update email failed", 500));
  }

  // * Save New Email
  await User.update({ email: newEmail }, { where: { id } });

  res.status(200).json({
    success: true,
    message: "email sucesfully change",
  });
});

// * @route POST  /api/users
// @desc    delete New users
// @access  Private
exports.deleteUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  // * Delete in connectycube
  const user = await User.findByPk(id);
  if (!user) {
    return res.json({ success: false, message: "not found" });
  }

  // * delete in conCube
  await conCubeDeleteUser({
    conCubeId: user.conCubeId,
    conCubePassword: user.conCubePassword,
    email: user.email,
  });

  // * delete in db
  const data = await User.destroy({ where: { id } });
  res.status(201).json({ success: true, data });
});
