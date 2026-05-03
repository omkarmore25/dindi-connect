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
                sender: { name: "Vandan", email: process.env.EMAIL_USER }, // Your verified Gmail
                to: [{ email: to, name: name }],
                subject: 'Verify your Vandan Account ✅',
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
                sender: { name: "Vandan", email: process.env.EMAIL_USER },
                to: [{ email: to, name: name }],
                subject: 'Reset your Vandan Password 🔐',
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

const sendBookingEmail = async (to, groupName, bookingDetails) => {
    try {
        console.log(`[MAIL] Attempting to send booking email via Brevo to: ${to}`);
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'api-key': process.env.EMAIL_PASS,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sender: { name: "Vandan Bookings", email: process.env.EMAIL_USER },
                to: [{ email: to, name: groupName }],
                subject: `New Booking Request for ${groupName} 📅`,
                htmlContent: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                        <h2 style="color: #f97316;">New Booking Request</h2>
                        <p>You have a new booking request for your group <strong>${groupName}</strong>.</p>
                        <ul style="list-style: none; padding: 0;">
                            <li style="margin-bottom: 8px;"><strong>Name:</strong> ${bookingDetails.name}</li>
                            <li style="margin-bottom: 8px;"><strong>Phone:</strong> ${bookingDetails.phone}</li>
                            <li style="margin-bottom: 8px;"><strong>Date:</strong> ${bookingDetails.date}</li>
                            <li style="margin-bottom: 8px;"><strong>Purpose:</strong> ${bookingDetails.purpose}</li>
                            <li style="margin-bottom: 8px;"><strong>Message:</strong> ${bookingDetails.message}</li>
                        </ul>
                        <p style="color: #64748b; font-size: 14px; margin-top: 24px;">The requester will also try to reach you on WhatsApp.</p>
                    </div>
                `
            })
        });

        const data = await response.json();
        if (response.ok) {
            console.log("[MAIL] Booking email sent successfully via Brevo:", data.messageId);
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

module.exports = { sendVerificationEmail, sendPasswordResetEmail, sendBookingEmail };
