const mongoose = require("mongoose");
const Designation = require("../models/Designation");
const User = require("../models/User");

exports.createDesignationService = async (data) => {
  return await Designation.create(data);
};

exports.getAllDesignationsService = async (filters) => {
  return await Designation.find(filters);
};

exports.getDesignationByIdService = async (designationId) => {
  return await Designation.findById(designationId);
};

exports.updateDesignationService = async (designationId, data) => {
  const session = await mongoose.startSession();

  session.startTransaction();
  try {
    const designationData = await Designation.updateOne(
      { _id: designationId },
      data,
      {
        session,
        runValidators: true,
      }
    ); // data = {fieldName: value}

    if (designationData.modifiedCount === 1 && "title" in data) {
      const users = await User.updateMany(
        {
          "designation.id": { $in: designationId },
        },
        { $set: { "designation.title": data.title } },
        { session, runValidators: true }
      );
    }

    await session.commitTransaction();

    return designationData;
  } catch (error) {
    await session.abortTransaction();
    const err = new Error();

    err.message = error.message;
    err.name = error.name;
    err.path = error.path;
    // err.kind = error.kind;
    // err.value = error.value;
    // err.reason = error.reason;
    // err.code = error.code;
    throw err;
  } finally {
    session.endSession();
  }
};

exports.deleteDesignationService = async (designationId) => {
  return await Designation.deleteOne({ _id: designationId });
};
