const { Resend } = require('resend');

// Initialize Resend client (lazy — created once, reused)
let resendClient = null;
const getResend = () => {
    if (!resendClient) {
        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey) {
            throw new Error('RESEND_API_KEY is not set in environment variables');
        }
        resendClient = new Resend(apiKey);
    }
    return resendClient;
};

/**
 * Send an email via Resend (HTTPS API — works on Render free tier).
 *
 * @param {Object} options
 * @param {string} options.email   - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.text    - Plain text body (optional if html provided)
 * @param {string} [options.html]  - HTML body (optional)
 * @param {Object} [res]           - Express response object (optional, unused)
 */
const sendEmail = async (options, res) => {
    if (!options || !options.email) {
        throw new Error('Recipient email is required');
    }
    if (!options.subject) {
        throw new Error('Email subject is required');
    }

    // Sender: must be a verified domain/email in Resend.
    // For testing, use "onboarding@resend.dev" (Resend's sandbox).
    // For production, verify your domain (e.g. no-reply@bipsu.edu.ph) in Resend dashboard.
    const fromAddress =
        process.env.EMAIL_FROM || 'BiPSU MentorHub 2.0 <onboarding@resend.dev>';

    const payload = {
        from: fromAddress,
        to: [options.email],
        subject: options.subject,
    };

    if (options.html) {
        payload.html = options.html;
    }
    if (options.text) {
        payload.text = options.text;
    }
    // If only text is provided, Resend requires at least one body field.
    if (!payload.html && !payload.text) {
        payload.text = ' ';
    }

    try {
        const resend = getResend();
        const { data, error } = await resend.emails.send(payload);

        if (error) {
            console.error('❌ Resend error:', error);
            throw new Error(error.message || 'Failed to send email via Resend');
        }

        console.log('✅ Email sent successfully via Resend:', data?.id);
        return { success: true, id: data?.id };
    } catch (error) {
        console.error('❌ Error sending email:', error.message);
        throw new Error('There was an error sending the email');
    }
};

module.exports = sendEmail;