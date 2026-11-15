
const nodemailer = require('nodemailer');

// Create Gmail OAuth2 transporter
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
        refreshToken: process.env.GOOGLE_REFRESH_TOKEN
    }
});

const sendEmail = async (options) => {
    try {
        const mailOptions = {
            from: `BiPSU MentorHub 2.0 <${process.env.EMAIL_USER}>`,
            to: options.email,
            subject: options.subject,
            text: options.text
        };

        const info = await transporter.sendMail(mailOptions);

        console.log('Email sent successfully:', info.messageId);

        return info;

    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('There was an error sending the email');
    }
};

module.exports = sendEmail;
