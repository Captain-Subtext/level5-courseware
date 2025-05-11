import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Layout } from "../components/Layout";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  useEffect(() => {
    document.title = '404 Not Found | Cursor for Non-Coders';
  }, []);

  return (
    <Layout>
      <div className="container flex min-h-[70vh] flex-col items-center justify-center text-center">
        <div className="space-y-5">
          <h1 className="text-6xl font-bold text-primary">404</h1>
          <h2 className="text-2xl font-medium tracking-tight">Page Not Found</h2>
          <p className="text-muted-foreground">
            The page you are looking for doesn't exist or has been moved.
          </p>
          
          <div className="flex justify-center gap-4 mt-8">
            <button 
              onClick={() => window.history.back()}
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Go Back
            </button>
            <a 
              href="/"
              className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background hover:bg-accent hover:text-accent-foreground"
            >
              Go Home
            </a>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default NotFound;
