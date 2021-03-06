require("pretty-error").start();
const express = require("express");
const router = express.Router();
const userController = require("../controller/user");

router.post("/api/v1/auth/register", userController.register);
router.post("/api/v1/auth/login", userController.login);

router.get("/api/v1/users", userController.getUsers);
router.put("/api/v1/users/:id", userController.updateEmail);
router.delete("/api/v1/users/:id", userController.deleteUser);

router.post("/api/v1/users/dialogs", userController.createDialog);

module.exports = router;
