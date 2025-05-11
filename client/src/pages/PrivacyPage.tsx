import { useEffect } from 'react';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function PrivacyPage() {
  useEffect(() => {
    // Update document title
    document.title = "Privacy Policy | Courseware Platform";
    
    // Add meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Privacy Policy for Courseware Platform. Learn how we collect, use, and protect your personal information.');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = 'Privacy Policy for Courseware Platform. Learn how we collect, use, and protect your personal information.';
      document.head.appendChild(meta);
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">Privacy Policy</h1>
        
        <div className="bg-gray-900 rounded-lg p-6 md:p-8 shadow-lg">
          <div className="space-y-6 text-gray-300">
            <p>
              <strong>Last Updated:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-white">1. Introduction</h2>
              <p>
                This is the privacy policy for the Courseware Platform.
              </p>
            </section>
            
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-white">2. Data We Collect</h2>
              <p>
                We may collect, use, store and transfer different kinds of personal data about you which we have grouped together 
                as follows:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Identity Data: includes first name, last name, username or similar identifier.</li>
                <li>Contact Data: includes email address and telephone numbers.</li>
                <li>Technical Data: includes internet protocol (IP) address, browser type and version, time zone setting and location, 
                  browser plug-in types and versions, operating system and platform, and other technology on the devices you use to 
                  access this website.</li>
                <li>Usage Data: includes information about how you use our website and services.</li>
              </ul>
            </section>
            
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-white">3. How We Use Your Data</h2>
              <p>
                We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the 
                following circumstances:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>To register you as a new customer.</li>
                <li>To provide and improve our services to you.</li>
                <li>To manage our relationship with you.</li>
                <li>To administer and protect our business and website.</li>
              </ul>
            </section>
            
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-white">4. Data Security</h2>
              <p>
                We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used 
                or accessed in an unauthorized way, altered or disclosed. In addition, we limit access to your personal data to those 
                employees, agents, contractors and other third parties who have a business need to know.
              </p>
            </section>
            
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-white">5. Your Legal Rights</h2>
              <p>
                Under certain circumstances, you have rights under data protection laws in relation to your personal data, including 
                the right to request access, correction, erasure, restriction, transfer, to object to processing, to portability of 
                data and (where the lawful ground of processing is consent) to withdraw consent.
              </p>
            </section>
            
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-white">6. Contact Us</h2>
              <p>
                If you have any questions about this privacy policy or our privacy practices, please contact us by 
                visiting our <a href="/contact" className="text-blue-400 hover:text-blue-300 underline">contact page</a>.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
} 