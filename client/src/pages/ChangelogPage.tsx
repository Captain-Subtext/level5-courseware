import { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function ChangelogPage() {
  useEffect(() => {
    document.title = 'Changelog - Cursor for Non-Coders';
  }, []);

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="container mx-auto px-4 py-12 md:py-16">
        <h1 className="text-4xl font-bold mb-8 text-center">Changelog</h1>
        
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Version 1.0.13. Entry */}
          <section>
            <h2 className="text-2xl font-semibold mb-2 border-b pb-2">[1.0.13] - 2025-05-2</h2>
            <div className="prose prose-invert max-w-none text-muted-foreground">
              <h3 className="text-xl font-medium text-foreground">Updates</h3>
              <ul>
                <li>Module 2 launch.</li>
              </ul>
              
              <h3 className="text-xl font-medium text-foreground">Fixed</h3>
              <ul>
                <li>Stripe webhook for subscription status updates.</li>
                <li>User upgrade/downgrade notifications.</li>
                <li>Groundwork for email notifications and updates.</li>
              </ul>

            </div>
          </section>
          {/* Version 1.0. Entry */}
          <section>
            <h2 className="text-2xl font-semibold mb-2 border-b pb-2">[1.0] - 2025-04-21</h2>
            <div className="prose prose-invert max-w-none text-muted-foreground">
              <h3 className="text-xl font-medium text-foreground">Updates</h3>
              <ul>
                <li>Site public launch version deployed.</li>
                <li>Module 1 released as part of a public launch.</li>
                <li>Schedule of Module releases added to the home page</li>
              </ul>
              
              <h3 className="text-xl font-medium text-foreground">Fixed</h3>
              <ul>
                <li>Resolved issue causing blank screens during navigation/reload on authenticated pages.</li>
              </ul>

            </div>
          </section>
          
          {/* Add previous versions here as needed */}
          
        </div>
      </main>
      <Footer />
    </div>
  );
} 