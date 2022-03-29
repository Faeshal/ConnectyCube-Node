require("pretty-error").start();
const express = require("express");
const router = express.Router();
const userController = require("../controller/user");

router.post("/api/v1/auth/register", userController.register);
router.post("/api/v1/auth/login", userController.login);

router.get("/api/v1/users", userController.getUsers);
router.put("/api/v1/users/:id", userController.updateUser);
router.delete("/api/v1/users/:id", userController.deleteUser);

module.exports = router;
