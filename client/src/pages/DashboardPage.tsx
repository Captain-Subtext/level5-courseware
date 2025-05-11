import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Search, Lock, AlertCircle, Loader2, CheckCircle, Circle, Download, BookText, Terminal, HardDriveDownload, Database, Triangle, TrainTrack, Puzzle, Cloud, Github, FileText, Info, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
// Import useAuth and Profile type
import { useAuth, type Profile } from "@/lib/auth";
import apiClient from "../lib/apiClient";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { SEO } from "@/components/SEO";

// Define types for API data (adjust based on actual API response)
interface Section {
  id: string;
  module_id: string;
  title: string;
  // Add completion status
  completed?: boolean;
  order_index?: number; // Ensure order_index is typed
}

// Define UserProgress type (similar to ModulePage)
interface UserProgress {
  section_id: string;
  completed: boolean;
  updated_at: string;
}

// Add SubscriptionDetails type if not already present/imported
interface SubscriptionDetails {
  id: string;
  status: string;
  plan_name: string;
  // Add other fields as needed from your API response
}

interface Module {
  id: string;
  title: string;
  description: string;
  order_index: number;
  sections: Section[]; // Add sections array
  hasAccess: boolean; // Add hasAccess field
  completed: boolean; // Add completed field (used as placeholder)
  // Add other fields like completed, hasAccess, etc. as needed
}

// Custom hook for debouncing
function useDebounce(value: string, delay: number): string {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup function to cancel the timeout if value changes before delay
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // Only re-call effect if value or delay changes

  return debouncedValue;
}

// Define structure for platform links
interface PlatformLink {
  name: string;
  url: string;
  Icon: React.ElementType; // Lucide icon component
}

// List of platform links
const platformLinks: PlatformLink[] = [
  { name: 'Supabase', url: 'https://supabase.com/', Icon: Database },
  { name: 'Vercel', url: 'https://vercel.com/', Icon: Triangle },
  { name: 'Railway', url: 'https://railway.app/', Icon: TrainTrack },
  { name: 'Make.com', url: 'https://www.make.com/en/register?pc=empower', Icon: Puzzle },
  { name: 'Google Cloud', url: 'https://cloud.google.com/', Icon: Cloud },
  { name: 'Cloudflare', url: 'https://www.cloudflare.com/', Icon: Cloud },
  { name: 'GitHub', url: 'https://github.com/', Icon: Github },
];

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500); // 500ms debounce
  // Destructure banner state from useAuth
  const { user, isLoading: isAuthLoading, announcementBannerEnabled, announcementBannerText } = useAuth();
  const navigate = useNavigate();

  // Renamed state for content loading
  const [isLoadingContent, setIsLoadingContent] = useState(true);
  // Add local state for the dashboard's profile data
  const [dashboardProfile, setDashboardProfile] = useState<Profile | null>(null);

  const [courseContent, setCourseContent] = useState<Module[]>([]); // Content currently displayed
  const [allCourseContent, setAllCourseContent] = useState<Module[]>([]); // Holds the full list
  const [error, setError] = useState<string | null>(null);
  // Add state for subscription details
  const [subscriptionDetails, setSubscriptionDetails] = useState<SubscriptionDetails | null>(null);
  const [isResourcesOpen, setIsResourcesOpen] = useState(false);
  // Add state for banner dismissal
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);

  // Set document title on mount
  useEffect(() => {
    document.title = 'Learning Dashboard | Cursor for Non-Coders';
  }, []);

  // Handler to dismiss the banner
  function handleDismissBanner() {
    setIsBannerDismissed(true);
  }

  // Initial fetch for ALL modules/sections/progress/subscription
  useEffect(() => {
    async function fetchInitialData() {
      // Use renamed state setter
      setIsLoadingContent(true);
      setError(null);
      try {
        // Fetch modules, sections, and progress/subscription if logged in
        const requests: any[] = [
          apiClient.get<Module[]>('/api/modules'),
          apiClient.get<Section[]>('/api/sections'), // Gets all sections
        ];
        if (user) {
          requests.push(apiClient.get<UserProgress[]>('/api/user/progress'));
          requests.push(apiClient.get<SubscriptionDetails | null>('/api/user/subscription'));
        }

        const [modulesResponse, sectionsResponse, progressResponse, subscriptionResponse] = await Promise.all(requests);

        const modules = modulesResponse.data || [];
        const sections = sectionsResponse.data || [];
        const userProgressData = user ? (progressResponse?.data || []) : [];
        
        const fetchedSubscription = user ? (subscriptionResponse?.data || null) : null;
        setSubscriptionDetails(fetchedSubscription);
        
        const currentTier = fetchedSubscription?.status === 'active' ? (fetchedSubscription.plan_name || 'premium') : 'free';

        const progressMap = new Map(
          userProgressData.map((p: UserProgress) => [p.section_id, p.completed])
        );

        const combinedContent = modules.map(module => {
          const moduleSections = sections
            .filter(section => section.module_id === module.id)
            .map(section => ({
              ...section,
              completed: progressMap.get(section.id) || false
            }))
            .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));

          const completedSectionsCount = moduleSections.filter(s => s.completed).length;
          const moduleCompleted = moduleSections.length > 0 && completedSectionsCount === moduleSections.length;

          const hasAccess = currentTier !== 'free' || module.order_index === 1;
          
          return {
            ...module,
            sections: moduleSections,
            completed: moduleCompleted,
            hasAccess: hasAccess,
          };
        });

        setAllCourseContent(combinedContent);
        setCourseContent(combinedContent);

      } catch (err: any) {
        console.error('❌ [Dashboard] Error fetching initial course content:', err);
        console.error('❌ [Dashboard] Error details:', {
          response: err.response?.data,
          message: err.message,
          status: err.response?.status
        });
        setError(err.response?.data?.error || err.message || 'Failed to load initial course content.');
      } finally {
        // Use renamed state setter
        setIsLoadingContent(false);
      }
    }

    // Fetch data only if user object exists (or if fetching public data)
    // We rely on the user changing to trigger this effect for logged-in data.
    fetchInitialData();
  }, [user]); // Only re-fetch content/sub/progress data if user logs in/out

  // --- ADDED: Fetch profile data specifically for the dashboard greeting ---
  useEffect(() => {
    // Only fetch if auth is done loading, user exists, and we haven't fetched yet
    if (!isAuthLoading && user && !dashboardProfile) {
      apiClient.get<Profile>('/api/user/profile')
        .then(response => {
          setDashboardProfile(response.data);
        })
        .catch(err => {
          console.error('[DashboardPage] Failed to fetch profile:', err);
          // Handle error - maybe set profile to null or show a specific error
          setDashboardProfile(null); // Ensure profile is null on error
        });
    } else if (!isAuthLoading && !user) {
       // If auth is done and there's no user, ensure profile is null
       setDashboardProfile(null);
    }
  }, [user, isAuthLoading, dashboardProfile]); // Dependencies are correct


  // useEffect for handling search requests based on debounced query
  useEffect(() => {
    async function performSearch() {
      if (debouncedSearchQuery.trim() === '') {
        // If search is cleared, show all content again
        setCourseContent(allCourseContent);
        setError(null);
        return;
      }

      setError(null);
      try {
        const response = await apiClient.get<Module[]>(`/api/search?query=${encodeURIComponent(debouncedSearchQuery)}`);

        // Important: The search results only contain MODULE data.
        // We need to merge this with the section/progress data we already have in allCourseContent.
        const searchResultModuleIds = new Set(response.data.map(m => m.id));
        const filteredContentWithDetails = allCourseContent.filter(module =>
          searchResultModuleIds.has(module.id)
        );

        setCourseContent(filteredContentWithDetails);

      } catch (err: any) {
        console.error('Error performing search:', err);
        setError(err.response?.data?.error || err.message || 'Failed to perform search.');
        setCourseContent([]); // Clear content on search error
      }
    }

    // Trigger search only when debounced query changes
    performSearch();
  }, [debouncedSearchQuery, allCourseContent]); // Depend on debounced query and the full content list

  // Calculate progress based on the FULL content list, not the filtered one
  const totalSections = allCourseContent.reduce((acc, module) => acc + (module.sections?.length || 0), 0);
  const completedSections = allCourseContent.reduce((acc, module) => {
    // Sum completed sections within each module
    return acc + (module.sections?.filter(section => section.completed).length || 0);
  }, 0);

  const progressPercentage = totalSections > 0
    ? Math.round((completedSections / totalSections) * 100)
    : 0;

  // Filter content based on search and tab -> THIS IS NOW HANDLED BY THE SEARCH useEffect
  // const filteredContent = courseContent.filter(module => {\n  //   const matchesSearch = ...\n  //   ...\n  // });\n

  // Handle Continue Learning button - Find first incomplete section
  const handleContinueLearning = () => {
    let nextModuleId: string | null = null;
    let nextSectionId: string | null = null;
    let firstAccessibleModuleId: string | null = null;

    // Sort modules by order_index to ensure correct progression
    const sortedModules = [...allCourseContent].sort((a, b) => a.order_index - b.order_index);

    // Find the first incomplete section in the ordered modules/sections
    for (const module of sortedModules) {
        if (module.hasAccess) {
            // Track the first accessible module ID as a fallback
            if (!firstAccessibleModuleId) {
                firstAccessibleModuleId = module.id;
            }

            // Sections should already be sorted by order_index from fetch
            const firstIncompleteSection = module.sections.find(section => !section.completed);

            if (firstIncompleteSection) {
                // Found the target: first incomplete section in an accessible module
                nextModuleId = module.id;
                nextSectionId = firstIncompleteSection.id;
                break; // Stop searching
            }
            // If all sections in this accessible module are complete, keep searching the next module
        }
    }

    // Determine navigation target
    if (nextModuleId && nextSectionId) {
      // Navigate to the specific incomplete section
      navigate(`/module/${nextModuleId}?section=${nextSectionId}`);
    } else if (firstAccessibleModuleId) {
      // User completed everything accessible, navigate to the start of the first accessible module
      navigate(`/module/${firstAccessibleModuleId}`);
    } else {
      // No accessible modules found at all
      console.warn("No accessible modules found to continue learning.");
      // Button should ideally be disabled in this case, but log anyway
    }
  };

  // Determine if upgrade banner should show
  const showUpgradeBanner = !isLoadingContent && subscriptionDetails?.status !== 'active';

  // Conditionally render the announcement banner with a close button
  const renderAnnouncementBanner = () => {
    if (!announcementBannerEnabled || !announcementBannerText || isBannerDismissed) {
      return null;
    }

    return (
      <Alert
        className="relative mb-6 bg-blue-100 dark:bg-blue-950 border border-blue-300 dark:border-blue-800 text-blue-900 dark:text-blue-200 pr-8" // Adjusted classes for info-like appearance
      >
        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertTitle className="font-semibold text-blue-800 dark:text-blue-300">Announcement</AlertTitle>        <AlertDescription>{announcementBannerText}</AlertDescription>
        <button
          onClick={handleDismissBanner}
          aria-label="Dismiss announcement"
          className="absolute top-1 right-1 p-1 rounded-full text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
        >
          <X className="h-4 w-4" />
        </button>
      </Alert>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO
        title="Learning Dashboard | Cursor for Non-Coders"
        description="Track your progress and access all course materials on Cursor for Non-Coders Learning Dashboard"
        canonicalPath="/dashboard"
      />
      
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {dashboardProfile?.full_name || dashboardProfile?.nickname || user?.email?.split('@')[0] || 'Learner'}!</h1>
          <p className="text-muted-foreground">
            Track your progress and access all course materials
          </p>
        </div>

        {/* Render the announcement banner */}
        {renderAnnouncementBanner()}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Progress Card - Relocate Button */}
            <Card className="bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2"> {/* Added flex layout */}
                <div> {/* Wrap title/description */}
                  <CardTitle>Your Progress</CardTitle>
                  <CardDescription className="text-muted-foreground mt-1"> {/* Use calculated completedSections */}
                    {completedSections} of {totalSections} sections viewed
                  </CardDescription>
                </div>
                {/* Moved Button Here */}
                <Button
                  variant="outline" /* Changed variant */
                  size="sm" /* Made smaller */
                  onClick={handleContinueLearning}
                  // Use renamed loading state
                  disabled={courseContent.length === 0 || isLoadingContent}
                  className="ml-4 shrink-0" /* Added margin */
                >
                  {/* Use renamed loading state */}
                  {isLoadingContent ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null }
                  {/* Use shorter text */}
                  {isLoadingContent ? "..." : "Continue"}
                </Button>
              </CardHeader>
              <CardContent className="pt-2"> {/* Adjusted padding */}
                <Progress value={progressPercentage} className="h-2" />
                <p className="text-sm text-muted-foreground mt-2">{progressPercentage}% Complete (Estimate)</p>
                {/* Removed Button from here */}
              </CardContent>
            </Card>

            {/* Collapsible Resources Section - Styled to look like a Card */}
            <Collapsible
              open={isResourcesOpen}
              onOpenChange={setIsResourcesOpen}
              className="w-full space-y-2 border rounded-lg mt-6" // Added margin-top
            >
              {/* Style this div like a CardHeader */}
              <div className="flex items-center justify-between space-x-4 p-4">
                <h4 className="text-lg font-semibold">
                  Resources
                </h4>
                <CollapsibleTrigger asChild>
                  {/* Add persistent background to button */}
                  <Button variant="ghost" size="sm" className="w-9 p-0 bg-muted hover:bg-muted/80">
                    <ChevronDown className={`h-4 w-4 transition-transform ${isResourcesOpen ? 'rotate-180' : ''}`} />
                    <span className="sr-only">Toggle Resources</span>
                  </Button>
                </CollapsibleTrigger>
              </div>

              {/* Apply padding to content to mimic CardContent */}
              <CollapsibleContent className="px-4 pb-4 pt-0 space-y-6">
                {/* Quick Links Card (Keep inner cards) */}
                <Card className="shadow-none border"> {/* Add border back? Or rely on outer? User choice. */}
                  <CardHeader className="pt-2 pb-2 px-3"> {/* Fine-tune inner padding */}
                    <CardTitle className="text-base">Quick Links</CardTitle>
                    <CardDescription>Useful resources for your learning</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-3 px-3 space-y-3"> {/* Fine-tune inner padding */}
                    <div className="flex items-center space-x-3 text-muted-foreground cursor-not-allowed">
                      <Download className="h-4 w-4" />
                      <span>PDF downloads (Coming Soon)</span>
                    </div>
                    <Link to="/terminology" className="flex items-center space-x-3 hover:text-primary transition-colors">
                      <BookText className="h-4 w-4" />
                      <span>Terminology</span>
                    </Link>
                    <Link to="/commands" className="flex items-center space-x-3 hover:text-primary transition-colors">
                      <Terminal className="h-4 w-4" />
                      <span>Helpful Commands</span>
                    </Link>
                    <Link to="/installation" className="flex items-center space-x-3 hover:text-primary transition-colors">
                      <HardDriveDownload className="h-4 w-4" />
                      <span>Installation Guide</span>
                    </Link>
                  </CardContent>
                </Card>

                {/* Useful Documents Card - New Section */}
                <Card className="shadow-none border">
                  <CardHeader className="pt-2 pb-2 px-3">
                    <CardTitle className="text-base">Useful Documents</CardTitle>
                    <CardDescription>Essential guides and resources</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-3 px-3 space-y-3">
                    <a 
                      href="https://pjviwnulenjexsxaqlxp.supabase.co/storage/v1/object/public/docs//gemini-for-google-workspace-prompting-guide-101.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-3 hover:text-primary transition-colors"
                    >
                      <FileText className="h-4 w-4 flex-shrink-0" />
                      <span>Google Prompting Guide</span>
                    </a>
                    <a 
                      href="https://pjviwnulenjexsxaqlxp.supabase.co/storage/v1/object/public/docs//a-practical-guide-to-building-agents.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-3 hover:text-primary transition-colors"
                    >
                      <FileText className="h-4 w-4 flex-shrink-0" />
                      <span>Building AI Agents Guide</span>
                    </a>
                  </CardContent>
                </Card>

                {/* Platform Links Card (Keep inner cards) */}
                <Card className="shadow-none border"> {/* Add border back? */}
                  <CardHeader className="pt-2 pb-2 px-3"> {/* Fine-tune inner padding */}
                    <CardTitle className="text-base">Platform Links</CardTitle>
                    <CardDescription>Access key services used</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-3 px-3 space-y-3"> {/* Fine-tune inner padding */}
                    {platformLinks.map(({ name, url, Icon }) => (
                      <a
                        key={name}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-3 hover:text-primary transition-colors"
                      >
                        <Icon className="h-4 w-4 flex-shrink-0" />
                        <span>{name}</span>
                      </a>
                    ))}
                  </CardContent>
                </Card>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">Course Modules</h2>
              <div className="flex items-center space-x-2 w-full max-w-sm">
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search modules or sections..."
                    className="pl-10 w-full"
                    value={searchQuery} // Bind to the immediate search query
                    onChange={(e) => setSearchQuery(e.target.value)} // Update immediate query on change
                  />
                </div>
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchQuery('')} // Clear the search query
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Go Back
                  </Button>
                )}
              </div>
            </div>

            {/* Comment out Tabs for now as they depend on completion status */}
            {/* <Tabs value={currentTab} onValueChange={setCurrentTab} className="mb-6">
              <TabsList>
                <TabsTrigger value="all">All Modules</TabsTrigger>
                <TabsTrigger value="incomplete">In Progress</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>
            </Tabs> */}

            {/* Re-added Upgrade Notice */}
            {showUpgradeBanner && (
              <Alert className="mb-6 bg-yellow-50 dark:bg-yellow-950 border-yellow-300 dark:border-yellow-700">
                <Lock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                <AlertTitle>Upgrade to Access All Modules</AlertTitle>
                <AlertDescription className="flex justify-between items-center">
                  You currently have access to Module 1. Upgrade your plan for full access.
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/account#subscription')}
                    className="ml-4"
                  >
                    View Plans
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error Loading Content</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Use renamed loading state */}
            {isLoadingContent ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : courseContent.length > 0 ? (
              <ScrollArea className="h-[calc(100vh-50px)] border rounded-md bg-muted/20 dark:bg-muted/40">
                <div className="space-y-4 p-4">
                  {courseContent.map((module) => (
                    <Card
                      key={module.id}
                      className={`bg-card relative overflow-hidden
                        ${!module.hasAccess ? 'opacity-60 border-dashed border-amber-600/50' : ''}
                        ${module.completed ? 'bg-green-100/50 dark:bg-green-900/30' : ''}
                      `}
                    >
                      {/* Module Number Indicator */}
                      <div className="absolute top-3 right-3 flex items-center justify-center w-7 h-7 bg-primary text-primary-foreground rounded-full text-sm font-bold z-10">
                        {module.order_index}
                      </div>

                      <CardHeader>
                        {/* Conditionally render Badge above title */}
                        {!module.hasAccess && (
                          <div className="flex justify-start mb-2"> {/* Position badge to the LEFT */}
                            <Badge variant="secondary" className="shrink-0 bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-300/50">
                              <Lock className="mr-1 h-3 w-3" /> Premium
                            </Badge>
                          </div>
                        )}

                        {/* Original Title/Description structure */}
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg font-semibold flex items-center">
                              {/* Remove Lock icon from title if badge is shown above */}
                              {/* {!module.hasAccess && <Lock className="h-4 w-4 mr-2 text-amber-600 shrink-0" />} */}
                              {module.title}
                            </CardTitle>
                            <CardDescription className="text-muted-foreground mt-1">{module.description}</CardDescription>
                          </div>
                          {/* Remove badge from here */}
                          {/*
                          {!module.hasAccess && (
                            <Badge>...</Badge>
                          )}
                          */}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm border rounded-md p-3 bg-muted/20 dark:bg-muted/40">
                          {module.sections && module.sections.length > 0 ? (
                            module.sections.map((section) => (
                              <div
                                key={section.id}
                                className={`flex items-center justify-between p-2 rounded-sm transition-colors ${section.completed ? 'bg-green-100/50 dark:bg-green-900/30' : 'hover:bg-muted/50'}
                              `}>
                                <Link
                                  to={module.hasAccess ? `/module/${module.id}?section=${section.id}` : '#'}
                                  className={`flex items-center space-x-2 group ${!module.hasAccess ? 'cursor-not-allowed text-muted-foreground' : ''}`}
                                  onClick={(e) => !module.hasAccess && e.preventDefault()}
                                >
                                  {section.completed ? (
                                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-500 shrink-0" />
                                  ) : (
                                    <Circle className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0" />
                                  )}
                                  <span className={`${module.hasAccess ? 'group-hover:text-primary' : ''}`}>
                                    {section.title}
                                  </span>
                                </Link>
                                {/* TODO: Add duration later */}
                                {/* <span className="text-xs text-muted-foreground">{section.duration}</span> */}
                              </div>
                            ))
                          ) : (
                            <div className="text-muted-foreground italic p-2">No sections available.</div>
                          )}
                        </div>
                        <Button
                           variant="outline"
                           size="sm"
                           className="mt-4 w-full sm:w-auto"
                           disabled={!module.hasAccess}
                           onClick={() => module.hasAccess && navigate(`/module/${module.id}`)}
                         >
                           {!module.hasAccess && <Lock className="mr-2 h-4 w-4" />}
                           {module.hasAccess ? 'View Module' : 'Upgrade to Access'}
                         </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-16">
                <p className="text-muted-foreground">
                  {/* Adjust message based on whether a search is active */}
                  {debouncedSearchQuery
                    ? 'No modules match your search.'
                    : 'No course content available.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}