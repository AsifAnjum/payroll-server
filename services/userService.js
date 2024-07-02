const User = require("../models/User");

exports.signupService = async (userInfo) => {
  return await User.create(userInfo);
};

exports.getAllUsersService = async (filters, queries = {}) => {
  const users = await User.find(filters)
    .skip(queries.skip)
    .limit(queries.limit)
    .select(queries.fields)
    .sort(queries.sortBy);

  const total = await User.countDocuments(filters);
  const page = Math.ceil(total / queries.limit);

  return { total, page, users };
};

exports.getUserService = async (filters, populateField) => {
  let user = await User.findOne(filters);
  if (populateField) {
    user = await user.populate(populateField);
  }

  return user;
}; // filters =  {field: value}

exports.updateUserService = async (userId, userData) => {
  return await User.updateOne({ _id: userId }, userData, {
    runValidators: true,
  }); // data = {fieldName: value}
};

exports.deleteUserService = async (userId) => {
  return await User.deleteOne({ _id: userId });
};
