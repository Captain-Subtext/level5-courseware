import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description?: string;
  canonicalPath: string; // The path without domain
  noindex?: boolean;
}

/**
 * SEO component for managing meta tags and canonical URLs
 * Must be used within a HelmetProvider (should be in App.tsx)
 */
export function SEO({ title, description, canonicalPath, noindex = false }: SEOProps) {
  // Remove any trailing slashes for consistency
  const normalizedPath = canonicalPath.endsWith('/') 
    ? canonicalPath.slice(0, -1) 
    : canonicalPath;
  
  // Default base URL for canonical links and Open Graph
  const baseUrl = 'https://www.example.com';
  
  return (
    <Helmet>
      <title>{title}</title>
      {description && <meta name="description" content={description} />}
      <link rel="canonical" href={`${baseUrl}${normalizedPath}`} />
      {noindex && <meta name="robots" content="noindex" />}
    </Helmet>
  );
} 