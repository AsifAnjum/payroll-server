const nodemailer = require("nodemailer");
const { google } = require("googleapis");

const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);
oAuth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

const sendEmail = async (data) => {
  const accessToken = await oAuth2Client.getAccessToken();

  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: process.env.GOOGLE_SENDER_MAIL,
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
      accessToken: accessToken,
    },
  });

  const mailData = {
    from: `ABC Company <process.env.GOOGLE_SENDER_MAIL>`, // sender address
    to: data.to, // list of receivers
    subject: data.subject,
    // text: body,
    html: data.body,
  };
  let result = await transporter.sendMail(mailData);

  return result;
};

module.exports = sendEmail;
