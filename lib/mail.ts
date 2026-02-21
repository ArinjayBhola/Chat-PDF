import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
});

export const sendVerificationEmail = async (email: string, otp: string) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || '"ChatPDF" <noreply@chatpdf.example.com>',
    to: email,
    subject: "Verify your email address - ChatPDF",
    html: `
      <h2>Welcome to ChatPDF!</h2>
      <p>Your one-time password (OTP) to verify your account is:</p>
      <h1 style="font-size: 32px; letter-spacing: 4px; color: #4f46e5;">${otp}</h1>
      <p>This code will expire in 10 minutes.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};

export const sendPasswordResetEmail = async (email: string, otp: string) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || '"ChatPDF" <noreply@chatpdf.example.com>',
    to: email,
    subject: "Reset your password - ChatPDF",
    html: `
      <h2>Ready to reset your password?</h2>
      <p>Your one-time password (OTP) to reset your password is:</p>
      <h1 style="font-size: 32px; letter-spacing: 4px; color: #4f46e5;">${otp}</h1>
      <p>This code will expire in 10 minutes. If you did not request a password reset, you can safely ignore this email.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};
