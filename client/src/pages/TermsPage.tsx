import { useEffect } from 'react';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function TermsPage() {
  useEffect(() => {
    // Update document title
    document.title = "Terms of Service - Courseware Platform";
    
    // Add meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Terms of Service for Cursor for Non-Coders. Read about the terms and conditions for using our services.');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = 'Terms of Service for Cursor for Non-Coders. Read about the terms and conditions for using our services.';
      document.head.appendChild(meta);
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">Terms of Service</h1>
        
        <div className="bg-gray-900 rounded-lg p-6 md:p-8 shadow-lg">
          <div className="space-y-6 text-gray-300">
            <p>
              <strong>Last Updated:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-white">1. Introduction</h2>
              <p>
                This is the terms of service for the Courseware Platform.
              </p>
            </section>
            
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-white">2. Using Our Services</h2>
              <p>
                You must follow any policies made available to you within the Services. You may use our Services only as permitted 
                by law. We may suspend or stop providing our Services to you if you do not comply with our terms or policies or if 
                we are investigating suspected misconduct.
              </p>
            </section>
            
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-white">3. Your Content</h2>
              <p>
                Our Services allow you to upload, submit, store, send or receive content. You retain ownership of any intellectual 
                property rights that you hold in that content.
              </p>
              <p>
                When you upload, submit, store, send or receive content to or through our Services, you give us a worldwide license 
                to use, host, store, reproduce, modify, create derivative works, communicate, publish, publicly perform, publicly 
                display and distribute such content.
              </p>
            </section>
            
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-white">4. Software in our Services</h2>
              <p>
                When a Service requires or includes downloadable software, this software may update automatically on your device once 
                a new version or feature is available. Some Services may let you adjust your automatic update settings.
              </p>
              <p>
                We give you a personal, worldwide, royalty-free, non-assignable and non-exclusive license to use the software provided 
                to you as part of the Services. This license is for the sole purpose of enabling you to use and enjoy the benefit of 
                the Services as provided by us, in the manner permitted by these Terms.
              </p>
            </section>
            
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-white">5. Modifying and Terminating our Services</h2>
              <p>
                We are constantly changing and improving our Services. We may add or remove functionalities or features, and we may 
                suspend or stop a Service altogether.
              </p>
              <p>
                You can stop using our Services at any time. We may also stop providing Services to you, or add or create new limits 
                to our Services at any time.
              </p>
            </section>
            
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-white">6. Liability for our Services</h2>
              <p>
                To the extent permitted by law, we exclude all warranties. We're not responsible for the content accessed through our 
                Services, or for websites or services linked from our Services.
              </p>
              <p>
                To the extent permitted by law, our total liability for any claims under these terms, including for any implied warranties, 
                is limited to the amount you paid us to use the Services.
              </p>
            </section>
            
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-white">7. About these Terms</h2>
              <p>
                We may modify these terms or any additional terms that apply to a Service to, for example, reflect changes to the law 
                or changes to our Services. You should look at the terms regularly.
              </p>
              <p>
                If you do not agree to the modified terms for a Service, you should discontinue your use of that Service.
              </p>
            </section>
            
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-white">8. Contact Us</h2>
              <p>
                If you have any questions about these Terms, please contact us by 
                visiting our <a href="/contact" className="text-blue-400 hover:text-blue-300 underline">contact page</a>.
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
} 