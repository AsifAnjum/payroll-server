const Payroll = require("../models/Payroll");

exports.createPayrollService = async (payrollInfo, session) => {
  return await Payroll.create([payrollInfo], { session });
};
exports.getPayrollsService = async (filters, queries) => {
  const payrolls = await Payroll.find(filters)
    .skip(queries.skip)
    .limit(queries.limit)
    .select(queries.fields)
    .sort(queries.sortBy);

  const total = await Payroll.countDocuments(filters);
  const page = Math.ceil(total / queries.limit);

  return { total, page, payrolls };
};

exports.getPayrollService = async (filters, populateField) => {
  let payroll = await Payroll.findOne(filters);
  if (populateField) {
    payroll = await payroll.populate(populateField);
  }

  return payroll;
}; //
