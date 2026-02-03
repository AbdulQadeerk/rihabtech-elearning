const express = require('express');
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

// Get Razorpay configuration
router.get('/razorpay', async (req, res) => {
  try {
    const configQuery = db.collection('razorpayConfig')
      .orderBy('updatedAt', 'desc')
      .limit(1);
    
    const configSnapshot = await configQuery.get();
    
    if (configSnapshot.empty) {
      return res.status(404).json({
        success: false,
        message: 'No Razorpay configuration found'
      });
    }

    const configDoc = configSnapshot.docs[0];
    const configData = configDoc.data();
    
    // Remove sensitive data for public endpoint
    const publicConfig = {
      keyId: configData.keyId,
      currency: configData.currency || 'INR',
      theme: configData.theme || { color: '#6A5ACD' },
      description: configData.description || 'Subscription Payment',
      prefill: configData.prefill,
      notes: configData.notes || {
        platform: 'Rihab Technologies',
        source: 'admin_panel'
      }
    };

    res.json({
      success: true,
      data: publicConfig
    });

  } catch (error) {
    console.error('Error getting Razorpay config:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to get Razorpay configuration',
      error: error.message
    });
  }
});

// Get email settings
router.get('/email', async (req, res) => {
  try {
    const settingsQuery = db.collection('emailSettings')
      .orderBy('updatedAt', 'desc')
      .limit(1);
    
    const settingsSnapshot = await settingsQuery.get();
    
    if (settingsSnapshot.empty) {
      return res.status(404).json({
        success: false,
        message: 'No email settings found'
      });
    }

    const settingsDoc = settingsSnapshot.docs[0];
    const settingsData = settingsDoc.data();
    
    // Remove sensitive data for public endpoint
    const publicSettings = {
      provider: settingsData.provider || 'smtp',
      from: settingsData.from || {
        name: 'Rihab Technologies',
        email: 'noreply@rihabtech.com'
      },
      replyTo: settingsData.replyTo,
      smtp: settingsData.smtp ? {
        host: settingsData.smtp.host,
        port: settingsData.smtp.port,
        secure: settingsData.smtp.secure
      } : undefined
    };

    res.json({
      success: true,
      data: publicSettings
    });

  } catch (error) {
    console.error('Error getting email settings:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to get email settings',
      error: error.message
    });
  }
});

// Get email templates
router.get('/email-templates', async (req, res) => {
  try {
    const templatesQuery = db.collection('emailTemplates')
      .where('isActive', '==', true)
      .orderBy('updatedAt', 'desc');
    
    const templatesSnapshot = await templatesQuery.get();
    
    const templates = templatesSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        subject: data.subject,
        htmlContent: data.htmlContent,
        textContent: data.textContent,
        variables: data.variables || [],
        type: data.type,
        isActive: data.isActive,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      };
    });

    res.json({
      success: true,
      data: templates
    });

  } catch (error) {
    console.error('Error getting email templates:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to get email templates',
      error: error.message
    });
  }
});

// Get specific email template by type
router.get('/email-templates/:type', async (req, res) => {
  try {
    const { type } = req.params;
    
    const templateQuery = db.collection('emailTemplates')
      .where('type', '==', type)
      .where('isActive', '==', true)
      .limit(1);
    
    const templateSnapshot = await templateQuery.get();
    
    if (templateSnapshot.empty) {
      return res.status(404).json({
        success: false,
        message: `No active email template found for type: ${type}`
      });
    }

    const templateDoc = templateSnapshot.docs[0];
    const templateData = templateDoc.data();
    
    const template = {
      id: templateDoc.id,
      name: templateData.name,
      subject: templateData.subject,
      htmlContent: templateData.htmlContent,
      textContent: templateData.textContent,
      variables: templateData.variables || [],
      type: templateData.type,
      isActive: templateData.isActive,
      createdAt: templateData.createdAt?.toDate() || new Date(),
      updatedAt: templateData.updatedAt?.toDate() || new Date()
    };

    res.json({
      success: true,
      data: template
    });

  } catch (error) {
    console.error('Error getting email template:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to get email template',
      error: error.message
    });
  }
});

module.exports = router;
