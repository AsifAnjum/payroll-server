const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const { revokedToken, getToken } = require("../utils/token");
const { response } = require("../utils/helperFunctions");
const { admin } = require("../utils/constants");

exports.verifyToken = async (req, res, next) => {
  try {
    const token = getToken(req);

    if (!token) {
      return response(res, 401, "failed", "You are not logged in");
    }

    if (revokedToken.has(token)) {
      return response(res, 401, "failed", "please login");
    }

    const decoded = await promisify(jwt.verify)(
      token,
      process.env.CRYPTO_TOKEN
    );

    // login only 9AM to 5PM
    const currentTime = new Date().getHours();

    if (decoded.role !== admin && (currentTime < 9 || currentTime > 17)) {
      revokedToken(token, decoded.exp);
    }

    req.user = decoded;

    next();
  } catch (error) {
    response(res, 400, "failed", "please login", error);
  }
};
