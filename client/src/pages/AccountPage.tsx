import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { 
  // Bell, // Removed
  CreditCard, 
  LogOut, 
  Settings, 
  // User, // Removed
  AlertCircle,
  Sun,
  Moon,
  MonitorSmartphone,
  CheckCircle,
  // AlertTriangle, // Removed
  Mail,
  Eye,
  EyeOff,
  // Pencil, // Removed
  Shield,
  User as UserIcon,
  // Calendar, // Removed
  // XCircle, // Removed
  Loader2
} from "lucide-react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import apiClient from "../lib/apiClient";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { StripePaymentForm, StripeManageSubscriptionButton } from "@/components/StripePaymentForm";
import { STRIPE_PLANS } from "@/lib/stripe";
import { SEO } from "@/components/SEO";

// Color options for avatar
const avatarColors = [
  { name: 'Gray', value: 'bg-gray-500' },
  { name: 'Red', value: 'bg-red-500' },
  { name: 'Orange', value: 'bg-orange-500' },
  { name: 'Amber', value: 'bg-amber-500' },
  { name: 'Yellow', value: 'bg-yellow-500' },
  { name: 'Lime', value: 'bg-lime-500' },
  { name: 'Green', value: 'bg-green-500' },
  { name: 'Emerald', value: 'bg-emerald-500' },
  { name: 'Teal', value: 'bg-teal-500' },
  { name: 'Cyan', value: 'bg-cyan-500' },
  { name: 'Sky', value: 'bg-sky-500' },
  { name: 'Blue', value: 'bg-blue-500' },
  { name: 'Indigo', value: 'bg-indigo-500' },
  { name: 'Violet', value: 'bg-violet-500' },
  { name: 'Purple', value: 'bg-purple-500' },
  { name: 'Fuchsia', value: 'bg-fuchsia-500' },
  { name: 'Pink', value: 'bg-pink-500' },
  { name: 'Rose', value: 'bg-rose-500' },
];

// --- Define Interfaces ---
interface EmailPreferences {
  contentUpdates: boolean;
  accountChanges: boolean;
  marketing: boolean;
}

interface Profile {
  id: string;
  email?: string; // Assuming email is part of profile or needed
  full_name: string | null;
  nickname: string | null;
  avatar_color: string | null;
  avatar_url: string | null;
  subscription_tier?: string; // May come from profile or subscription
  email_preferences: EmailPreferences | null;
  // Add other fields if they exist in your profiles table
}

interface SubscriptionDetails {
  id: string;
  status: string;
  plan_name: string;
  created?: number; // Add created/start timestamp if available from API
  current_period_end: number; // Timestamp
  cancel_at_period_end: boolean;
  // Add other relevant Stripe subscription fields
}

// --- Helper Component for Form Feedback ---
function FormFeedback({ error, successMessage }: { error: string | null; successMessage: string | null }) {
  // Don\'t render anything if there are no messages
  if (!error && !successMessage) {
    return null;
  }

  return (
    <div className="w-full mb-4"> {/* Container with bottom margin */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {/* Clear error before showing success */}
      {!error && successMessage && ( 
        <Alert 
          variant="default" 
          className="border-green-500/50 bg-green-50 text-green-900 dark:border-green-500/60 dark:bg-green-950 dark:text-green-300"
        >
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export default function AccountPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut, isEmailVerified, sendVerificationEmail, clearAuthLocally } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [isLoadingPageData, setIsLoadingPageData] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [nickname, setNickname] = useState("");
  const [avatarColor, setAvatarColor] = useState("bg-gray-500");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileData, setProfileData] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const [emailNotifications, setEmailNotifications] = useState<EmailPreferences>({
    contentUpdates: true,
    accountChanges: true,
    marketing: false
  });
  
  const [isResendingEmail, setIsResendingEmail] = useState(false);
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [subscriptionDetails, setSubscriptionDetails] = useState<SubscriptionDetails | null>(null);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true);

  // Define the initializer function first
  const getInitialTab = () => {
    if (location.hash === '#subscription') return 'subscription';
    const queryParams = new URLSearchParams(location.search);
    const tab = queryParams.get('tab');
    if (tab && ['profile', 'security', 'subscription', 'preferences'].includes(tab)) {
      return tab;
    }
    return 'profile';
  };

  // Now declare the state variable using the function
  const [activeTab, setActiveTab] = useState<string>(getInitialTab);

  // Handle scrolling when the component mounts or activeTab becomes 'subscription'
  useEffect(() => {
    if (activeTab === 'subscription') {
      const element = document.getElementById('subscription-section');
      if (element) {
        const timer = setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150); 
        return () => clearTimeout(timer);
      }
    }
  }, [activeTab]); // Dependency array only needs activeTab now

  // Set document title based on active tab
  useEffect(() => {
    // Capitalize first letter of the active tab
    const capitalizedTab = activeTab.charAt(0).toUpperCase() + activeTab.slice(1);
    document.title = `${capitalizedTab} | Account Dashboard | Cursor for Non-Coders`;
  }, [activeTab]); // Re-run when activeTab changes

  // Fetch profile and subscription data
  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        setIsLoadingPageData(true);
        setIsLoadingSubscription(true);
        setError(null);

        try {
          // Fetch profile and subscription concurrently
          const [profileResponse, subscriptionResponse] = await Promise.all([
            apiClient.get<Profile>('/api/user/profile'),
            apiClient.get<SubscriptionDetails>('/api/user/subscription')
          ]);

          const fetchedProfile = profileResponse.data;
          const fetchedSubscription = subscriptionResponse.data;

          if (fetchedProfile) {
            setProfileData(fetchedProfile);
            // Set form fields based on profile data
            if (fetchedProfile.full_name) {
              const nameParts = fetchedProfile.full_name.split(' ');
              setFirstName(nameParts[0] || '');
              setLastName(nameParts.slice(1).join(' ') || '');
            } else {
              setFirstName('');
              setLastName('');
            }
            setNickname(fetchedProfile.nickname || '');
            
            // Set avatar color
            if (fetchedProfile.avatar_color) {
              setAvatarColor(fetchedProfile.avatar_color);
            } else {
              const defaultColorIndex = user.email ? user.email.charCodeAt(0) % avatarColors.length : 0;
              setAvatarColor(avatarColors[defaultColorIndex].value);
            }

            // Set email notification preferences
            if (fetchedProfile.email_preferences) {
               setEmailNotifications(fetchedProfile.email_preferences);
            } else {
              // Set default if not present
              setEmailNotifications({ contentUpdates: true, accountChanges: true, marketing: false });
            }
          } else {
             // Handle profile not found? Maybe set defaults or show error later
             console.warn("User profile data not found.");
             setProfileData(null);
          }

          if (fetchedSubscription) {
             setSubscriptionDetails(fetchedSubscription);
          } else {
             // Handle no active subscription found
             setSubscriptionDetails(null);
          }

        } catch (err: any) {
          console.error('Error fetching account data:', err);
          setError(err.response?.data?.error || err.message || 'Failed to load account details.');
          // Reset states on error
          setProfileData(null);
          setSubscriptionDetails(null);
        } finally {
          setIsLoadingPageData(false);
          setIsLoadingSubscription(false);
        }
      };
      
      fetchData();
    }
  }, [user]); // Rerun when user object changes
  
  // Remove the separate useEffect for subscription loading
  // useEffect(() => { ... });

  // Get initials from name
  const getInitials = () => {
    // Use profileData for nickname first
    if (profileData?.nickname) return profileData.nickname.substring(0, 2).toUpperCase();
    
    // Use state vars (derived from profileData or empty strings)
    const initials = [];
    if (firstName) initials.push(firstName[0]);
    if (lastName) initials.push(lastName[0]);
    
    if (initials.length > 0) {
      return initials.join('').toUpperCase();
    }
    
    // Fallback to user email from auth context
    return user?.email?.substring(0, 2).toUpperCase() || "U";
  };
  
  // Compute full name from state
  const computedFullName = `${firstName} ${lastName}`.trim();

  // Handle logout (no changes needed here)
  const handleLogout = async () => {
    try {
      setIsLoadingPageData(true);
      await signOut();
      navigate('/');
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setIsLoadingPageData(false);
    }
  };
  
  // Handle profile update
  const handleProfileUpdate = async (e: React.FormEvent) => { 
    e.preventDefault();
    setError(null); // Clear previous errors
    setSuccessMessage(null);

    // Frontend Validation
    if (!firstName.trim() || !lastName.trim()) {
      setError("Please enter both your first and last name.");
      setIsSavingProfile(false); // Ensure button is re-enabled
      return;
    }
    if (!nickname.trim()) {
      setError("Please enter a nickname.");
      setIsSavingProfile(false); // Ensure button is re-enabled
      return;
    }
    // No need to validate avatarColor on frontend as it has a default

    setIsSavingProfile(true);
    
    if (!user) return; // Should not happen if button is enabled

    const updatedProfileData: Partial<Profile> = {
        full_name: computedFullName, // Already trimmed
        nickname: nickname.trim(), // Send trimmed nickname
        avatar_color: avatarColor
    };
    
    try {
      console.log("Updating profile data via API...");
      const response = await apiClient.put<Profile>('/api/user/profile', updatedProfileData);
      
      // Update local state with response data
      setProfileData(response.data);
      setSuccessMessage("Profile updated successfully!");
      
      // Re-set form fields in case backend modified something (e.g., trimming)
      if (response.data.full_name) {
          const nameParts = response.data.full_name.split(' ');
          setFirstName(nameParts[0] || '');
          setLastName(nameParts.slice(1).join(' ') || '');
      }
      setNickname(response.data.nickname || '');
      setAvatarColor(response.data.avatar_color || avatarColors[0].value); // Fallback color

    } catch (err: any) {
      console.error("Error updating profile:", err);
      // Use the specific error from the backend if available, otherwise show generic
      setError(err.response?.data?.error || err.message || 'Failed to update profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !currentPassword) {
        setError("Please fill in both current and new passwords.");
        return;
    }
    if (newPassword !== confirmPassword) {
        setError("New passwords do not match.");
        return;
    }
    if (newPassword.length < 8) {
        setError("New password must be at least 8 characters long.");
        return;
    }

    setIsSavingPassword(true);
    setError(null);
    setSuccessMessage(null);

    try {
        await apiClient.put('/api/user/password', {
            currentPassword,
            newPassword
        });
        
        // Update success message and clear local state
        setSuccessMessage("Password updated successfully! Redirecting to sign in...");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");

        // Clear auth state via AuthProvider and redirect
        console.log('[AccountPage] Password change success. Calling clearAuthLocally...');
        clearAuthLocally(); // Call the function from context

        // Redirect immediately after clearing state
        navigate('/signin', { replace: true }); // Redirect cleanly
        // Remove setTimeout as redirection should happen after state clear
        /*
        setTimeout(() => {
          console.log('[AccountPage] Redirecting to signin...');
          navigate('/signin', { replace: true }); // Redirect cleanly
        }, 2500); // 2.5 seconds delay
        */

    } catch (err: any) {
        console.error("Error updating password:", err);
        setError(err.response?.data?.error || err.message || 'Failed to update password.');
    } finally {
        setIsSavingPassword(false);
    }
  };

  // Handle preferences update
  const handlePreferencesUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPreferences(true);
    setError(null);
    setSuccessMessage(null);

    try {
        await apiClient.put('/api/user/preferences', {
            preferences: emailNotifications
        });
        setSuccessMessage("Preferences updated successfully!");
    } catch (err: any) {
        console.error("Error updating preferences:", err);
        setError(err.response?.data?.error || err.message || 'Failed to update preferences.');
    } finally {
        setIsSavingPreferences(false);
    }
  };

  // Handle resend verification email (uses useAuth hook)
  const handleResendVerification = async () => {
    if (isResendingEmail) return;
    
    try {
      setIsResendingEmail(true);
      setError(null);
      setSuccessMessage(null); // Clear previous success message
      
      const { error: verificationError } = await sendVerificationEmail(); // Use the hook function
      
      if (verificationError) throw verificationError;
      
      setSuccessMessage("Verification email sent successfully. Please check your inbox.");
    } catch (err: any) {
      console.error("Error sending verification email:", err);
      setError(err.message || "Failed to send verification email");
    } finally {
      setIsResendingEmail(false);
    }
  };

  // --- Re-implement Helper Variables/Functions ---
  const isAdmin = user?.email === "admin@example.com"; // Example admin email

  const memberSince = user?.created_at 
    ? new Date(user.created_at).toLocaleDateString()
    : "N/A";

  const subscriptionTier = subscriptionDetails?.plan_name || profileData?.subscription_tier || "free";
  const subscriptionStatus = subscriptionDetails?.status || "inactive";
  
  // Use optional 'created' field, fallback to period end if needed for display
  const subscriptionStartDateTs = subscriptionDetails?.created;
  const subscriptionStartDate = subscriptionStartDateTs
    ? new Date(subscriptionStartDateTs * 1000).toLocaleDateString() // Assuming 'created' is Unix timestamp
    : "N/A";
    
  const subscriptionEndDate = subscriptionDetails?.current_period_end
    ? new Date(subscriptionDetails.current_period_end * 1000).toLocaleDateString() // Assuming timestamp
    : "N/A";

  const getSubscriptionDisplayName = () => {
    if (isAdmin) return "Admin";
    if (subscriptionTier === "free") return "Starter";
    // Basic check for common plan names, adjust as needed
    if (subscriptionTier.toLowerCase().includes('month')) return "Monthly"; 
    if (subscriptionTier.toLowerCase().includes('year')) return "Yearly";
    // Fallback to plan name or capitalize tier
    return subscriptionDetails?.plan_name || (subscriptionTier.charAt(0).toUpperCase() + subscriptionTier.slice(1));
  };

  const getSubscriptionBadgeClass = () => {
    if (isAdmin) return "bg-purple-600 hover:bg-purple-700 text-white";
    const tierLower = subscriptionTier.toLowerCase();
    if (tierLower === 'free' || subscriptionStatus === 'inactive') return "bg-secondary text-secondary-foreground";
    // Add classes based on your plan names/tiers
    if (tierLower.includes('month')) return "bg-blue-600 text-white"; 
    if (tierLower.includes('year')) return "bg-green-600 text-white";
    return "bg-primary text-primary-foreground"; // Default premium badge
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="Account Settings | Cursor for Non-Coders"
        description="Manage your account settings, subscription, and preferences."
        canonicalPath="/account"
      />
      
      <Navbar />
      <div className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Account Settings</h1>
        
        {/* Email Verification Notice */}
        {user && !isEmailVerified && (
            <Alert 
              variant="default" 
              className="mb-6 border-yellow-500/50 bg-yellow-50 text-yellow-900 dark:border-yellow-500/60 dark:bg-yellow-950 dark:text-yellow-300"
            >
                <Mail className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                <AlertTitle>Verify Your Email Address</AlertTitle>
                <AlertDescription className="flex justify-between items-center">
                  Please check your inbox for a verification link. If you didn't receive it, you can resend the email.
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={handleResendVerification}
                    disabled={isResendingEmail}
                  >
                    {isResendingEmail ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin"/>
                    ) : null}
                    Resend Email
                  </Button>
                </AlertDescription>
            </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
          <TabsList className="flex flex-wrap w-full h-auto justify-start p-0 bg-transparent dark:bg-transparent rounded-none">
            <TabsTrigger 
              value="profile" 
              className="flex-grow w-1/2 sm:w-auto sm:flex-grow-0 flex items-center justify-center gap-2 data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:shadow-none rounded-md sm:rounded-t-md sm:rounded-b-none px-3 py-1.5 text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 transition-all"
            >
              <UserIcon className="h-4 w-4" />Profile
            </TabsTrigger>
            <TabsTrigger 
              value="security" 
              className="flex-grow w-1/2 sm:w-auto sm:flex-grow-0 flex items-center justify-center gap-2 data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:shadow-none rounded-md sm:rounded-t-md sm:rounded-b-none px-3 py-1.5 text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 transition-all"
            >
              <Shield className="h-4 w-4" />Security
            </TabsTrigger>
            <TabsTrigger 
              value="subscription" 
              className="flex-grow w-1/2 sm:w-auto sm:flex-grow-0 flex items-center justify-center gap-2 data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:shadow-none rounded-md sm:rounded-b-md sm:rounded-t-none px-3 py-1.5 text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 transition-all"
            >
              <CreditCard className="h-4 w-4" />Subscription
            </TabsTrigger>
            <TabsTrigger 
              value="preferences" 
              className="flex-grow w-1/2 sm:w-auto sm:flex-grow-0 flex items-center justify-center gap-2 data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:shadow-none rounded-md sm:rounded-b-md sm:rounded-t-none px-3 py-1.5 text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 transition-all"
            >
              <Settings className="h-4 w-4" />Preferences
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */} 
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal details.</CardDescription>
              </CardHeader>
              <form onSubmit={handleProfileUpdate}>
                <CardContent className="space-y-6">
                  {/* Avatar and basic info display */} 
                  <div className="flex flex-col items-center">
                    <Avatar className="h-24 w-24 mb-4">
                      <AvatarImage src={profileData?.avatar_url || undefined} alt={computedFullName} />
                      <AvatarFallback className={`text-xl ${avatarColor}`}>
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <CardTitle className="text-center">{computedFullName || 'User'}</CardTitle>
                    <CardDescription className="text-center text-muted-foreground mt-1">
                      {user?.email}
                    </CardDescription>
                    <Badge variant="outline" className={`mt-2 ${getSubscriptionBadgeClass()}`}>
                      {isAdmin ? "Admin Access" : getSubscriptionDisplayName()}
                    </Badge>
                  </div>
                  <Separator />
                  
                  {/* Form fields */} 
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nickname">Nickname</Label>
                    <Input id="nickname" value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="How you appear in comments, etc." required />
                  </div>
                  
                  {/* Avatar Color Picker */} 
                  <div className="space-y-2">
                    <Label>Avatar Color</Label>
                    <div className="flex flex-wrap gap-2">
                      {avatarColors.map(color => (
                        <TooltipProvider key={color.value} delayDuration={100}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className={`h-8 w-8 rounded-full p-0 ${color.value} ${avatarColor === color.value ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}
                                onClick={() => setAvatarColor(color.value)}
                              >
                                {avatarColor === color.value && <CheckCircle className="h-4 w-4 text-white mix-blend-difference"/>}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {color.name}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ))}
                    </div>
                  </div>
                  
                  {/* Display Member Since / Subscription Dates */}
                   <div className="space-y-2 text-sm text-muted-foreground">
                     <p>Member since: {memberSince}</p>
                     {subscriptionDetails && subscriptionStatus !== 'inactive' && (
                        <p>Subscription active since: {subscriptionStartDate}</p>
                     )}
                     {subscriptionDetails && subscriptionDetails.cancel_at_period_end && (
                        <p className="text-orange-600 dark:text-orange-400">Subscription scheduled to cancel on: {subscriptionEndDate}</p>
                     )}
                     {subscriptionDetails && !subscriptionDetails.cancel_at_period_end && subscriptionStatus === 'active' && (
                         <p>Next billing date: {subscriptionEndDate}</p>
                     )}
                   </div>

                </CardContent>
                <CardFooter className="border-t px-6 py-4 flex-col items-start">
                  <FormFeedback error={error} successMessage={successMessage} />
                  <Button type="submit" disabled={isSavingProfile}>
                    {isSavingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} 
                    Save Changes
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          {/* Security Tab */} 
          <TabsContent value="security">
             <Card>
                <CardHeader>
                    <CardTitle>Password Settings</CardTitle>
                    <CardDescription>Change your account password.</CardDescription>
                </CardHeader>
                <form onSubmit={handlePasswordChange}>
                    <CardContent className="space-y-4">
                        {/* Current Password */}
                        <div className="space-y-2">
                           <Label htmlFor="currentPassword">Current Password</Label>
                           <div className="relative">
                              <Input 
                                id="currentPassword" 
                                type={showCurrentPassword ? "text" : "password"} 
                                value={currentPassword} 
                                onChange={(e) => setCurrentPassword(e.target.value)} 
                                required 
                                autoComplete="current-password"
                                className="pr-10" 
                              />
                              <Button 
                                type="button" 
                                variant="ghost" 
                                size="sm" 
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 px-0" 
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                              >
                                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                           </div>
                        </div>
                        
                        {/* New Password */}
                        <div className="space-y-2">
                           <Label htmlFor="newPassword">New Password</Label>
                           <div className="relative">
                             <Input 
                               id="newPassword" 
                               type={showNewPassword ? "text" : "password"} 
                               value={newPassword} 
                               onChange={(e) => setNewPassword(e.target.value)} 
                               required 
                               minLength={8}
                               autoComplete="new-password"
                               className="pr-10" 
                             />
                             <Button 
                               type="button" 
                               variant="ghost" 
                               size="sm" 
                               className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 px-0" 
                               onClick={() => setShowNewPassword(!showNewPassword)}
                               aria-label={showNewPassword ? "Hide password" : "Show password"}
                             >
                               {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                             </Button>
                           </div>
                           <p className="text-xs text-muted-foreground">Minimum 8 characters</p>
                        </div>
                        
                        {/* Confirm New Password */}
                        <div className="space-y-2">
                           <Label htmlFor="confirmPassword">Confirm New Password</Label>
                           <div className="relative">
                              <Input 
                                id="confirmPassword" 
                                type={showConfirmPassword ? "text" : "password"} 
                                value={confirmPassword} 
                                onChange={(e) => setConfirmPassword(e.target.value)} 
                                required 
                                autoComplete="new-password"
                                className="pr-10" 
                              />
                              <Button 
                                type="button" 
                                variant="ghost" 
                                size="sm" 
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 px-0" 
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                              >
                                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                           </div>
                        </div>
                    </CardContent>
                    <CardFooter className="border-t px-6 py-4 flex-col items-start">
                        <FormFeedback error={error} successMessage={successMessage} />
                        <Button type="submit" disabled={isSavingPassword || !currentPassword || !newPassword || !confirmPassword}>
                           {isSavingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} 
                           Update Password
                        </Button>
                    </CardFooter>
                </form>
             </Card>
          </TabsContent>

          {/* Subscription Tab */} 
          <TabsContent value="subscription" id="subscription-section">
            <Card>
              <CardHeader>
                <CardTitle>Subscription</CardTitle>
                <CardDescription>Manage your plan and billing details.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {isLoadingSubscription ? (
                  <div className="flex items-center justify-center py-8">
                     <Loader2 className="h-6 w-6 animate-spin mr-2" />
                     <span>Loading subscription details...</span>
                  </div>
                ) : subscriptionDetails ? (
                  // Display existing subscription details
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Your Current Plan</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-md bg-muted/30">
                       <div>
                         <p className="text-sm text-muted-foreground">Plan</p>
                         <div className="font-medium flex items-center">
                            <Badge 
                               variant="default"
                               className={`mr-2 ${getSubscriptionBadgeClass()}`}
                            >
                               {getSubscriptionDisplayName()}
                            </Badge>
                         </div>
                       </div>
                       <div>
                         <p className="text-sm text-muted-foreground">Status</p>
                         <p className={`font-medium capitalize ${subscriptionDetails.status === 'active' ? 'text-green-600' : 'text-yellow-600'}`}>
                           {subscriptionDetails.status}
                         </p>
                       </div>
                       <div>
                         <p className="text-sm text-muted-foreground">Next Billing Date</p>
                         <p className="font-medium">{subscriptionEndDate}</p>
                       </div>
                       {subscriptionDetails.cancel_at_period_end && (
                         <div>
                           <p className="text-sm text-muted-foreground">Subscription Ends</p>
                           <p className="font-medium text-orange-600">{subscriptionEndDate} (Cancellation Pending)</p>
                         </div>
                       )}
                    </div>
                    <div className="mt-6">
                       <StripeManageSubscriptionButton />
                    </div>
                  </div>
                ) : (
                  // Show options to subscribe
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Choose a Plan</h3>
                    {/* Display Free Tier status if no active subscription */}
                    <Alert className="mb-6 bg-blue-50 dark:bg-blue-950 border-blue-300 dark:border-blue-700">
                        <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <AlertTitle>You are currently on the Free Tier</AlertTitle>
                        <AlertDescription>
                            You have access to <Link to="/dashboard" className="font-medium text-blue-700 dark:text-blue-300 hover:underline">Module 1</Link>. Upgrade to unlock all content.
                        </AlertDescription>
                    </Alert>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Monthly Plan Card */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Monthly Plan</CardTitle>
                          <CardDescription>$4.99 / month</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
                            <li>Full access to all modules</li>
                            <li>Online viewing only</li>
                            <li>Progress Tracking</li>
                            <li>Future updates included</li>
                          </ul>
                        </CardContent>
                        <CardFooter>
                          <StripePaymentForm planId={STRIPE_PLANS.MONTHLY} buttonText="Choose Monthly" />
                        </CardFooter>
                      </Card>
                      
                      {/* Yearly Plan Card */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Yearly Plan</CardTitle>
                          <CardDescription>$44.99 / year (Save ~25%)</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
                            <li>Access to all modules</li>
                            <li>PDF downloads available</li>
                            <li>Community Access</li>
                            <li>Future updates included</li>
                          </ul>
                        </CardContent>
                        <CardFooter>
                           <StripePaymentForm planId={STRIPE_PLANS.ANNUAL} buttonText="Choose Yearly" />
                        </CardFooter>
                      </Card>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences Tab */} 
          <TabsContent value="preferences">
            <Card>
                <CardHeader>
                    <CardTitle>Preferences</CardTitle>
                    <CardDescription>Manage your notification and theme settings.</CardDescription>
                </CardHeader>
                <form onSubmit={handlePreferencesUpdate}>
                    <CardContent className="space-y-6">
                        {/* Email Notifications */} 
                        <div>
                            <h3 className="text-lg font-medium mb-3">Email Notifications</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 border rounded-md">
                                    <Label htmlFor="contentUpdates" className="font-normal flex-grow mr-4">
                                       New Content & Updates <span className="block text-xs text-muted-foreground">Get notified about new modules, sections, or major course updates.</span>
                                    </Label>
                                    <Switch 
                                        id="contentUpdates" 
                                        checked={emailNotifications.contentUpdates} 
                                        onCheckedChange={(checked: boolean) => setEmailNotifications(prev => ({...prev, contentUpdates: checked}))} 
                                    />
                                </div>
                                <div className="flex items-center justify-between p-3 border rounded-md">
                                     <Label htmlFor="accountChanges" className="font-normal flex-grow mr-4">
                                       Account Security & Changes <span className="block text-xs text-muted-foreground">Receive alerts for password changes, logins from new devices, etc.</span>
                                    </Label>
                                    <Switch 
                                        id="accountChanges" 
                                        checked={emailNotifications.accountChanges} 
                                        onCheckedChange={(checked: boolean) => setEmailNotifications(prev => ({...prev, accountChanges: checked}))} 
                                    />
                                </div>
                                 <div className="flex items-center justify-between p-3 border rounded-md">
                                     <Label htmlFor="marketing" className="font-normal flex-grow mr-4">
                                       Marketing & Promotions <span className="block text-xs text-muted-foreground">Receive occasional special offers or news about related products.</span>
                                    </Label>
                                    <Switch 
                                        id="marketing" 
                                        checked={emailNotifications.marketing} 
                                        onCheckedChange={(checked: boolean) => setEmailNotifications(prev => ({...prev, marketing: checked}))} 
                                    />
                                </div>
                            </div>
                        </div>
                        
                        {/* Moved Save Button and Feedback Here */}
                        <div className="pt-4"> {/* Add some padding top */}
                          <FormFeedback error={error} successMessage={successMessage} />
                          <Button type="submit" disabled={isSavingPreferences}>
                            {isSavingPreferences && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} 
                            Save Preferences
                          </Button>
                        </div>

                        <Separator />
                        
                        {/* Theme Settings */} 
                        <div>
                            <h3 className="text-lg font-medium mb-3">Theme</h3>
                             <Select onValueChange={setTheme} value={theme}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Select theme" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="light"><Sun className="h-4 w-4 mr-2 inline-block"/> Light</SelectItem>
                                    <SelectItem value="dark"><Moon className="h-4 w-4 mr-2 inline-block"/> Dark</SelectItem>
                                    <SelectItem value="system"><MonitorSmartphone className="h-4 w-4 mr-2 inline-block"/> System</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-sm text-muted-foreground mt-2">Current theme: {resolvedTheme}</p>
                        </div>

                    </CardContent>
                 </form>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Logout Button */} 
        <Card className="mt-8">
            <CardHeader>
                 <CardTitle>Logout</CardTitle>
                 <CardDescription>Sign out of your account.</CardDescription>
            </CardHeader>
             <CardFooter>
                <Button variant="destructive" onClick={handleLogout} disabled={isLoadingPageData}>
                    <LogOut className="h-4 w-4 mr-2" />
                    {isLoadingPageData ? "Logging out..." : "Logout"}
                </Button>
            </CardFooter>
        </Card>

      </div>
      <Footer />
    </div>
  );
} 