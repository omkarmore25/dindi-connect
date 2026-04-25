const nodemailer = require('nodemailer');

// Create the unified transport pipeline using Gmail
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

/**
 * Sends a stylized verification email to the target user.
 * @param {string} to - The recipient's email address
 * @param {string} verificationLink - The unique authorization link for the user
 * @param {string} name - The user's name
 */
const sendVerificationEmail = async (to, verificationLink, name) => {
    try {
        const mailOptions = {
            from: `"Dindi Connect" <${process.env.EMAIL_USER}>`,
            to: to,
            subject: 'Verify your Dindi Connect Account ✅',
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc; border-radius: 16px;">
                    <div style="text-align: center; padding: 20px 0;">
                        <span style="font-size: 28px; font-weight: bold; color: #f97316;">Dindi Connect</span>
                    </div>
                    <div style="background-color: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                        <h2 style="color: #1e293b; margin-top: 0;">Welcome aboard, ${name}! 🎉</h2>
                        <p style="color: #475569; font-size: 16px; line-height: 1.6;">
                            We are absolutely thrilled to have you join Dindi Connect. To get started managing your groups and events, we just need to quickly verify your email address.
                        </p>
                        <div style="text-align: center; margin: 35px 0;">
                            <a href="${verificationLink}" style="background-color: #f97316; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">Verify Email Address</a>
                        </div>
                        <p style="color: #64748b; font-size: 14px; margin-bottom: 0;">
                            If you didn't create an account with Dindi Connect, you can safely ignore this email.
                        </p>
                    </div>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent successfully: ", info.messageId);
        return true;
    } catch (error) {
        console.error("Email processing failed: ", error);
        return false;
    }
};

/**
 * Sends a password reset email to the target user.
 * @param {string} to - The recipient's email address
 * @param {string} resetLink - The unique password reset link
 * @param {string} name - The user's name
 */
const sendPasswordResetEmail = async (to, resetLink, name) => {
    try {
        const mailOptions = {
            from: `"Dindi Connect" <${process.env.EMAIL_USER}>`,
            to: to,
            subject: 'Reset your Dindi Connect Password 🔐',
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc; border-radius: 16px;">
                    <div style="text-align: center; padding: 20px 0;">
                        <span style="font-size: 28px; font-weight: bold; color: #f97316;">Dindi Connect</span>
                    </div>
                    <div style="background-color: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                        <h2 style="color: #1e293b; margin-top: 0;">Hello, ${name}</h2>
                        <p style="color: #475569; font-size: 16px; line-height: 1.6;">
                            We received a request to reset the password for your Dindi Connect account. You can reset your password by clicking the button below. This link is valid for 1 hour.
                        </p>
                        <div style="text-align: center; margin: 35px 0;">
                            <a href="${resetLink}" style="background-color: #ef4444; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">Reset Password</a>
                        </div>
                        <p style="color: #64748b; font-size: 14px; margin-bottom: 0;">
                            If you did not request a password reset, please ignore this email or contact support if you have questions.
                        </p>
                    </div>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("Password reset email sent successfully: ", info.messageId);
        return true;
    } catch (error) {
        console.error("Password reset email processing failed: ", error);
        return false;
    }
};

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
