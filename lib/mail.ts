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
    from: process.env.EMAIL_FROM || '"Doc PDF" <noreply@docpdf.example.com>',
    to: email,
    subject: "Verify your email address - Doc PDF",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; color: #1e293b;">
        <h2 style="color: #4f46e5; margin-bottom: 20px;">Welcome to Doc PDF!</h2>
        <p>Your one-time password (OTP) to verify your account is:</p>
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <h1 style="margin: 0; font-size: 32px; letter-spacing: 4px; color: #4f46e5;">${otp}</h1>
        </div>
        <p>This code will expire in 10 minutes.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 25px 0;" />
        <p style="font-size: 12px; color: #94a3b8; text-align: center;">Team Doc PDF</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

export const sendPasswordResetEmail = async (email: string, otp: string) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || '"Doc PDF" <noreply@docpdf.example.com>',
    to: email,
    subject: "Reset your password - Doc PDF",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; color: #1e293b;">
        <h2 style="color: #4f46e5; margin-bottom: 20px;">Reset Your Password</h2>
        <p>Your one-time password (OTP) to reset your password is:</p>
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <h1 style="margin: 0; font-size: 32px; letter-spacing: 4px; color: #4f46e5;">${otp}</h1>
        </div>
        <p>This code will expire in 10 minutes. If you did not request a password reset, you can safely ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 25px 0;" />
        <p style="font-size: 12px; color: #94a3b8; text-align: center;">Team Doc PDF</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

export const sendSubscriptionCancellationEmail = async (email: string, refundAmount: number) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || '"Doc PDF" <noreply@docpdf.example.com>',
    to: email,
    subject: "Your Subscription has been Cancelled - Doc PDF",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; color: #1e293b;">
        <h2 style="color: #4f46e5; margin-bottom: 20px;">Subscription Cancelled</h2>
        <p>Dear User,</p>
        <p>Your subscription for <b>Doc PDF Pro</b> has been successfully cancelled as per your request.</p>
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #64748b;">Refund Summary:</p>
          <p style="margin: 5px 0 0; font-size: 24px; font-weight: bold; color: #0f172a;">Rs. ${(refundAmount / 100).toFixed(2)}</p>
        </div>
        <p>A pro-rata refund has been initiated and the money will be reflected in your account within <b>5-6 business days</b>.</p>
        <p>We're sorry to see you go! If you have any feedback or if there's anything we can do better, please let us know.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 25px 0;" />
        <p style="font-size: 12px; color: #94a3b8; text-align: center;">Team Doc PDF</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};
