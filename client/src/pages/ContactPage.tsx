import { useState, useRef, useEffect } from 'react';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { submitContactForm } from "@/api/contact";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import apiClient from "@/lib/apiClient";

export default function ContactPage() {
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  
  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formStatus, setFormStatus] = useState<{
    success?: boolean;
    message?: string;
  }>({});
  
  // Refs for form elements
  const formRef = useRef<HTMLFormElement>(null);
  
  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      setFormStatus({});
      
      // Safety check to prevent unexpected errors
      if (!submitContactForm) {
        throw new Error("Contact form submission function not available");
      }
      
      const result = await submitContactForm(formData);
      
      setFormStatus(result);
      
      if (result.success) {
        // Reset form on successful submission
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: ''
        });
        
        // Scroll to top of form to show success message
        formRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setFormStatus({
        success: false,
        message: 'An unexpected error occurred. Please try again later.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Set document title on mount
  useEffect(() => {
    document.title = 'Contact Us | Courseware Platform';
  }, []);

  useEffect(() => {
    // Update document title
    document.title = "Contact - Courseware Platform";
    
    // Add meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Contact us about Courseware Platform. Get in touch.');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = 'Contact us about Courseware Platform. Get in touch.';
      document.head.appendChild(meta);
    }
  }, []);

  // Fetch initial config/CSRF token on mount
  useEffect(() => {
    const primeCsrfToken = async () => {
      try {
        // console.log('[ContactPage] Priming CSRF token...');
        await apiClient.get('/api/config/public');
        // console.log('[ContactPage] CSRF token should now be primed.');
      } catch (error) {
        // Log error but don't block UI. The submit will likely fail if this errors.
        console.error('[ContactPage] Error fetching initial config/CSRF token:', error);
      }
    };
    primeCsrfToken();
  }, []); // Empty dependency array ensures it runs only once on mount

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <Navbar />

      {/* Contact Content */}
      <div className="max-w-3xl mx-auto px-4 py-12 md:py-20">
        <h1 className="text-3xl font-bold text-center mb-8">Contact Us</h1>
        
        <div className="bg-gray-900 rounded-lg p-6 md:p-8 shadow-lg">
          <p className="text-gray-300 mb-6 text-center">
            Have questions about Courseware Platform? Fill out the form below and we'll get back to you soon.
          </p>
          
          {/* Status messages */}
          {formStatus.message && (
            <Alert 
              className={`mb-6 ${formStatus.success ? 'bg-green-900/20 text-green-400 border-green-800' : 'bg-red-900/20 text-red-400 border-red-800'}`}
            >
              <AlertDescription>{formStatus.message}</AlertDescription>
            </Alert>
          )}
          
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input 
                id="name" 
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Your name" 
                disabled={isSubmitting}
                required 
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                value={formData.email}
                onChange={handleInputChange}
                placeholder="your.email@example.com" 
                disabled={isSubmitting}
                required 
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input 
                id="subject" 
                value={formData.subject}
                onChange={handleInputChange}
                placeholder="What's this about?" 
                disabled={isSubmitting}
                required 
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea 
                id="message" 
                value={formData.message}
                onChange={handleInputChange}
                placeholder="Your message..." 
                rows={5} 
                disabled={isSubmitting}
                required 
                className="bg-gray-800 border-gray-700 text-white resize-none"
              />
            </div>
            
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : 'Send Message'}
            </Button>
          </form>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
} 