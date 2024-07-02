const mongoose = require("mongoose");

const {
  createPayrollService,
  getPayrollsService,
  getPayrollService,
} = require("../services/payrollService");
const { getUserService } = require("../services/userService");
const {
  response,
  restrictField,
  isObjEmpty,
} = require("../utils/helperFunctions");
const { active } = require("../utils/constants");

exports.addPayroll = async (req, res) => {
  const session = await mongoose.startSession();

  await session.startTransaction();

  try {
    if (isObjEmpty(req.body)) {
      return response(res, 400, "failed", "No data found!!!");
    }
    const {
      employee: { id: employeeId },
      bonus,
      penalty,
      payrollMonth,
    } = req.body;

    const filterFieldArray = [
      "payroll",
      "employee.name",
      "employee.designation",
    ];
    const isFieldExist = restrictField(filterFieldArray, req.body);

    if (isFieldExist) {
      return response(res, 401, "failed", "You can not update", null, {
        restrictField: filterFieldArray,
      });
    }

    const regex = /^\d{4}-(0[1-9]|1[0-2])(-([0-2]\d|3[01]))?$/; //yyyy-mm-dd. year & month are required but date is optional

    if (!regex.test(payrollMonth)) {
      return response(
        res,
        400,
        "failed",
        "Invalid payrollMonth format. Use YYYY-MM."
      );
    }

    const updatedMonth = new Date(payrollMonth)
      .toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
      .split(" ")
      .join("-");

    const user = await getUserService({ _id: employeeId });

    if (!user) {
      return response(res, 404, "failed", "No user Found");
    }

    if (user.status !== active) {
      return response(res, 400, "failed", "user is not activated!");
    }

    const employeeInfo = {
      id: user._id,
      name: user.name,
      designation: user.designation.title,
    };

    let salary = Number(user.salary);

    if (bonus) salary += Number(bonus);

    if (penalty) salary -= Number(penalty);

    const result = await createPayrollService(
      {
        employee: employeeInfo,
        bonus,
        penalty,
        payrollMonth: updatedMonth,
        payroll: salary,
      },
      session
    );

    user.payroll.push(result[0]._id);

    await user.save({ session, validateBeforeSave: false });

    await session.commitTransaction();
    response(res, 201, "success", "successfully created", null, result);
  } catch (error) {
    await session.abortTransaction();

    response(res, 400, "failed", error.message, error);
  } finally {
    session.endSession();
  }
};

exports.fetchAllPayroll = async (req, res) => {
  try {
    let filters = { ...req.query };

    //sort,page,limit ---> exclude
    const excludeFields = ["sort", "page", "limit", "fields"];
    excludeFields.forEach((field) => delete filters[field]);

    const queries = {};

    if (req.query.sort) {
      const sortBy = req.query.sort.split(",").join(" ");
      queries.sortBy = sortBy;
    }

    if (req.query.fields) {
      const fields = req.query.fields.split(",").join(" ");
      queries.fields = fields;
    }

    if (req.query.page) {
      const { page = 1, limit = 1 } = req.query;

      const skip = (page - 1) * parseInt(limit);
      queries.skip = skip;
      queries.limit = parseInt(limit);
    }
    const result = await getPayrollsService(filters, queries);

    response(res, 200, "success", null, null, result);
  } catch (error) {
    response(res, 400, "failed", error.message, error);
  }
};

exports.fetchPayroll = async (req, res) => {
  const { id } = req.params;
  try {
    const payroll = await getPayrollService({ _id: id });
    if (!payroll) {
      return response(res, 404, "failed", "No payroll found!!");
    }

    response(res, 200, "success", null, null, payroll);
  } catch (error) {
    response(res, 400, "failed", error.message, error);
  }
};
