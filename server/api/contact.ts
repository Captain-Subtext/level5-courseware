import { Request, Response, NextFunction } from 'express';
const express = require('express');
const router = express.Router();

// Use require() with corrected relative paths
const { sendContactEmail, logContactFormData } = require('../src/lib/emailService');

export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

/**
 * Checks if OAuth credentials are configured (server-side)
 */
function hasOAuthConfig(): boolean {
  return !!(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_REFRESH_TOKEN &&
    process.env.ADMIN_SENDER_EMAIL &&   // Check for sender email
    process.env.ADMIN_RECIPIENT_EMAIL // Check for recipient email
  );
}

// POST /api/contact
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  const data: ContactFormData = req.body;

  try {
    // Basic validation
    if (!data.name || !data.email || !data.subject || !data.message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please fill out all required fields' 
      });
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please enter a valid email address' 
      });
    }
    
    // Check if OAuth credentials are present
    if (hasOAuthConfig()) {
      try {
        // Attempt to send email
        // Ensure sendContactEmail uses process.env.ADMIN_RECIPIENT_EMAIL
        const result = await sendContactEmail(data);
        return res.status(result.success ? 200 : 500).json(result);

      } catch (emailError: any) {
        console.error('Email service error (contact form):', emailError);
        // Fallback to logging if email sending fails
        logContactFormData(data);
        // Return success but indicate email issue to user
        return res.status(200).json({ 
          success: true, // Logged successfully
          message: 'Your message was received, but there may have been an issue sending the notification email. Our team has logged your submission.' 
        });
      }
    } else {
      // Log the data if OAuth is not configured
      const logResult = logContactFormData(data);
      console.warn('OAuth credentials missing. Contact form logged instead of emailed:', data);
      return res.status(200).json(logResult);
    }
  } catch (error) {
    console.error('Error processing contact form:', error);
    // Pass error to central handler
    next(error); 
  }
});

module.exports = router;