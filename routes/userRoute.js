const express = require("express");
const userController = require("../controllers/userController");
const { verifyToken } = require("../middleware/verifyToken");
const authorization = require("../middleware/authorization");
const { uploader } = require("../middleware/uploader");
const { admin, hrManager } = require("../utils/constants");
const router = express.Router();

router.post(
  "/signup",
  verifyToken,
  authorization(admin),
  userController.signup
);
router.get("/signup/confirmation/:token", userController.verifyUser);

router.post("/login", userController.login);
router.get("/me", verifyToken, userController.getMe);

router.get(
  "/all",
  verifyToken,
  authorization(admin, hrManager),
  userController.fetchAllUsers
);

router.post("/logout", verifyToken, userController.logout);

router.patch(
  "/update-password",
  verifyToken,
  userController.updateUserPassword
);

router.patch("/reset-password-token", userController.resetPasswordToken);
router.get("/reset-password/:token", userController.getResetToken);
router.patch("/reset-password/:token", userController.resetPassword);

router
  .route("/:id")
  .get(verifyToken, authorization(admin, hrManager), userController.fetchUser)
  .patch(verifyToken, authorization(admin), userController.updateUserProfile);

router.patch(
  "/salary-adjustment",
  verifyToken,
  authorization(admin),
  userController.updateUserSalaryAdjustment
);

router.patch(
  "/:id/upload-image",
  verifyToken,
  authorization(admin),
  uploader.single("image"),
  userController.updateUserImg
);
module.exports = router;
