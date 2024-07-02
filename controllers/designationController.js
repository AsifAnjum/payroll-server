const User = require("../models/User");
const {
  createDesignationService,
  updateDesignationService,
  deleteDesignationService,
  getAllDesignationsService,
  getDesignationByIdService,
} = require("../services/designationService");
const {
  getUserService,
  getAllUsersService,
} = require("../services/userService");
const sendEmail = require("../utils/email");
const { response, isObjEmpty } = require("../utils/helperFunctions");

exports.addDesignation = async (req, res) => {
  try {
    if (isObjEmpty(req.body)) {
      return response(res, 400, "failed", "No data found!!!");
    }
    const result = await createDesignationService(req.body);

    response(res, 201, "success", "successfully created", null, result);
  } catch (error) {
    response(res, 400, "failed", error.message, error);
  }
};

exports.fetchDesignation = async (req, res) => {
  const { id } = req.params;
  try {
    const designation = await getDesignationByIdService({ _id: id });
    if (!designation) {
      return response(res, 404, "failed", "No designation found!!");
    }

    const employeeWithDesignation = await getAllUsersService({
      "designation.id": designation._id,
    });

    response(res, 200, "success", null, null, {
      designation,
      employees: {
        total: employeeWithDesignation.length,
        users: employeeWithDesignation,
      },
    });
  } catch (error) {
    response(res, 400, "failed", error.message, error);
  }
};

exports.fetchAllDesignation = async (req, res) => {
  try {
    const result = await getAllDesignationsService();
    response(res, 200, "success", null, null, result);
  } catch (error) {
    response(res, 400, "failed", error.message, error);
  }
};

exports.editDesignation = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await updateDesignationService(id, req.body);
    return response(res, 200, "success", "successfully updated");
  } catch (error) {
    response(res, 400, "failed", error.message, error);
  }
};

exports.removeDesignation = async (req, res) => {
  try {
    const { id } = req.params;
    const userDesignation = await getUserService({ "designation.id": id });

    if (userDesignation) {
      return response(
        res,
        400,
        "failed",
        "Employees with the designation already exist!!"
      );
    }

    const deleteDesignation = await deleteDesignationService(id);

    return response(res, 200, "success", "successfully deleted");
  } catch (error) {
    response(res, 400, "failed", error.message, error);
  }
};
