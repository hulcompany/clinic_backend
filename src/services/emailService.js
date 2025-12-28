const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');

/**
 * Create email transporter
 * @returns {Object} Nodemailer transporter
 */
const createTransporter = () => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
  
  return transporter;
};

/**
 * Send a generic email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content of the email
 * @param {string} [options.text] - Plain text content (optional)
 * @param {string} [options.from] - Sender email address (optional)
 * @returns {Promise<boolean>} True if email was sent successfully
 */
const sendEmail = async ({ to, subject, html, text, from }) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: from || process.env.EMAIL_FROM,
      to,
      subject,
      html,
      text // Optional text version
    };
    
    // Verify transporter connection
    await transporter.verify();
    
    // Send email
    const result = await transporter.sendMail(mailOptions);
    
    console.log(`Email sent successfully to ${to}`);
    return true;
  } catch (error) {
    console.error('Failed to send email:', error.message);
    console.error('Error details:', error);
    throw new Error('Failed to send email. Please try again later.');
  }
};

/**
 * Send welcome email
 * @param {string} email - Recipient email address
 * @param {string} name - Recipient name
 * @returns {Promise<boolean>} True if email was sent successfully
 */
const sendWelcomeEmail = async (email, name) => {
  try {
    const templatePath = path.join(__dirname, '../templates/emails/welcome.html');
    let template = `<!DOCTYPE html>
<html>
<head>
    <title>Welcome</title>
</head>
<body>
    <h1>Welcome ${name}!</h1>
    <p>Thank you for joining our platform.</p>
</body>
</html>`;
    
    // Try to read custom template, fallback to default
    try {
      template = await fs.readFile(templatePath, 'utf8');
      template = template.replace('{name}', name);
    } catch (err) {
      console.warn('Welcome template not found, using default template');
    }
    
    await sendEmail({
      to: email,
      subject: 'Welcome to Our Platform',
      html: template
    });
    
    console.log(`Welcome email sent to ${email} for user ${name}`);
    return true;
  } catch (error) {
    console.error('Failed to send welcome email:', error.message);
    throw error;
  }
};

/**
 * Send password reset email
 * @param {string} email - Recipient email address
 * @param {string} resetToken - Password reset token
 * @returns {Promise<boolean>} True if email was sent successfully
 */
const sendPasswordResetEmail = async (email, resetToken) => {
  try {
    const templatePath = path.join(__dirname, '../templates/emails/password-reset.html');
    let template = `<!DOCTYPE html>
<html>
<head>
    <title>Password Reset</title>
</head>
<body>
    <h1>Password Reset</h1>
    <p>Your reset token is: ${resetToken}</p>
</body>
</html>`;
    
    // Try to read custom template, fallback to default
    try {
      template = await fs.readFile(templatePath, 'utf8');
      template = template.replace('{resetToken}', resetToken);
    } catch (err) {
      console.warn('Password reset template not found, using default template');
    }
    
    await sendEmail({
      to: email,
      subject: 'Password Reset Request',
      html: template
    });
    
    console.log(`Password reset email sent to ${email} with token ${resetToken}`);
    return true;
  } catch (error) {
    console.error('Failed to send password reset email:', error.message);
    throw error;
  }
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail
};