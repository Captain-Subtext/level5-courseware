import { useAuth } from '@/lib/auth';
import { Card } from '@/components/ui/card';

export default function MaintenanceMode({ children }: { children: React.ReactNode }) {
  // Get state directly from Auth context
  const { isAdmin, isInMaintenanceMode, isLoading } = useAuth(); 

  // Show loading indicator while auth provider is initializing
  if (isLoading) {
      // Render nothing or a minimal loader, as AuthProvider does initial checks
      return null; 
  }

  // If site is in maintenance mode (from context) and user is not an admin, show maintenance page
  if (isInMaintenanceMode && !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950 text-white p-4">
        <Card className="max-w-md p-8 bg-gray-900 border-gray-800 shadow-xl">
          <div className="text-center">
            <div className="mx-auto mb-8 flex justify-center">
              <img 
                src="https://pjviwnulenjexsxaqlxp.supabase.co/storage/v1/object/public/files/c4nc-transparent.png" 
                alt="Cursor for Non-Coders Logo" 
                className="h-28 w-auto" 
              />
            </div>
            
            <h1 className="text-3xl font-bold mb-4 text-blue-400">We'll Be Back Soon!</h1>
            
            <p className="text-gray-300">
              We're currently updating our site with new content and features. 
              Please check back soon!
            </p>
          </div>
        </Card>
      </div>
    );
  }
  
  // Otherwise, render children normally
  console.log('[MaintenanceMode] Rendering children (Routes)');
  return <>{children}</>;
} 