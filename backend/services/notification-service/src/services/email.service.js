// src/services/email.service.js
import nodemailer from 'nodemailer';

// Configure Nodemailer with Gmail SMTP
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export const sendEmailReceipt = async (rideData) => {
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.warn('⚠️ Gmail credentials missing in .env! Skipping email delivery.');
            return;
        }

        const recipientEmail = rideData.riderEmail || process.env.EMAIL_USER; // Fallback to test address

        const mailOptions = {
            from: `"Uber Clone" <${process.env.EMAIL_USER}>`,
            to: recipientEmail,
            subject: `Your Receipt for Ride #${rideData.rideId}`,
            html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; max-width: 500px;">
          <h2 style="color: #000;">Trip Receipt</h2>
          <p>Thank you for riding with us!</p>
          <hr />
          <p><strong>Ride ID:</strong> ${rideData.rideId}</p>
          <p><strong>Total Fare:</strong> PKR ${rideData.fare}</p>
          <p><strong>Status:</strong> COMPLETED</p>
          <hr />
          <p style="font-size: 12px; color: #777;">If you have questions about this charge, please contact support.</p>
        </div>
      `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`📧 Gmail Receipt sent successfully to ${recipientEmail}! Message ID: ${info.messageId}`);
    } catch (error) {
        console.error('❌ Failed to send Gmail receipt:', error.message);
    }
};