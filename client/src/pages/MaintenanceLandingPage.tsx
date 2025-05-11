import { Card } from '@/components/ui/card';

/**
 * A simple, static page displayed when the site is effectively in maintenance mode
 * for the main landing page, directing users elsewhere or informing them of updates.
 */
export default function MaintenanceLandingPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-950 text-white p-4">
      <Card className="max-w-md p-8 bg-gray-900 border-gray-800 shadow-xl">
        <div className="text-center">
          <div className="mx-auto mb-8 flex justify-center">
            <img
              src="enter your URL for your logo here"
              alt="Your Logo"
              className="h-28 w-auto"
            />
          </div>

          <h1 className="text-3xl font-bold mb-4 text-blue-400">Under Construction!</h1>

          <p className="text-gray-300 mb-6">
            Our main site is currently undergoing updates.
            Registered users can still access their dashboard directly.
          </p>

          {/* Optional: Add a link if there's a status page or alternative access point */}
          {/* <Button asChild>
            <Link to="/dashboard">Go to Dashboard</Link>
          </Button> */}
        </div>
      </Card>
    </div>
  );
} 