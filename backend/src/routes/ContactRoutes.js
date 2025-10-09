import nodemailer from 'nodemailer';
import express from 'express';

const router = express.Router();

// Configure nodemailer transporter
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-app-email@gmail.com', // You'll need to set this
    pass: process.env.EMAIL_PASS || 'your-app-password' // You'll need an app password
  }
});

// Contact form endpoint
router.post('/', async (req, res) => {
  try {
    const { name, email, message } = req.body;

    // Validate required fields
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Email options
    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-app-email@gmail.com',
      to: 'salimuddinsaiyed5@gmail.com',
      subject: 'Bug Report / Feature Request from AIO Converter',
      html: `
        <h3>New Bug Report / Feature Request</h3>
        <p><strong>From:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
        <hr>
        <p><em>Sent from AIO Converter Contact Form</em></p>
      `,
      replyTo: email
    };

    // Send email
    await transporter.sendMail(mailOptions);

    res.json({ success: true, message: 'Email sent successfully' });

  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

export default router;