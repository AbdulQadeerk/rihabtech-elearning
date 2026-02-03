const express = require('express');
const Joi = require('joi');
const nodemailer = require('nodemailer');
const admin = require('firebase-admin');

const router = express.Router();

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    })
  });
}

const db = admin.firestore();

// Email validation schema
const emailSchema = Joi.object({
  to: Joi.string().email().required(),
  subject: Joi.string().required(),
  html: Joi.string().required(),
  text: Joi.string().required(),
  from: Joi.object({
    name: Joi.string().required(),
    address: Joi.string().email().required()
  }).required(),
  replyTo: Joi.string().email().optional(),
  settings: Joi.object({
    provider: Joi.string().valid('smtp', 'gmail', 'outlook', 'sendgrid', 'mailgun').required(),
    smtp: Joi.object({
      host: Joi.string().required(),
      port: Joi.number().port().required(),
      secure: Joi.boolean().required(),
      auth: Joi.object({
        user: Joi.string().email().required(),
        pass: Joi.string().required()
      }).required()
    }).when('provider', { is: 'smtp', then: Joi.required() }),
    gmail: Joi.object({
      user: Joi.string().email().required(),
      pass: Joi.string().required()
    }).when('provider', { is: 'gmail', then: Joi.required() }),
    outlook: Joi.object({
      user: Joi.string().email().required(),
      pass: Joi.string().required()
    }).when('provider', { is: 'outlook', then: Joi.required() }),
    sendgrid: Joi.object({
      apiKey: Joi.string().required()
    }).when('provider', { is: 'sendgrid', then: Joi.required() }),
    mailgun: Joi.object({
      apiKey: Joi.string().required(),
      domain: Joi.string().required()
    }).when('provider', { is: 'mailgun', then: Joi.required() })
  }).required()
});

// Create Nodemailer transporter based on settings
function createTransporter(settings) {
  const { provider } = settings;
  
  switch (provider) {
    case 'smtp':
      return nodemailer.createTransporter({
        host: settings.smtp.host,
        port: settings.smtp.port,
        secure: settings.smtp.secure,
        auth: settings.smtp.auth
      });
      
    case 'gmail':
      return nodemailer.createTransporter({
        service: 'gmail',
        auth: settings.gmail
      });
      
    case 'outlook':
      return nodemailer.createTransporter({
        service: 'hotmail',
        auth: settings.outlook
      });
      
    case 'sendgrid':
      return nodemailer.createTransporter({
        host: 'smtp.sendgrid.net',
        port: 587,
        secure: false,
        auth: {
          user: 'apikey',
          pass: settings.sendgrid.apiKey
        }
      });
      
    case 'mailgun':
      return nodemailer.createTransporter({
        host: 'smtp.mailgun.org',
        port: 587,
        secure: false,
        auth: {
          user: `postmaster@${settings.mailgun.domain}`,
          pass: settings.mailgun.apiKey
        }
      });
      
    default:
      throw new Error(`Unsupported email provider: ${provider}`);
  }
}

// Send email endpoint
router.post('/send', async (req, res) => {
  try {
    // Validate request body
    const { error, value } = emailSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => detail.message)
      });
    }

    const { to, subject, html, text, from, replyTo, settings } = value;

    // Create transporter
    const transporter = createTransporter(settings);

    // Verify transporter configuration
    await transporter.verify();

    // Email options
    const mailOptions = {
      from: `"${from.name}" <${from.address}>`,
      to: to,
      subject: subject,
      html: html,
      text: text,
      replyTo: replyTo || from.address
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);

    // Log email sending
    console.log('Email sent successfully:', {
      messageId: info.messageId,
      to: to,
      subject: subject,
      provider: settings.provider
    });

    res.json({
      success: true,
      message: 'Email sent successfully',
      messageId: info.messageId
    });

  } catch (error) {
    console.error('Error sending email:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to send email',
      error: error.message
    });
  }
});

// Test email connection endpoint
router.post('/test-connection', async (req, res) => {
  try {
    const { settings } = req.body;
    
    if (!settings || !settings.provider) {
      return res.status(400).json({
        success: false,
        message: 'Email settings are required'
      });
    }

    // Create transporter
    const transporter = createTransporter(settings);

    // Test connection
    await transporter.verify();

    res.json({
      success: true,
      message: 'Email connection test successful'
    });

  } catch (error) {
    console.error('Error testing email connection:', error);
    
    res.status(500).json({
      success: false,
      message: 'Email connection test failed',
      error: error.message
    });
  }
});

// Send test email endpoint
router.post('/send-test', async (req, res) => {
  try {
    const { settings, testEmail } = req.body;
    
    if (!settings || !settings.provider || !testEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email settings and test email are required'
      });
    }

    // Create transporter
    const transporter = createTransporter(settings);

    // Verify transporter configuration
    await transporter.verify();

    // Test email options
    const mailOptions = {
      from: `"${settings.from?.name || 'Test'}" <${settings.from?.email || 'test@example.com'}>`,
      to: testEmail,
      subject: 'Test Email from Rihab Technologies',
      html: `
        <h2>Test Email</h2>
        <p>This is a test email to verify your email configuration.</p>
        <p><strong>Provider:</strong> ${settings.provider}</p>
        <p><strong>Sent at:</strong> ${new Date().toISOString()}</p>
        <hr>
        <p><em>If you received this email, your email configuration is working correctly!</em></p>
      `,
      text: `
        Test Email
        
        This is a test email to verify your email configuration.
        
        Provider: ${settings.provider}
        Sent at: ${new Date().toISOString()}
        
        If you received this email, your email configuration is working correctly!
      `
    };

    // Send test email
    const info = await transporter.sendMail(mailOptions);

    res.json({
      success: true,
      message: `Test email sent successfully to ${testEmail}`,
      messageId: info.messageId
    });

  } catch (error) {
    console.error('Error sending test email:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: error.message
    });
  }
});

module.exports = router;
