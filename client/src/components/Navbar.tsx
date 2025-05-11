import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, ShieldAlert } from "lucide-react";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger,
  SheetTitle,
  SheetDescription
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';

export default function Navbar() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const sheetTriggerRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();
  
  // Use the auth context to determine login state
  const { user, isAdmin, signOut } = useAuth();
  const isLoggedIn = !!user;

  // Check for scrollTo in location state when component mounts or updates
  useEffect(() => {
    if (location.state && location.state.scrollTo) {
      const sectionId = location.state.scrollTo;
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
          // Clear the state
          navigate('/', { replace: true, state: {} });
        }
      }, 100);
    }
  }, [location, navigate]);

  // Handle logout
  const handleSignOut = async () => {
    setIsSheetOpen(false);
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Determine the background color based on theme
  const navbarBgClass = resolvedTheme === 'light' 
    ? 'bg-gray-900 text-white' 
    : '';

  return (
    <nav className={`flex items-center justify-between p-6 ${navbarBgClass}`}>
      <Link to="/" className="flex items-center">
        <img 
          src="https://pjviwnulenjexsxaqlxp.supabase.co/storage/v1/object/public/files/c4nc-transparent.png" 
          alt="Cursor for Non-Coders Logo" 
          className="h-10 w-auto"
        />
      </Link>
      
      {/* Desktop Navigation */}
      <div className="hidden md:flex gap-6 items-center">
        <Link to="/" className="hover:text-gray-300 transition-colors">
          Home
        </Link>
        
        {isLoggedIn ? (
          <>
            <Link to="/account" className="hover:text-gray-300 transition-colors">
              Account
            </Link>
            <Link to="/dashboard" className="hover:text-gray-300 transition-colors">
              Dashboard
            </Link>
            {isAdmin && (
              <Link to="/admin" className="flex items-center hover:text-gray-300 transition-colors">
                <ShieldAlert className="h-4 w-4 mr-1" />
                Admin
              </Link>
            )}
            <Button 
              variant="ghost" 
              className="text-white hover:text-gray-300" 
              onClick={handleSignOut}
            >
              Sign Out
            </Button>
          </>
        ) : (
          <>
            <Link to="/signin" className="hover:text-gray-300 transition-colors">
              Sign In
            </Link>
            <Button 
              variant="outline" 
              className="bg-white text-black hover:bg-gray-100"
              onClick={() => navigate('/signin')}
            >
              Start Learning
            </Button>
          </>
        )}
      </div>
      
      {/* Mobile Navigation */}
      <div className="md:hidden">
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild ref={sheetTriggerRef}>
            <Button variant="ghost" size="icon" className="text-white">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent className="bg-gray-900/80 backdrop-blur-md text-white">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <SheetDescription className="sr-only">
              Main navigation links for the site.
            </SheetDescription>
            <div className="flex flex-col gap-6 mt-10">
              <Link 
                to="/" 
                className="text-xl hover:text-gray-300 transition-colors text-left"
                onClick={() => setIsSheetOpen(false)}
              >
                Home
              </Link>
              
              {isLoggedIn ? (
                <>
                  <Link 
                    to="/account" 
                    className="text-xl hover:text-gray-300 transition-colors text-left"
                    onClick={() => setIsSheetOpen(false)}
                  >
                    Account
                  </Link>
                  <Link 
                    to="/dashboard" 
                    className="text-xl hover:text-gray-300 transition-colors text-left"
                    onClick={() => setIsSheetOpen(false)}
                  >
                    Dashboard
                  </Link>
                  {isAdmin && (
                    <Link 
                      to="/admin" 
                      className="text-xl hover:text-gray-300 transition-colors text-left flex items-center"
                      onClick={() => setIsSheetOpen(false)}
                    >
                      <ShieldAlert className="h-5 w-5 mr-2" />
                      Admin
                    </Link>
                  )}
                  <Button 
                    variant="ghost" 
                    className="text-xl text-white hover:text-gray-300 justify-start p-0 h-auto font-normal"
                    onClick={handleSignOut}
                  >
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Link 
                    to="/signin" 
                    className="text-xl hover:text-gray-300 transition-colors text-left"
                    onClick={() => setIsSheetOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Button 
                    variant="outline" 
                    className="bg-white text-black hover:bg-gray-100 mt-4"
                    onClick={() => navigate('/signin')}
                  >
                    Start Learning
                  </Button>
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
} 