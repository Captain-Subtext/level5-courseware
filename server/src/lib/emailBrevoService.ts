// Use require() for imports
const Brevo = require('@getbrevo/brevo');
const dotenv = require('dotenv');

dotenv.config(); // Ensure environment variables are loaded

// Brevo API Key from process.env
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const DEFAULT_SENDER_EMAIL = process.env.ADMIN_SENDER_EMAIL || 'admin@example.com';
const DEFAULT_SENDER_NAME = process.env.ADMIN_SENDER_NAME || 'Course Admin';
const RECIPIENT_EMAIL = process.env.ADMIN_RECIPIENT_EMAIL || 'admin@example.com';

// --- Brevo API Setup ---
let apiInstance: any; // Use 'any' or install Brevo types if available
let contactsApiInstance: any; // For managing contacts
let defaultClient: any; // Store the client reference for re-initialization if needed

// Enhanced initialization function that can be called when needed
function initializeBrevoClient() {
  if (!BREVO_API_KEY) {
    console.warn(
      'BREVO_API_KEY not found in server environment variables. Email sending will be logged instead.'
    );
    apiInstance = null;
    contactsApiInstance = null;
    return false;
  }

  try {
    // Configure the default API client
    defaultClient = Brevo.ApiClient.instance;
    
    // Log API key (only first/last few chars for security)
    const keyPreview = BREVO_API_KEY.length > 8 
      ? `${BREVO_API_KEY.substring(0, 4)}...${BREVO_API_KEY.substring(BREVO_API_KEY.length - 4)}`
      : '***masked***';
    console.log(`Initializing Brevo client with API key: ${keyPreview}`);
    
    // Configure API key authorization: api-key
    let apiKey = defaultClient.authentications['api-key'];
    apiKey.apiKey = BREVO_API_KEY;
    
    // Initialize email API with the configured client
    apiInstance = new Brevo.TransactionalEmailsApi(defaultClient);

    // Initialize contacts API with the configured client
    contactsApiInstance = new Brevo.ContactsApi(defaultClient);

    console.log('Brevo API client initialized successfully.');
    return true;
  } catch (error) {
    console.error("Failed to initialize Brevo API Client:", error);
    apiInstance = null;
    contactsApiInstance = null;
    return false;
  }
}

// Call initialization immediately
const initSuccess = initializeBrevoClient();
console.log(`Initial Brevo API client initialization ${initSuccess ? 'successful' : 'failed'}.`);

// --- Helper Interfaces (optional, for clarity) ---
interface EmailRecipient {
  email: string;
  name?: string;
}

interface SendEmailParams {
  to: EmailRecipient[];
  subject: string;
  htmlContent: string;
  sender?: EmailRecipient;
  replyTo?: EmailRecipient;
  // Add other parameters like bcc, cc as needed
}

interface UserPreferences {
  contentUpdates: boolean;
  accountChanges: boolean;
  marketing: boolean;
  [key: string]: boolean; // Allow additional preferences
}

interface ContactAttributes {
  FIRSTNAME?: string;
  LASTNAME?: string;
  NICKNAME?: string;
  [key: string]: string | number | boolean | undefined;
}

// --- Core Brevo Sending Function ---
async function sendTransactionalEmail(params: SendEmailParams): Promise<{ success: boolean; message: string; data?: any }> {
  if (!apiInstance) {
    console.error('Cannot send email: Brevo API key is missing or client not initialized.');
    // Fallback to logging might happen here or in the calling function
    return { success: false, message: 'Brevo client not initialized (missing API key)' };
  }

  const sendSmtpEmail = new Brevo.SendSmtpEmail();

  sendSmtpEmail.subject = params.subject;
  sendSmtpEmail.htmlContent = params.htmlContent;
  sendSmtpEmail.sender = params.sender ?? { email: DEFAULT_SENDER_EMAIL, name: DEFAULT_SENDER_NAME };
  sendSmtpEmail.to = params.to;
  if (params.replyTo) {
    sendSmtpEmail.replyTo = params.replyTo;
  }
  // Add .cc, .bcc etc. if needed from params

  try {
    // Use the correct method name based on the SDK version, e.g., sendTransacEmail
    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('Brevo API called successfully.'); // Reduced logging verbosity
    return { success: true, message: 'Email sent successfully via Brevo', data: data };
  } catch (error: any) {
    // Log more detailed error info if available
    const errorDetails = error.body || error.response?.data || error.message || error; // Brevo errors might be in error.body
    console.error('Error sending email via Brevo:', JSON.stringify(errorDetails, null, 2));
    return {
        success: false,
        message: `Failed to send email via Brevo. Error: ${error.message || 'Unknown error'}`,
        data: errorDetails
    };
  }
}

/**
 * Sync user notification preferences with Brevo
 * This creates or updates a contact in Brevo and sets custom attributes
 * for notification preferences
 */
async function syncContactPreferences(
  email: string, 
  preferences: UserPreferences,
  attributes: ContactAttributes = {}
): Promise<{ success: boolean; message: string; data?: any }> {
  // If instance is null, try to re-initialize once
  if (!contactsApiInstance && BREVO_API_KEY) {
    console.log('Attempting to re-initialize Brevo client before contact sync...');
    initializeBrevoClient();
  }
  
  if (!contactsApiInstance) {
    console.error('Cannot sync contact: Brevo API client not initialized.');
    return { success: false, message: 'Brevo client not initialized (missing API key)' };
  }

  try {
    let contactExists = false;
    try {
      // Check if contact exists using getContactInfo
      await contactsApiInstance.getContactInfo(email);
      contactExists = true;
      console.log(`Contact ${email} found.`);
    } catch (error: any) {
      // Handle unauthorized error differently - this indicates an API key issue
      if (error.status === 401 || error.response?.status === 401 || 
          (typeof error === 'string' && error.includes('Unauthorized'))) {
        console.error(`Error checking contact ${email} existence: Unauthorized - API key issue`);
        console.log('Attempting to re-initialize Brevo client...');
        
        // Try to re-initialize with fresh client
        if (initializeBrevoClient()) {
          console.log('Re-initialization successful, retrying operation...');
          try {
            await contactsApiInstance.getContactInfo(email);
            contactExists = true;
            console.log(`Contact ${email} found after re-initialization.`);
          } catch (retryError: any) {
            if (retryError.status === 404 || retryError.response?.status === 404) {
              contactExists = false;
              console.log(`Contact ${email} not found after re-initialization, will create.`);
            } else {
              throw retryError; // Re-throw if not a 404
            }
          }
        } else {
          throw new Error('Failed to re-initialize Brevo API client with valid credentials');
        }
      } 
      // Handle 404 normally - contact doesn't exist
      else if (error.status === 404 || error.response?.status === 404) { 
        console.log(`Contact ${email} not found, will create.`);
        contactExists = false;
      } else {
        // For other errors during getContactInfo, re-throw them
        console.error(`Error checking contact ${email} existence:`, error.response?.data || error.message || error);
        throw error; // Re-throw unexpected errors
      }
    }

    // Prepare the attributes and list IDs
    const contactAttributes = {
      ...attributes,
      // Convert booleans to strings for Brevo Text attributes
      PREF_CONTENT_UPDATES: String(preferences.contentUpdates),
      PREF_ACCOUNT_CHANGES: String(preferences.accountChanges),
      PREF_MARKETING: String(preferences.marketing)
    };
    
    const listIdsToAdd: number[] = [];
    const listIdsToRemove: number[] = []; // Keep track of lists to remove from
    
    // Define your List IDs (replace with actual IDs from Brevo)
    const CONTENT_UPDATES_LIST_ID = 5;
    const MARKETING_LIST_ID = 2;
    const ACCOUNT_CHANGES_LIST_ID = 6;
    
    // Determine lists to add/remove based on preferences
    if (preferences.contentUpdates) listIdsToAdd.push(CONTENT_UPDATES_LIST_ID); else listIdsToRemove.push(CONTENT_UPDATES_LIST_ID);
    if (preferences.marketing) listIdsToAdd.push(MARKETING_LIST_ID); else listIdsToRemove.push(MARKETING_LIST_ID);
    if (preferences.accountChanges) listIdsToAdd.push(ACCOUNT_CHANGES_LIST_ID); else listIdsToRemove.push(ACCOUNT_CHANGES_LIST_ID);
    
    let result: any;
    try {
      if (contactExists) {
        // --- Update Existing Contact ---
        const updateContactPayload = new Brevo.UpdateContact();
        updateContactPayload.attributes = contactAttributes;
        if (listIdsToAdd.length > 0) {
          updateContactPayload.listIds = listIdsToAdd;
        }
        if (listIdsToRemove.length > 0) {
          updateContactPayload.unlinkListIds = listIdsToRemove;
        }

        console.log(`Updating contact ${email} with attributes and ${listIdsToAdd.length} lists`);
        await contactsApiInstance.updateContact(email, updateContactPayload);
        result = { success: true, message: `Contact ${email} updated successfully in Brevo` };

      } else {
        // --- Create New Contact ---
        const createContactPayload = new Brevo.CreateContact();
        createContactPayload.email = email;
        createContactPayload.attributes = contactAttributes;
        if (listIdsToAdd.length > 0) {
          createContactPayload.listIds = listIdsToAdd;
        }
        createContactPayload.updateEnabled = false; // Set to false for initial creation
        
        console.log(`Creating contact ${email} with attributes and ${listIdsToAdd.length} lists`);
        result = await contactsApiInstance.createContact(createContactPayload);
        result = { success: true, message: `Contact ${email} created successfully in Brevo`, data: result };
      }
    } catch (actionError: any) {
      // Handle unauthorized errors during create/update
      if (actionError.status === 401 || actionError.response?.status === 401 || 
          (typeof actionError === 'string' && actionError.includes('Unauthorized'))) {
        console.error(`Authorization error during contact ${contactExists ? 'update' : 'creation'}: ${email}`);
        
        // Try one more re-initialization
        if (initializeBrevoClient()) {
          console.log('Re-initialized Brevo client after action error, retrying...');
          try {
            if (contactExists) {
              const updateContactPayload = new Brevo.UpdateContact();
              updateContactPayload.attributes = contactAttributes;
              if (listIdsToAdd.length > 0) {
                updateContactPayload.listIds = listIdsToAdd;
              }
              if (listIdsToRemove.length > 0) {
                updateContactPayload.unlinkListIds = listIdsToRemove;
              }
              await contactsApiInstance.updateContact(email, updateContactPayload);
              result = { success: true, message: `Contact ${email} updated successfully in Brevo after retry` };
            } else {
              const createContactPayload = new Brevo.CreateContact();
              createContactPayload.email = email;
              createContactPayload.attributes = contactAttributes;
              if (listIdsToAdd.length > 0) {
                createContactPayload.listIds = listIdsToAdd;
              }
              createContactPayload.updateEnabled = false;
              result = await contactsApiInstance.createContact(createContactPayload);
              result = { success: true, message: `Contact ${email} created successfully in Brevo after retry`, data: result };
            }
          } catch (retryActionError: any) {
            throw retryActionError; // If retry still fails, throw the error
          }
        } else {
          throw new Error('Failed to re-initialize Brevo API client after action error');
        }
      } else {
        throw actionError; // Re-throw non-auth errors
      }
    }
    
    return result;

  } catch (error: any) {
    const errorDetails = error.response?.data || error.body || error.message || error;
    console.error(`Error syncing contact preferences for ${email} with Brevo:`, JSON.stringify(errorDetails, null, 2));
    return {
      success: false,
      message: `Failed to sync contact preferences with Brevo. Error: ${error.message || 'Unknown error'}`,
      data: errorDetails
    };
  }
}


// --- Existing Contact Form Logic (Adapted for Brevo) ---

interface ContactEmailPayload {
  name: string;
  email: string;
  subject: string;
  message: string;
  recipientEmail?: string; // Allow overriding recipient
}

// Send email using Brevo API
async function sendContactEmail(data: ContactEmailPayload): Promise<{ success: boolean; message: string }> {
  if (!data.name || !data.email || !data.subject || !data.message) {
    return { success: false, message: 'All fields are required for email' };
  }

  // Use Brevo if configured, otherwise log
  if (!apiInstance) {
    console.warn('Brevo not configured, falling back to logging contact form data.');
    return logContactFormData(data);
  }

  const recipient = data.recipientEmail || RECIPIENT_EMAIL; // Use override or default

  const emailHtmlContent = `
    <div>
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${data.name}</p>
      <p><strong>Email:</strong> ${data.email}</p>
      <p><strong>Subject:</strong> ${data.subject}</p>
      <p><strong>Message:</strong></p>
      <p>${data.message.replace(/\n/g, '<br>')}</p>
    </div>`;

  const result = await sendTransactionalEmail({
      to: [{ email: recipient }],
      replyTo: { email: data.email, name: data.name },
      subject: `${data.subject} - Contact Form Submission`,
      htmlContent: emailHtmlContent,
      // Sender is determined by sendTransactionalEmail defaults or Brevo account settings
  });

  // Return the success status and message from the core sender
  return { success: result.success, message: result.message };
}

// Fallback logging function (remains the same)
function logContactFormData(data: ContactEmailPayload): { success: boolean; message: string } {
  console.log('Contact Form Submission (Logged):');
  console.log('------------------------');
  console.log(`Name: ${data.name}`);
  console.log(`Email: ${data.email}`);
  console.log(`Subject: ${data.subject}`);
  console.log(`Message: ${data.message}`);
  console.log('------------------------');
  return { success: true, message: 'Form data logged successfully (Brevo API Key Missing)' };
}

// Export the functions that should be public
module.exports = {
  sendTransactionalEmail,
  syncContactPreferences,
  // if sendContactEmail from this file is also meant to be used elsewhere via this service:
  // sendContactEmail // uncomment if needed, it's also defined in this file
};

export {}; // Treat this file as a module