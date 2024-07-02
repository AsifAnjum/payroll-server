const express = require("express");
const payrollController = require("../controllers/payrollController");
const { verifyToken } = require("../middleware/verifyToken");
const authorization = require("../middleware/authorization");
const { admin, hrManager } = require("../utils/constants");
const router = express.Router();

router
  .route("/")
  .post(verifyToken, authorization(admin), payrollController.addPayroll)
  .get(
    verifyToken,
    authorization(admin, hrManager),
    payrollController.fetchAllPayroll
  );

router
  .route("/:id")
  .get(
    verifyToken,
    authorization(admin, hrManager),
    payrollController.fetchPayroll
  );

module.exports = router;
