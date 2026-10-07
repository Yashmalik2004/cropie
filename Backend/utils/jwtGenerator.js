const jwt = require("jsonwebtoken");

const generateJWT = async function (payload) {
  try {
    return await jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "2d" });
  } catch (error) {
    console.log("Error while Generating Json Web Token", error);
  }
};

module.exports = generateJWT;
