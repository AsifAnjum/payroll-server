const {
  signupService,
  getUserService,
  updateUserService,
  getAllUsersService,
  deleteUserService,
} = require("../services/userService");
const sendEmail = require("../utils/email");
const {
  restrictField,
  isObjEmpty,
  response,
} = require("../utils/helperFunctions");
const { generateToken, getToken, revokedToken } = require("../utils/token");
const { uploadUserImg } = require("../middleware/uploader");
const { active, admin } = require("../utils/constants");

exports.signup = async (req, res) => {
  try {
    if (isObjEmpty(req.body)) {
      return response(res, 400, "failed", "No data found!!!");
    }
    const {
      name,
      email,
      password,
      confirmPassword,
      gender,
      contactNumber,
      imageURL,
      birth,
      designation: { id, title },
      salary,
      salaryAdjustment,
      address,
      dateOfJoining,
    } = req.body;

    if (!salary || !salaryAdjustment) {
      return response(
        res,
        400,
        "failed",
        "salary & salaryAdjustment data not found!!!"
      );
    }

    if (isNaN(salary) || isNaN(salaryAdjustment)) {
      return response(
        res,
        400,
        "failed",
        "salary & salaryAdjustment are not a numbers!!!"
      );
    }

    const updatedSalary =
      salaryAdjustment != 0
        ? Number(salary) + Number(salary) * (Number(salaryAdjustment) / 100)
        : salary;

    const userInfo = {
      name,
      email,
      password,
      confirmPassword,
      gender,
      contactNumber,
      imageURL,
      birth,
      dateOfJoining,
      designation: { id, title },
      salary: updatedSalary,
      salaryAdjustment,
      address,
    };

    const user = await signupService(userInfo);

    const token = user.generateConfirmationToken();

    const activationLink = `${req.protocol}://${req.get("host")}${
      req.originalUrl
    }/confirmation/${token}`;

    const mail = await sendEmail({
      to: email,
      subject: "Activate Your New Account - ABC Company",
      body: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333333; background-color: #f9f9f9; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #dddddd; border-radius: 5px; background-color: #ffffff;">
        <div style="font-size: 24px; font-weight: bold; color: #4CAF50; margin-bottom: 20px;">Welcome to ABC!</div>
        <div style="font-size: 16px; margin-bottom: 20px;">
            Hello ${user.name}!,
        </div>
        <div style="font-size: 16px; margin-bottom: 20px;">
            To activate your account, click link below <br><br>
            <a href=${activationLink} style="display: inline-block; padding: 10px 20px; font-size: 16px; color: #ffffff; background-color: #4CAF50; border-radius: 5px; text-decoration: none;">Confirm Your Account</a> <br><br>
            If you did not know about this, please disregard this email.<br><br>
        </div>
        <div style="font-size: 14px; color: #777777; margin-top: 20px;">
            Best regards,<br>
            CEO, ABC ltd<br>
        </div>
    </div>
</div>
      `,
    });

    await user.save({ validateBeforeSave: false });
    response(res, 201, "success", "successfully signed up");
  } catch (error) {
    response(res, 400, "failed", error.message, error);
  }
};

exports.verifyUser = async (req, res) => {
  try {
    const { token } = req.params;
    const user = await getUserService({ confirmationToken: token });

    if (!user) {
      return response(res, 404, "failed", "No user found");
    }

    const expired = new Date() > new Date(user.confirmationTokenExpires);

    if (expired) {
      return response(res, 400, "failed", "Expired!!");
    }

    user.status = active;
    user.confirmationToken = undefined;
    user.confirmationTokenExpires = undefined;

    await user.save({ validateBeforeSave: false });

    response(res, 200, "success", "Successfully activated your account.");
  } catch (error) {
    response(res, 400, "failed", error.message, error);
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return response(res, 400, "failed", "Please provide your credentials");
    }

    const currentTime = new Date().getHours();

    const user = await getUserService({ email });

    if (!user) {
      return response(
        res,
        404,
        "failed",
        "No user found. Please create an account"
      );
    }

    if (user.role !== admin && (currentTime < 9 || currentTime > 17)) {
      return response(res, 400, "failed", "Login time 9AM to 5PM");
    }

    const isPasswordValid = user.comparePassword(password, user.password);

    if (!isPasswordValid) {
      return response(res, 400, "failed", "Wrong Password!!");
    }

    if (user.status !== active) {
      return response(
        res,
        400,
        "failed",
        `Sorry!!! Your account is ${user.status}. Please contact support via mail`
      );
    }

    const token = generateToken(user);
    res.cookie("jwtToken", token, { httpOnly: true, secure: true });

    const { password: pwd, ...others } = user.toObject();

    response(res, 200, "success", "successfully logged in", null, {
      user: others,
      token,
    });
  } catch (error) {
    response(res, 400, "failed", error.message, error);
  }
};

exports.getMe = async (req, res) => {
  const userId = req?.user?.id;

  try {
    const user = await getUserService({ _id: userId });

    if (!user) {
      return response(res, 404, "failed", "No user Found");
    }
    const { password: pwd, ...others } = user.toObject();

    response(res, 200, "success", null, null, others);
  } catch (error) {
    response(res, 400, "failed", error.message, error);
  }
};

exports.fetchAllUsers = async (req, res) => {
  try {
    let filters = { ...req.query };

    //sort,page,limit ---> exclude
    const excludeFields = ["sort", "page", "limit", "fields"];
    excludeFields.forEach((field) => delete filters[field]);

    // gt, lt, gte, lte;
    // let filterString = JSON.stringify(filters);
    // filterString = filterString.replace(
    //   /\b(eq|gt|gte|lt|lte|ne|regex)\b/g,
    //   (match) => `$${match}`
    // );

    // filters = JSON.parse(filterString);

    const queries = {};

    if (req.query.search) {
      const searchQuery = req.query.search;
      for (const key in searchQuery) {
        searchQuery[key] = new RegExp(searchQuery[key], "i");
      }
      filters = searchQuery;
    }

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

    const users = await getAllUsersService(filters, queries);

    response(res, 200, "success", null, null, users);
  } catch (error) {
    response(res, 400, "failed", error.message, error);
  }
};

exports.fetchUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await getUserService({ _id: id });

    if (!user) {
      return response(res, 404, "failed", "No user Found");
    }

    if (user.role == admin) {
      if (req.user.role !== admin) {
        return response(res, 403, "failed", "you are not authorized!");
      }
    }
    const { password: pwd, ...others } = user.toObject();

    response(res, 200, "success", null, null, others);
  } catch (error) {
    response(res, 400, "failed", error.message, error);
  }
};

//for admin only
exports.updateUserProfile = async (req, res) => {
  try {
    if (isObjEmpty(req.body)) {
      return response(res, 400, "failed", "No data found!!!");
    }
    const { id } = req.params;
    if (!id) {
      return response(res, 400, "failed", "No id found!!!");
    }

    const filterFieldArray = [
      "password",
      "salary",
      "imageURL",
      "salaryAdjustment",
      "confirmationToken",
      "confirmationTokenExpires",
      "passwordChangedAt",
      "passwordResetToken",
      "passwordResetExpires",
    ];
    const isFieldExist = restrictField(filterFieldArray, req.body);

    if (isFieldExist) {
      return response(res, 401, "failed", "You can not update", null, {
        restrictField: filterFieldArray,
      });
    }

    const result = await updateUserService(id, req.body);

    if (!result.acknowledged) {
      return response(res, 400, "failed", "Updated failed!!!");
    }

    return response(res, 200, "success", "successfully updated");
  } catch (error) {
    response(res, 400, "failed", error.message, error);
  }
};

exports.updateUserImg = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await getUserService({ _id: id });

    if (!user) {
      return response(res, 404, "failed", "No user Found");
    }

    const uploadImg = await uploadUserImg(req, res);

    await user.updateOne({ imageURL: uploadImg });

    response(res, 200, "success", "successfully updated user profile");
  } catch (error) {
    response(res, 400, "failed", error.message, error);
  }
};

exports.updateUserSalaryAdjustment = async (req, res) => {
  const { id: userId } = req.body;
  const { salaryAdjustment } = req.body;
  try {
    if (!salaryAdjustment || !userId) {
      return response(
        res,
        400,
        "failed",
        "salaryAdjustment or userId not given!!!"
      );
    }
    if (isNaN(salaryAdjustment)) {
      return response(res, 400, "failed", "salaryAdjustment must be number!!!");
    }
    const populateField = { path: "designation.id", select: "-_id baseSalary" };
    const user = await getUserService({ _id: userId }, populateField);

    if (!user) {
      return response(res, 404, "failed", "No user Found");
    }

    const baseSalary = Number(user?.designation?.id?.baseSalary);

    const updatedSalary =
      baseSalary + baseSalary * (Number(salaryAdjustment) / 100); //percentage

    await user.updateOne({ salary: updatedSalary, salaryAdjustment });

    return response(res, 200, "success", "successfully updated");
  } catch (error) {
    response(res, 400, "failed", error.message, error);
  }
};

exports.updateUserPassword = async (req, res) => {
  try {
    const { password, confirmPassword } = req?.body;
    const { id: userId } = req?.user;

    const user = await getUserService({ _id: userId });

    if (!user) {
      return response(res, 404, "failed", "No user Found");
    }

    const isSamePassword = user.comparePassword(password, user.password);

    if (isSamePassword) {
      return response(res, 400, "failed", "you are using old password again");
    }

    user.password = password;
    user.confirmPassword = confirmPassword;

    await user.save();

    res.clearCookie("jwtToken", token, { httpOnly: true, secure: true });

    const existingToken = getToken(req);

    revokedToken.set(existingToken, req?.user?.exp);

    response(res, 200, "success", "successfully updated");
  } catch (error) {
    response(res, 400, "failed", error.message, error);
  }
};

exports.resetPasswordToken = async (req, res, next) => {
  try {
    const email = req.body.email;
    if (!email) {
      return response(res, 400, "failed", "Email Required!!!");
    }
    const user = await getUserService({ email });

    if (!user) {
      return response(res, 404, "failed", "No user found with this email!!!");
    }

    const token = await user.generateResetToken();

    await user.save({ validateBeforeSave: false });

    const resetPasswordLink = `${req.protocol}://${req.get(
      "host"
    )}/api/v1/user/reset-password/${token}`;

    const mail = await sendEmail({
      to: req.body.email,
      subject: "Password Reset Request - ABC Company",
      body: `
  <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <h1 style="background-color: #e74c3c; color: white; padding: 10px; text-align: center;">Password Reset Request - ABC Company</h1>
      <p style="font-size: 16px;">You recently requested to reset your password for your ABC Company account.</p>
      <p style="font-size: 16px;">To reset your password, please click the button below:</p>
      <a href="${resetPasswordLink}" style="display: inline-block; background-color: #e74c3c; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; text-align: center;">Reset Password</a>
      <p style="font-size: 16px;">This link will expire in ${user?.passwordResetExpires} hours.</p>
      <p style="font-size: 16px;">If you did not request a password reset, please ignore this email.</p>
      <p style="font-size: 16px;">Best regards,<br>
        <span style="font-style: italic; font-weight: bold">The ABC Company Team</span>
      </p>
    </div>
  `,
    });

    response(res, 200, "success", null, null, { token });
  } catch (error) {
    response(res, 400, "failed", error.message, error);
  }
};

exports.getResetToken = async (req, res) => {
  try {
    const { token } = req.params;
    const user = await getUserService({ passwordResetToken: token });

    if (!user) {
      return response(res, 404, "failed", "Invalid Token. Try Again!!!");
    }
    const expired = new Date() > new Date(user.passwordResetExpires);
    if (expired) {
      return response(res, 404, "failed", "Token Expired!!!");
    }
    response(res, 200, "success");
  } catch (error) {
    response(res, 400, "failed", error.message, error);
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { password, confirmPassword } = req?.body;

    if (!password || !confirmPassword) {
      return response(res, 400, "failed", "field required!!!");
    }

    const { token } = req?.params;

    if (!token) {
      return response(res, 400, "failed", "Something went wrong!!!");
    }

    const user = await getUserService({ passwordResetToken: token });

    if (!user) {
      return response(res, 404, "failed", "Invalid Token. Try Again!!!");
    }
    const expired = new Date() > new Date(user.passwordResetExpires);

    if (expired) {
      return response(res, 404, "failed", "Token Expired!!!");
    }

    const isSamePassword = user.comparePassword(password, user.password);

    if (isSamePassword) {
      return response(res, 400, "failed", "you are using old password again");
    }

    user.password = password;
    user.confirmPassword = confirmPassword;
    user.passwordResetExpires = undefined;
    user.passwordResetToken = undefined;
    user.passwordChangedAt = new Date();

    await user.save();
    response(res, 200, "success", "Successfully updated password");
  } catch (error) {
    response(res, 400, "failed", error.message, error);
  }
};

exports.logout = async (req, res) => {
  try {
    const token = getToken(req);

    if (!token) {
      return response(res, 400, "failed", "Something went wrong!!!");
    }

    res.clearCookie("jwtToken", token, { httpOnly: true, secure: true });

    revokedToken.set(token, req?.user?.exp);

    response(res, 200, "success", "Logout successfully");
  } catch (error) {
    response(res, 400, "failed", "Something Went Wrong", error);
    r;
  }
};

exports.removeUser = async (req, res) => {
  try {
    const { id } = req.params;

    const deleteUser = await deleteUserService(id);

    return response(res, 200, "success", "successfully deleted");
  } catch (error) {
    response(res, 400, "failed", error.message, error);
  }
};
