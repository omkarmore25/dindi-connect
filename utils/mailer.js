/**
 * Unified Mailer Utility using Brevo API (HTTP)
 * This allows sending to anyone without needing a custom domain.
 */

const sendVerificationEmail = async (to, verificationLink, name) => {
    try {
        console.log(`[MAIL] Attempting to send verification email via Brevo to: ${to}`);
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'api-key': process.env.EMAIL_PASS, // Your Brevo API Key
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sender: { name: "Dindi Connect", email: process.env.EMAIL_USER }, // Your verified Gmail
                to: [{ email: to, name: name }],
                subject: 'Verify your Dindi Connect Account ✅',
                htmlContent: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2>Welcome aboard, ${name}! 🎉</h2>
                        <p>Please verify your email address to get started:</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${verificationLink}" style="background-color: #f97316; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Verify Email Address</a>
                        </div>
                    </div>
                `
            })
        });

        const data = await response.json();
        if (response.ok) {
            console.log("[MAIL] Email sent successfully via Brevo:", data.messageId);
            return true;
        } else {
            console.error("[MAIL ERROR] Brevo API Error:", data);
            return false;
        }
    } catch (error) {
        console.error("[MAIL ERROR] Fatal Exception:", error.message);
        return false;
    }
};

const sendPasswordResetEmail = async (to, resetLink, name) => {
    try {
        console.log(`[MAIL] Attempting to send reset email via Brevo to: ${to}`);
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'api-key': process.env.EMAIL_PASS,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sender: { name: "Dindi Connect", email: process.env.EMAIL_USER },
                to: [{ email: to, name: name }],
                subject: 'Reset your Dindi Connect Password 🔐',
                htmlContent: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2>Password Reset Request</h2>
                        <p>Click the button below to reset your password:</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${resetLink}" style="background-color: #f97316; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Reset Password</a>
                        </div>
                    </div>
                `
            })
        });

        const data = await response.json();
        if (response.ok) {
            console.log("[MAIL] Reset email sent successfully via Brevo:", data.messageId);
            return true;
        } else {
            console.error("[MAIL ERROR] Brevo API Error:", data);
            return false;
        }
    } catch (error) {
        console.error("[MAIL ERROR] Fatal Exception:", error.message);
        return false;
    }
};

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
