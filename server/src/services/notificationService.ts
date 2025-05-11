// Service to handle sending notifications based on user preferences

// Import Supabase admin client
const { supabase } = require('../lib/supabase'); 

// Import the core Brevo email sending function
const { sendTransactionalEmail } = require('../lib/emailBrevoService');

interface UserProfile {
    email: string;
    // Include full_name or nickname if you want to personalize emails
    full_name?: string; 
    nickname?: string;
}

/**
 * Sends a notification email about new content to subscribed users.
 * @param subject - The subject line of the email.
 * @param htmlContent - The HTML body of the email.
 */
async function sendNewContentNotification(subject: string, htmlContent: string): Promise<void> {
    console.log(`Attempting to send new content notification: "${subject}"`);

    try {
        // Query users who have opted-in to content updates
        const { data: users, error } = await supabase
            .from('profiles')
            .select('email, full_name, nickname') // Select necessary fields
            .eq('email_preferences->>contentUpdates', 'true'); // Check the specific key in JSONB

        if (error) {
            console.error('Error fetching users for content notification:', error);
            // Decide if you want to throw or just log and stop
            return; 
        }

        if (!users || users.length === 0) {
            console.log('No users are subscribed to content notifications.');
            return;
        }

        console.log(`Found ${users.length} users subscribed to content notifications.`);

        // Format recipients for Brevo
        const recipients = users.map((user: UserProfile) => ({ 
            email: user.email, 
            // Use nickname or full_name if available for personalization
            name: user.nickname || user.full_name || undefined 
        }));

        // Send the email using the Brevo service
        const result = await sendTransactionalEmail({
            to: recipients,
            subject: subject,
            htmlContent: htmlContent,
            // Sender defaults are handled in emailBrevoService
        });

        if (result.success) {
            console.log(`Successfully sent content notification email to ${recipients.length} users via Brevo.`);
        } else {
            // Error is already logged within sendTransactionalEmail
            console.error(`Failed to send content notification email batch. Brevo service message: ${result.message}`);
        }

    } catch (err: any) {
        // Catch unexpected errors during the process
        console.error('Unexpected error in sendNewContentNotification:', err.message || err);
    }
}

// Export the function for use in other parts of the server
module.exports = {
    sendNewContentNotification,
    // Add other notification functions here later (e.g., sendMarketingAnnouncement)
};

export {}; // Treat this file as a module 