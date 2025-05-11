// Use require() for imports
const axios = require('axios');

// Google OAuth credentials from process.env
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;
const RECIPIENT_EMAIL = process.env.ADMIN_RECIPIENT_EMAIL || 'admin@example.com'; 

interface EmailPayload {
  name: string;
  email: string;
  subject: string;
  message: string;
  recipientEmail?: string; // Allow overriding recipient
}

// Get a new access token (keep async)
async function getAccessToken(): Promise<string> {
  try {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
      throw new Error('Missing Google OAuth credentials in server environment variables.');
    }
    const response = await axios.post(
      'https://oauth2.googleapis.com/token',
      {
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: GOOGLE_REFRESH_TOKEN,
        grant_type: 'refresh_token',
      }
    );
    if (!response.data || !response.data.access_token) {
        throw new Error('Invalid response when fetching access token.');
    }
    return response.data.access_token;
  } catch (error: any) {
    console.error('Error getting Google access token:', error.response?.data || error.message);
    throw new Error('Failed to get Google access token');
  }
}

// Send email using Gmail API (keep async)
async function sendContactEmail(data: EmailPayload): Promise<{ success: boolean; message: string }> {
  try {
    if (!data.name || !data.email || !data.subject || !data.message) {
      return { success: false, message: 'All fields are required for email' };
    }
    
    const accessToken = await getAccessToken();
    const recipient = data.recipientEmail || RECIPIENT_EMAIL; // Use override or default
    
    const emailContent = [
      `From: "${data.name} (via Contact Form)" <${process.env.ADMIN_SENDER_EMAIL || 'noreply@example.com'}>`,
      `To: ${recipient}`,
      `Reply-To: ${data.email}`, // Add Reply-To header
      'Content-Type: text/html; charset=utf-8',
      `Subject: ${data.subject} - C4NC - Contact Form Submission`,
      '',
      `<div>
        <h2>New Contact Form Submission from Cursor for Non-Coders</h2>
        <p><strong>Name:</strong> ${data.name}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        <p><strong>Subject:</strong> ${data.subject}</p>
        <p><strong>Message:</strong></p>
        <p>${data.message.replace(/\n/g, '<br>')}</p>
      </div>`
    ].join('\r\n');

    // Use Node.js Buffer for Base64 URL encoding
    const encodedEmail = Buffer.from(emailContent).toString('base64url');
    
    await axios.post(
      'https://www.googleapis.com/gmail/v1/users/me/messages/send',
      { raw: encodedEmail },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log(`Email successfully sent to ${recipient}`);
    return { success: true, message: 'Email sent successfully' };

  } catch (error: any) {
    console.error('Error sending contact email:', error.response?.data || error.message);
    return { 
      success: false, 
      message: 'Failed to send email. Please check server logs.'
    };
  }
}

// Fallback logging function (unchanged, but export later)
function logContactFormData(data: EmailPayload): { success: boolean; message: string } {
  console.log('Contact Form Submission (Logged):');
  console.log('------------------------');
  console.log(`Name: ${data.name}`);
  console.log(`Email: ${data.email}`);
  console.log(`Subject: ${data.subject}`);
  console.log(`Message: ${data.message}`);
  console.log('------------------------');
  return { success: true, message: 'Form data logged successfully (Development Mode / Email Disabled)' };
}

// Export functions
module.exports = {
  sendContactEmail,
  logContactFormData,
}; 