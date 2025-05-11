import { useEffect } from 'react';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function AboutPage() {
  useEffect(() => {
    // Update document title
    document.title = "About | Courseware Platform";
    
    // You could also add meta description here if needed
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'meta description goes here');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = 'meta content goes here';
      document.head.appendChild(meta);
    }
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <Navbar />

      {/* About Content */}
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-20">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-start">
          {/* Image Section */}
          <div className="relative w-full max-w-md mx-auto md:mx-0">
            <img
              src="/haf_balcony.jpg"
              alt="Haf on a balcony"
              className="w-full h-auto aspect-[3/4] object-cover rounded-lg shadow-2xl"
              loading="eager"
            />
          </div>

          {/* Text Content */}
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-center mb-2">Meet me</h1>
            
            <div className="bg-gray-900 rounded-lg p-6 md:p-8 space-y-4 text-gray-300 shadow-lg">
              <p>
                About me blah blah blah
              </p>

              <p>
                About me blah blah blah
              </p>

              <p>
                About me blah blah blah
              </p>

              <p>
                About me blah blah blah
              </p>

              <p>
                About me blah blah blah
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
} 