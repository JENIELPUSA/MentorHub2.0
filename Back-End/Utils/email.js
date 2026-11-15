const nodemailer = require('nodemailer');

// ============================================================
// 1. Validate required env vars at startup
// ============================================================
const REQUIRED_ENV = [
    'EMAIL_USER',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GOOGLE_REFRESH_TOKEN',
];

const missingEnv = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missingEnv.length > 0) {
    console.error('❌ [sendEmail] Missing environment variables:');
    missingEnv.forEach((k) => console.error(`   - ${k}`));
    console.error('   → I-set ito sa production server (.env o hosting dashboard).');
}

// ============================================================
// 2. Create Gmail OAuth2 transporter
// ============================================================
const transporter = nodemailer.createTransport({
    service: 'gmail',
    pool: true,
    maxMessages: 100,
    maxConnections: 5,
    auth: {
        type: 'OAuth2',
        user: process.env.EMAIL_USER,
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
    },
});

// ============================================================
// 3. Verify SMTP connection ONCE at startup (hindi bawat send)
// ============================================================
let verifyPromise = null;

const verifyTransporter = () => {
    if (verifyPromise) return verifyPromise;

    verifyPromise = new Promise((resolve) => {
        transporter.verify((err, ok) => {
            if (err) {
                console.error('❌ [sendEmail] Gmail SMTP verify FAILED:', err.message);

                if (/invalid_grant/i.test(err.message)) {
                    console.error('   → Expired o revoked na ang GOOGLE_REFRESH_TOKEN.');
                    console.error('   → Kung "Testing" pa ang OAuth consent screen, mag-expire ito after 7 days.');
                    console.error('   → I-publish ang app sa Google Cloud Console at gumawa ng bagong refresh token.');
                } else if (/timeout|ECONNREFUSED|ENOTFOUND/i.test(err.message)) {
                    console.error('   → Naka-block ang outbound port 587 sa server/firewall.');
                    console.error('   → Buksan ang smtp.gmail.com:587 sa security group.');
                } else if (/535|auth/i.test(err.message)) {
                    console.error('   → Mali ang credentials o na-revoke na ang token.');
                }
                resolve(false);
            } else {
                console.log('✅ [sendEmail] Gmail SMTP ready');
                resolve(true);
            }
        });
    });

    return verifyPromise;
};

// Fire-and-forget sa startup (hindi hinaharangan ang app boot)
verifyTransporter();

// ============================================================
// 4. Send email
// ============================================================
const sendEmail = async (options) => {
    try {
        // Basic input validation
        if (!options?.email) throw new Error('Missing recipient email (options.email)');
        if (!options?.subject) throw new Error('Missing subject (options.subject)');
        if (!options?.text && !options?.html) throw new Error('Missing body (options.text or options.html)');
        if (!process.env.EMAIL_USER) throw new Error('EMAIL_USER env var is not set');

        const mailOptions = {
            from: `BiPSU MentorHub 2.0 <${process.env.EMAIL_USER}>`,
            to: options.email,
            subject: options.subject,
            text: options.text,
            ...(options.html ? { html: options.html } : {}),
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ [sendEmail] Sent:', info.messageId);
        return info;

    } catch (error) {
        console.error('❌ [sendEmail] Error:', error.message);

        // Surface useful diagnostics sa logs
        if (error.response) {
            console.error('   SMTP response:', error.response);
        }
        if (/invalid_grant/i.test(error.message) || /invalid_grant/i.test(error.response || '')) {
            console.error('   → Kailangan ng BAGONG refresh token. I-publish ang OAuth app, tapos regenerate.');
        }

        throw new Error('There was an error sending the email');
    }
};

module.exports = sendEmail;