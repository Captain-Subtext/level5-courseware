import { supabase } from './supabase';
import { User } from './supabase';

/**
 * Email notification types
 */
export enum NotificationType {
  CONTENT_UPDATE = 'contentUpdates',
  ACCOUNT_CHANGE = 'accountChanges',
  MARKETING = 'marketing'
}

/**
 * Check if a user has opted in to a particular notification type
 */
export async function isUserSubscribedToNotification(
  userId: string,
  notificationType: NotificationType
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('email_preferences')
      .eq('id', userId)
      .single();
    
    if (error || !data || !data.email_preferences) {
      return false;
    }
    
    // For backward compatibility
    if (notificationType === NotificationType.CONTENT_UPDATE) {
      return data.email_preferences.contentUpdates || 
             data.email_preferences.courseUpdates || 
             data.email_preferences.newContent || 
             false;
    }
    
    return data.email_preferences[notificationType] || false;
  } catch (error) {
    console.error('Error checking notification preferences:', error);
    return false;
  }
}

/**
 * Get all users who have opted in to a particular notification type
 */
export async function getUsersSubscribedToNotification(
  notificationType: NotificationType
): Promise<User[]> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .not('email_preferences', 'is', null);
    
    if (error || !data) {
      return [];
    }
    
    // Filter users based on notification type
    return data.filter(user => {
      if (!user.email_preferences) return false;
      
      // For backward compatibility
      if (notificationType === NotificationType.CONTENT_UPDATE) {
        return user.email_preferences.contentUpdates || 
               user.email_preferences.courseUpdates || 
               user.email_preferences.newContent || 
               false;
      }
      
      return user.email_preferences[notificationType] || false;
    });
  } catch (error) {
    console.error('Error getting subscribed users:', error);
    return [];
  }
}

/**
 * Send a notification email to a user
 * This uses the email service we created for the contact form
 */
export async function sendNotificationEmail(
  userId: string,
  notificationType: NotificationType,
  subject: string,
  message: string,
  userEmail?: string // Allow passing the email directly
): Promise<boolean> {
  try {
    // Check if user has opted in to this notification type
    const isSubscribed = await isUserSubscribedToNotification(userId, notificationType);
    if (!isSubscribed) {
      return false;
    }
    
    let email = userEmail;
    
    // If email not provided, get user profile
    if (!email) {
      // Get user profile
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', userId)
        .single();
      
      if (userError || !userData || !userData.email) {
        console.error('Error getting user email:', userError);
        return false;
      }
      
      email = userData.email;
    }
    
    // Send email using API endpoint (for future implementation)
    // For now, we'll just log the attempt
    console.log(`Would send email to ${email}:`, {
      subject,
      message,
      notificationType
    });
    
    return true;
  } catch (error) {
    console.error('Error sending notification email:', error);
    return false;
  }
}

/**
 * Send a notification to all users who have opted in to a particular notification type
 */
export async function sendBulkNotification(
  notificationType: NotificationType,
  subject: string,
  message: string
): Promise<{ total: number; sent: number }> {
  try {
    const users = await getUsersSubscribedToNotification(notificationType);
    let sent = 0;
    
    for (const user of users) {
      // Get user email - may need to be retrieved separately in a real implementation
      const { data: authData } = await supabase.auth.getUser(user.id);
      const email = authData?.user?.email;
      
      const success = await sendNotificationEmail(
        user.id, 
        notificationType, 
        subject, 
        message,
        email
      );
      if (success) sent++;
    }
    
    return { total: users.length, sent };
  } catch (error) {
    console.error('Error sending bulk notification:', error);
    return { total: 0, sent: 0 };
  }
} 