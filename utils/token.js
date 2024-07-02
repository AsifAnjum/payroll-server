const jwt = require("jsonwebtoken");

exports.generateToken = (userInfo) => {
  const payload = {
    id: userInfo._id,
    name: userInfo.name,
    email: userInfo.email,
    role: userInfo.role,
  };

  const token = jwt.sign(payload, process.env.CRYPTO_TOKEN, {
    expiresIn: "2h",
  });

  return token;
};

//? add blacklist token
//? or just store in database
exports.revokedToken = new Map();

exports.getToken = (req) => {
  return req.headers?.authorization?.split(" ")?.[1];
};

const cleanRevokedToken = (tokenMap, threshold) => {
  if (!tokenMap || typeof threshold !== "number") {
    console.error("Invalid arguments: tokenMap or threshold");
    return;
  }
  tokenMap.size > 0 &&
    tokenMap.forEach((value, key) => {
      if (value <= threshold) {
        tokenMap.delete(key);
      }
    });
};

const cleanToken = setInterval(
  () => cleanRevokedToken(this.revokedToken, Math.floor(Date.now() / 1000)),
  10800000
); //3 hour in milliseconds = 3600000
