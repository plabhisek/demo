const nodemailer = require('nodemailer');

let transporter;

// Create reusable transporter object using SMTP transport
const setupTransporter = () => {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: process.env.EMAIL_USER && process.env.EMAIL_PASSWORD ? {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    } : null,
  });
};

const sendEmail = async (to, subject, html) => {
  if (!transporter) {
    setupTransporter();
  }
  console.log("Hi Here");
  try {
    const info = await transporter.sendMail({
      from: `"Meeting Manager" <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      html,
    });

    console.log(`Email sent: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
};

module.exports = {
  setupTransporter,
  sendEmail,
};