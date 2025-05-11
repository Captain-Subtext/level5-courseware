import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Lock,
  AlertCircle,
  CheckCircle,
  Clock,
  Circle,
} from 'lucide-react';
import { 
  Alert, 
  AlertTitle, 
  AlertDescription 
} from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth';
import apiClient from '../lib/apiClient';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import rehypeRaw from 'rehype-raw';
import { type AxiosResponse as AxiosResponseType } from 'axios';
import { merge } from 'lodash';
import { SEO } from '@/components/SEO';
import remarkGfm from 'remark-gfm';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// Define custom schema by extending the default schema
const customSchema = merge({}, defaultSchema, {
  tagNames: [
    ...(defaultSchema.tagNames || []),
    'audio', 'video', 'iframe', 'source', // Keep existing media tags
    'table', 'thead', 'tbody', 'tr', 'th', 'td' // <-- Add table tags
  ],
  attributes: {
    ...(defaultSchema.attributes || {}),
    audio: [...(defaultSchema.attributes?.audio || []), 'controls', 'src', 'preload'],
    video: [...(defaultSchema.attributes?.video || []), 'controls', 'width', 'height', 'src', 'preload'],
    source: [...(defaultSchema.attributes?.source || []), 'src', 'type'],
    iframe: [...(defaultSchema.attributes?.iframe || []), 'src', 'width', 'height', 'frameborder', 'allow', 'allowfullscreen'],
    // Allow alignment attributes for table cells
    td: [...(defaultSchema.attributes?.td || []), ['align', 'left', 'center', 'right']], 
    th: [...(defaultSchema.attributes?.th || []), ['align', 'left', 'center', 'right']],
    '*': [...(defaultSchema.attributes?.[ '*' ] || []), 'class'] // Allow class globally if needed, refine if possible
  },
  clobberPrefix: 'user-content-', // Prevent user content from accessing window properties
});

interface Module {
  id: string;
  title: string;
  description: string | null;
  order_index: number;
  hasAccess: boolean;
  sections: Section[];
  completed: boolean;
}

interface Section {
  id: string;
  module_id: string;
  title: string;
  content: string | null;
  duration: string | null;
  order_index: number;
  completed: boolean;
  updated_at?: string;
}

// Add type for UserProgress
interface UserProgress {
  section_id: string;
  completed: boolean;
  updated_at: string;
}

// Add type for Bookmark
interface Bookmark {
  module_id: string;
  section_id: string | null;
  updated_at: string;
}

// Add type for SubscriptionDetails
interface SubscriptionDetails {
  status: string;
  plan_name?: string;
}

// Component for when a subscription is required
function SubscriptionRequired() {
  const navigate = useNavigate();
  
  return (
    <Card className="max-w-xl mx-auto my-12">
      <CardHeader>
        <CardTitle className="flex items-center text-amber-600">
          <Lock className="h-5 w-5 mr-2" />
          Premium Content Locked
        </CardTitle>
        <CardDescription>
          This module is only available to premium subscribers.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p>
          Upgrade your subscription to get access to all modules, sections, and premium features.
        </p>
        <Alert variant="default" className="bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertTitle>Premium Benefits</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Access to all course modules and sections</li>
              <li>Downloadable resources and code samples</li>
              <li>Priority support and feedback</li>
              <li>Early access to new content</li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row gap-3 sm:justify-center">
        <Button variant="outline" onClick={() => navigate('/dashboard')}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          Return to Dashboard
        </Button>
        <Button onClick={() => navigate('/account?tab=subscription')}>
          View Subscription Plans
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function ModulePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const sectionParam = searchParams.get('section');
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [module, setModule] = useState<Module | null>(null);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [savingProgress, setSavingProgress] = useState(false);
  const [bookmarkLoaded, setBookmarkLoaded] = useState(false);
  // Add state to track if access check is complete
  const [accessCheckComplete, setAccessCheckComplete] = useState(false);
  
  // Set document title when module data loads
  useEffect(() => {
    if (module) {
      document.title = `${module.title} | Cursor for Non-Coders`;
    } else if (isLoading) {
      document.title = 'Loading Module... | Cursor for Non-Coders';
    } else if (error) {
      document.title = 'Error Loading Module | Cursor for Non-Coders';
    }
  }, [module, isLoading, error]);
  
  // Save bookmark when section changes
  useEffect(() => {
    // Don't save during initial load or when not authenticated
    if (!user || !module || !bookmarkLoaded || !module.sections.length) return;

    const currentSection = module.sections[currentSectionIndex];
    if (currentSection) {
      // Update bookmark using apiClient
      setSavingProgress(true); // Indicate saving
      apiClient.post('/api/bookmarks', { 
        module_id: module.id, 
        section_id: currentSection.id 
      }).then(() => {
        console.log('Bookmark saved successfully');
      }).catch(err => {
        console.error('Error saving bookmark:', err.response?.data?.error || err.message);
      }).finally(() => {
         setSavingProgress(false); 
      });
    }
  }, [currentSectionIndex, user, module, bookmarkLoaded]);
  
  // Fetch module, section data, progress, and bookmark
  useEffect(() => {
    async function fetchModuleData() {
      if (!id) {
        setError("Module ID is missing.");
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      setBookmarkLoaded(false); // Reset bookmark loaded status
      setAccessCheckComplete(false); // Reset access check status

      try {
        // --- Define types for expected responses ---
        type ModuleResponse = AxiosResponseType<Module>;
        type SectionsResponse = AxiosResponseType<Section[]>;
        type ProgressResponse = AxiosResponseType<UserProgress[]>;
        type BookmarkResponse = AxiosResponseType<Bookmark | null>; // Can be null
        // Add type for subscription response
        type SubscriptionResponse = AxiosResponseType<SubscriptionDetails | null>; 

        // --- Fetch Module, Sections, Progress, Bookmark, and Subscription Concurrently ---
        const moduleRequest = apiClient.get<Module>(`/api/modules/${id}`);
        const sectionsRequest = apiClient.get<Section[]>(`/api/sections?module_id=${id}`);
        
        let progressRequest: Promise<ProgressResponse>;
        let bookmarkRequest: Promise<BookmarkResponse>;
        let subscriptionRequest: Promise<SubscriptionResponse>; // Add subscription request

        // Only fetch progress, bookmark and subscription if user is logged in
        if (user) {
          progressRequest = apiClient.get<UserProgress[]>(`/api/user/progress?module_id=${id}`); 
          bookmarkRequest = apiClient.get<Bookmark | null>(`/api/bookmarks?module_id=${id}`);
          subscriptionRequest = apiClient.get<SubscriptionDetails | null>('/api/user/subscription'); // Fetch subscription
        } else {
          // Add placeholders that conform to AxiosResponseType
          // Cast the resolved object to the expected response type
          progressRequest = Promise.resolve({
            data: [] as UserProgress[],
            status: 200, statusText: 'OK', headers: {}, config: {}
          } as ProgressResponse); 
          bookmarkRequest = Promise.resolve({
            data: null as Bookmark | null,
            status: 200, statusText: 'OK', headers: {}, config: {}
          } as BookmarkResponse);
          // Placeholder for subscription when logged out
          subscriptionRequest = Promise.resolve({
            data: null as SubscriptionDetails | null,
            status: 200, statusText: 'OK', headers: {}, config: {}
          } as SubscriptionResponse);
        }

        // Explicitly type the results tuple
        const [
          moduleResponse, 
          sectionsResponse, 
          progressResponse, 
          bookmarkResponse,
          subscriptionResponse // Add subscription response
        ]: [
          ModuleResponse, 
          SectionsResponse, 
          ProgressResponse, 
          BookmarkResponse,
          SubscriptionResponse // Add subscription response type
        ] = await Promise.all([
          moduleRequest,
          sectionsRequest,
          progressRequest,
          bookmarkRequest,
          subscriptionRequest // Add subscription request
        ]);

        // --- Process Responses ---
        const moduleData = moduleResponse.data;
        if (!moduleData || typeof moduleData !== 'object' || Array.isArray(moduleData)) {
          throw new Error("Module data is invalid or missing.");
        }

        const sectionsData = sectionsResponse.data || [];
        const userProgressData = progressResponse.data || [];
        const bookmarkData = bookmarkResponse.data; // Can be null
        // Store subscription details in state
        const fetchedSubscription = subscriptionResponse.data;
        const currentTier = fetchedSubscription?.status === 'active' ? (fetchedSubscription.plan_name || 'premium') : 'free';

        // *** DETERMINE ACCESS ***
        // User has access if they are on a paid tier OR if it's the first module (index 1)
        const hasAccess = currentTier !== 'free' || moduleData.order_index === 1;
        
        // Mark access check as complete
        setAccessCheckComplete(true);

        // If no access, stop processing and let the rendering logic handle it
        if (!hasAccess) {
           setModule(moduleData); // Still set module data so SubscriptionRequired can show title etc.
           setIsLoading(false);
           return; 
        }

        // --- Combine Data (Only if user has access) ---
        const progressMap = new Map(
          Array.isArray(userProgressData) 
            ? userProgressData.map((p: UserProgress) => [p.section_id, p]) 
            : []
        );

        // Combine sections with their progress status
        const sectionsWithProgress = sectionsData
          .map((section: Section) => {
            const progressInfo = progressMap.get(section.id);
            return {
              ...section,
              completed: progressInfo ? progressInfo.completed : false,
            };
          })
          .sort((a: Section, b: Section) => a.order_index - b.order_index);

        // Combine module with sections and calculate module completion
        const completedSectionsCount = sectionsWithProgress.filter((s: Section) => s.completed).length;
        const moduleCompleted = sectionsWithProgress.length > 0 && completedSectionsCount === sectionsWithProgress.length;

        const combinedModule: Module = {
          ...moduleData,
          sections: sectionsWithProgress,
          completed: moduleCompleted,
          // TODO: Determine hasAccess based on moduleData or user subscription status API call
          hasAccess: true, // Placeholder - Assume access for now
        };

        setModule(combinedModule);

        // --- Determine Initial Section ---
        let initialSectionIndex = 0;
        // Use optional chaining for bookmarkData as it can be null
        const targetSectionId = sectionParam || bookmarkData?.section_id;

        if (targetSectionId) {
          const foundIndex = combinedModule.sections.findIndex(s => s.id === targetSectionId);
          if (foundIndex !== -1) {
            initialSectionIndex = foundIndex;
          }
        }
        
        setCurrentSectionIndex(initialSectionIndex);
        setBookmarkLoaded(true); // Indicate bookmark (and initial section) is determined

      } catch (err: any) {
        console.error('Error fetching module data:', err);
        setError(err.response?.data?.error || err.message || 'Failed to load module content.');
        setModule(null); // Clear module data on error
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchModuleData();
    // Depend on module ID and user (for progress/bookmark fetching)
  }, [id, user, sectionParam]); 

  // Calculate progress percentage
  const completedSections = module?.sections 
    ? module.sections.filter(s => s.completed).length 
    : 0;
  const totalSections = module?.sections?.length || 0;
  const progressPercentage = totalSections > 0 
    ? Math.round((completedSections / totalSections) * 100) 
    : 0;
    
  // Current section being viewed
  const currentSection = module?.sections?.[currentSectionIndex] || null;
  
  // Add a new useEffect to scroll to top when currentSectionIndex changes
  useEffect(() => {
    // Only scroll if we have a module and are not in initial loading
    if (module && bookmarkLoaded) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentSectionIndex, module, bookmarkLoaded]);
  
  // Handle marking a section as complete
  async function handleMarkComplete() {
    if (!user || !currentSection || !module) return;
    
    try {
      setSavingProgress(true);
      
      await apiClient.post('/api/user/progress', {
        section_id: currentSection.id,
        completed: true
      });
      
      // Update local state
      setModule(prev => {
        if (!prev) return null;
        
        const updatedSections = [...prev.sections];
        updatedSections[currentSectionIndex] = {
          ...updatedSections[currentSectionIndex],
          completed: true
        };
        
        // Check if all sections are completed now
        const allCompleted = updatedSections.every(s => s.completed);
        
        return {
          ...prev,
          sections: updatedSections,
          completed: allCompleted
        };
      });
      
      // If this is the last section, show completion message
      if (module && currentSectionIndex === module.sections.length - 1) {
        // Optional: show a completion toast or modal
      } else {
        // Move to next section
        setCurrentSectionIndex(currentSectionIndex + 1);
      }
      
    } catch (err) {
      console.error('Error updating progress:', err);
    } finally {
      setSavingProgress(false);
    }
  }
  
  // Handle marking a section as incomplete (for reviewing)
  async function handleMarkIncomplete() {
    if (!user || !currentSection || !module) return;
    
    try {
      setSavingProgress(true);
      
      await apiClient.post('/api/user/progress', {
        section_id: currentSection.id,
        completed: false
      });
      
      // Update local state
      setModule(prev => {
        if (!prev) return null;
        
        const updatedSections = [...prev.sections];
        updatedSections[currentSectionIndex] = {
          ...updatedSections[currentSectionIndex],
          completed: false
        };
        
        return {
          ...prev,
          sections: updatedSections,
          completed: false
        };
      });
      
    } catch (err) {
      console.error('Error updating progress:', err);
    } finally {
      setSavingProgress(false);
    }
  }
  
  // Transform image URLs (and now video/audio URLs)
  const transformContent = (content: string | undefined): string => {
    // Replace custom video syntax @[video](storage:video/filename.mp4)
    content = content?.replace(/@\[video\]\(storage:(.*?)\)/g, (match, path) => {
        console.log(`Found video path: ${path}`); // Debugging
        // Determine bucket based on path pattern (adjust if needed)
        const bucket = path.startsWith('video/') ? 'course-content' : 'default-bucket'; // Example logic
        const fullUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
        console.log(`Transformed video URL: ${fullUrl}`); // Debugging
        return `<video controls width="100%"><source src="${fullUrl}" type="video/mp4">Your browser does not support the video tag.</video>`;
    });

    // Simple replacement for storage images (already implemented elsewhere likely)
    content = content?.replace(/\(storage:(.*?)\)/g, (match, path) => {
       // Assume images are in 'course-content' unless a specific path indicates otherwise
       const bucket = 'course-content'; 
       return `(${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path})`;
    });

    return content || '';
  };
  
  // Render access restricted state FIRST if check is complete and no access
  if (accessCheckComplete && module && !module.hasAccess) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <SubscriptionRequired />
        </div>
        <Footer />
      </div>
    );
  }
  
  // Render loading state (consider adding check for accessCheckComplete === false?)
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
          <span>Loading module content...</span>
        </div>
        <Footer />
      </div>
    );
  }
  
  // Render error state
  if (error || !module) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error || 'Could not load the module. Please try again later.'}
            </AlertDescription>
          </Alert>
          <Button 
            onClick={() => navigate('/dashboard')}
            className="mt-4"
          >
            Return to Dashboard
          </Button>
        </div>
        <Footer />
      </div>
    );
  }
  
  // Render module content
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* SEO Component - Use canonical without section parameters to avoid duplicate content */}
      <SEO 
        title={module ? `${module.title} | Cursor for Non-Coders` : 'Module | Cursor for Non-Coders'}
        description={module?.description || 'View module content and track your progress.'}
        canonicalPath={`/module/${id}`}
      />
      
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-6">
        <div className="mb-4">
          <Button 
            variant="ghost" 
            className="p-0 mb-2" 
            onClick={() => navigate('/dashboard')}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Button>
          
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">{module.title}</h1>
              <p className="text-muted-foreground mt-1">{module.description}</p>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="text-sm text-muted-foreground mr-2">
                {completedSections} of {totalSections} sections completed
              </div>
              <Progress value={progressPercentage} className="w-32 h-2" />
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Table of Contents Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Table of Contents</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {module.sections.map((section, index) => (
                    <div 
                      key={section.id}
                      className={`px-4 py-2 flex justify-between items-center hover:bg-muted/50 cursor-pointer transition-colors ${
                        index === currentSectionIndex ? 'bg-muted font-medium' : ''
                      }`}
                      onClick={() => setCurrentSectionIndex(index)}
                    >
                      <div className="flex items-center space-x-2">
                        {section.completed ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className={`text-sm ${index === currentSectionIndex ? 'text-primary' : ''}`}>
                          {section.title}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">{section.duration}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Content Area */}
          <div className="lg:col-span-3">
            {currentSection ? (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-xl">{currentSection.title}</CardTitle>
                      <CardDescription className="text-muted-foreground mt-1">
                        Duration: {currentSection.duration || 'N/A'}
                      </CardDescription>
                    </div>
                    
                    <Badge 
                      variant={currentSection.completed ? "outline" : "default"}
                      className={currentSection.completed ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-500" : ""}
                    >
                      {currentSection.completed ? "Completed" : "In Progress"}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="prose dark:prose-invert max-w-none">
                  <ReactMarkdown
                    children={transformContent(currentSection.content || '')}
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[
                      rehypeRaw,
                      [rehypeSanitize, customSchema]
                    ]}
                  />
                  
                  {/* Last updated timestamp */}
                  {currentSection.updated_at && (
                    <div className="mt-8 pt-4 border-t border-border text-sm text-muted-foreground flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      Last updated: {new Date(currentSection.updated_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  )}
                </CardContent>
                
                <CardFooter className="flex justify-between pt-4 border-t">
                  <Button
                    variant="outline"
                    disabled={currentSectionIndex === 0}
                    onClick={() => setCurrentSectionIndex(prev => Math.max(0, prev - 1))}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  
                  <div className="space-x-2">
                    {currentSection.completed ? (
                      <Button
                        variant="outline"
                        onClick={handleMarkIncomplete}
                        disabled={savingProgress}
                      >
                        {savingProgress && (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        )}
                        Mark as Incomplete
                      </Button>
                    ) : (
                      <Button
                        onClick={handleMarkComplete}
                        disabled={savingProgress}
                      >
                        {savingProgress && (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        )}
                        {currentSectionIndex < module.sections.length - 1 
                          ? 'Complete & Continue' 
                          : 'Mark as Complete'
                        }
                      </Button>
                    )}
                    
                    {!currentSection.completed && currentSectionIndex < module.sections.length - 1 && (
                      <Button
                        variant="ghost"
                        onClick={() => setCurrentSectionIndex(prev => Math.min(module.sections.length - 1, prev + 1))}
                      >
                        Skip
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    )}
                  </div>
                  
                  <Button
                    variant="outline"
                    disabled={currentSectionIndex === module.sections.length - 1}
                    onClick={() => setCurrentSectionIndex(prev => Math.min(module.sections.length - 1, prev + 1))}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardFooter>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground">No section selected or available.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
} 