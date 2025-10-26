import nodemailer from "nodemailer";
import dotenv from "dotenv";
import emailTemplate from "../templates/emailTemplate.js";

dotenv.config();

// Configure your mail transporter
export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "yourgmail@gmail.com",
    pass: process.env.EMAIL_PASS || "your-app-password", // use app password
  },
});

// Helper function to send mail
export const sendMail = async (to, subject, html) => {
  const mailOptions = {
    from: process.env.EMAIL_USER || "yourgmail@gmail.com",
    to,
    subject,
    html,
  };

  await transporter.sendMail(mailOptions);
};

export const sendReportEmail = async (to, schedule) => {
  const {
    reportType,
    department,
    serviceType,
    patientType,
    status,
    scheduleDateTime,
  } = schedule;
  const dateStr = new Date(scheduleDateTime).toLocaleString();

  const htmlContent = emailTemplate(
    reportType,
    department,
    serviceType,
    patientType,
    status,
    dateStr
  );

  await transporter.sendMail({
    from: `"Hospital Report System" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Report Scheduled: ${reportType} Report`,
    html: htmlContent,
  });
};
