const express = require("express");
const designationController = require("../controllers/designationController");
const { verifyToken } = require("../middleware/verifyToken");
const authorization = require("../middleware/authorization");
const { admin, hrManager } = require("../utils/constants");
const router = express.Router();

router
  .route("/")
  .post(verifyToken, authorization(admin), designationController.addDesignation)
  .get(
    verifyToken,
    authorization(admin, hrManager),
    designationController.fetchAllDesignation
  );

router
  .route("/:id")
  .get(
    verifyToken,
    authorization(admin, hrManager),
    designationController.fetchDesignation
  )
  .patch(
    verifyToken,
    authorization(admin),
    designationController.editDesignation
  )
  .delete(
    verifyToken,
    authorization(admin),
    designationController.removeDesignation
  );

module.exports = router;
