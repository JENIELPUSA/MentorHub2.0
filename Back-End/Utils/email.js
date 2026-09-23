const nodemailer = require('nodemailer');

const sendEmail = async (options, res) => {
    // CREATE A TRANSPORTER USING GMAIL SMTP SETTINGS
    const transporter = nodemailer.createTransport({
        service: 'gmail',  // Use Gmail's service
        pool:true,
        //para marami ang ma send na message
        maxMessages:Infinity,
        maxConnections:500,
        auth: {
            user: process.env.EMAIL_USER,  // Gmail address
            pass: process.env.EMAIL_PASSWORD  // Gmail app-specific password or regular password
        }
    });

    // DEFINE EMAIL OPTIONS
    const mailOptions = {
        from: `BiPSU MentorHub 2.0 <${process.env.EMAIL_USER}>`,  // Gamitin ang Gmail address
        to: options.email,
        subject: options.subject,
        text: options.text
    };

    try {
        // SEND EMAIL
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully');
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('There was an error sending the email');
    }
};

module.exports = sendEmail;
