import apiClient from '@/lib/apiClient'; // Import the configured axios instance

// Define the expected data structure for the contact form
interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

/**
 * Submits the contact form data to the backend API.
 * 
 * @param data The contact form data.
 * @returns A promise resolving to an object indicating success and a message.
 */
export async function submitContactForm(
  data: ContactFormData
): Promise<{ success: boolean; message: string }> {
  try {
    // Make a POST request to the /api/contact endpoint on the server
    const response = await apiClient.post('/api/contact', data);

    // Check if the server responded successfully (e.g., 200 OK)
    if (response.status === 200 && response.data?.message) {
      return { success: true, message: response.data.message };
    } else {
      // Handle unexpected success responses
      console.warn('Contact form submission successful but response format was unexpected:', response);
      return { success: true, message: 'Your message has been sent!' }; // Default success message
    }
  } catch (error: any) {
    console.error('Error submitting contact form:', error);
    
    // Extract a user-friendly error message from the server response if available
    const serverMessage = error.response?.data?.message || 'An error occurred while sending your message.';
    
    return { 
      success: false, 
      message: `${serverMessage} Please try again later.` 
    };
  }
} 