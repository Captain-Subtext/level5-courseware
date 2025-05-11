import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, 
  Settings, 
  Shield, 
  Mail, 
  Globe, 
  Save, 
  Trash2,
  Loader2,
  RefreshCw,
  Users,
  BellRing,
  MegaphoneIcon
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import apiClient from '@/lib/apiClient';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Add this interface to track Brevo sync status
interface BrevoSyncState {
  isSyncing: boolean;
  filter: 'all' | 'new' | 'marketing' | 'content';
  results: {
    count: number;
    successCount: number;
    message: string;
  } | null;
  error: string | null;
}

interface SystemSettings {
  siteName: string;
  contactEmail: string;
  enableNotifications: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
  enableLogging: boolean;
  defaultLang: string;
}

export default function AdminSettings() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [initialSettings, setInitialSettings] = useState<SystemSettings | null>(null);
  const [settings, setSettings] = useState<SystemSettings>({
    siteName: 'Cursor Learning Platform',
    contactEmail: '',
    enableNotifications: true,
    sessionTimeout: 60,
    maxLoginAttempts: 5,
    enableLogging: true,
    defaultLang: 'en'
  });
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  
  // Add state for Brevo sync
  const [brevoSync, setBrevoSync] = useState<BrevoSyncState>({
    isSyncing: false,
    filter: 'all',
    results: null,
    error: null
  });
  
  // Fetch settings on component mount
  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }
    fetchSettingsAndCsrfToken();
  }, [isAdmin, navigate]);
  
  // Combined function to fetch settings and CSRF token
  async function fetchSettingsAndCsrfToken() {
    setIsLoading(true);
    try {
      // --- Fetch Settings using Supabase client (Restored Logic) ---
      const settingsKeys = [
        'site_name', 'contact_email', 'enable_notifications', 
        'session_timeout', 'max_login_attempts', 'enable_logging', 'default_lang'
      ];
      const { data: settingsData, error: settingsError } = await supabase
        .from('config')
        .select('key, value')
        .in('key', settingsKeys);

      if (settingsError) throw settingsError;

      // Parse settings (same logic as original)
      if (settingsData && settingsData.length > 0) {
         const loadedSettings: Partial<SystemSettings> = {};
         const defaultSettings = {
             siteName: 'Cursor Learning Platform', contactEmail: '', enableNotifications: true,
             sessionTimeout: 60, maxLoginAttempts: 5, enableLogging: true, defaultLang: 'en'
         };
         settingsData.forEach((item: { key: string; value: any }) => {
             switch(item.key) {
                 case 'site_name': loadedSettings.siteName = item.value; break;
                 case 'contact_email': loadedSettings.contactEmail = item.value; break;
                 case 'enable_notifications': loadedSettings.enableNotifications = item.value === 'true'; break;
                 case 'session_timeout': loadedSettings.sessionTimeout = parseInt(item.value) || 60; break;
                 case 'max_login_attempts': loadedSettings.maxLoginAttempts = parseInt(item.value) || 5; break;
                 case 'enable_logging': loadedSettings.enableLogging = item.value === 'true'; break;
                 case 'default_lang': loadedSettings.defaultLang = item.value; break;
             }
         });
         const fullSettings = { ...defaultSettings, ...loadedSettings };
         setSettings(fullSettings as SystemSettings);
         setInitialSettings(fullSettings as SystemSettings);
      }
      // --- End Settings Fetch ---

      // --- Fetch CSRF Token via dedicated endpoint ---
      try {
        const csrfResponse = await apiClient.get('/api/config/csrf-token');
        
        // Get token from response header
        const tokenFromHeader = csrfResponse.headers['x-csrf-token-value'];
        
        if (tokenFromHeader) {
          console.log("CSRF token received from header");
          setCsrfToken(tokenFromHeader);
        } else {
          console.warn('CSRF token header not found in response from /api/config/csrf-token');
          toast({ 
            title: 'Warning', 
            description: 'Could not retrieve security token. Some actions may not work.', 
            variant: 'destructive' 
          });
        }
      } catch (csrfError) {
        console.error('Error fetching CSRF token:', csrfError);
        toast({ 
          title: 'Warning', 
          description: 'Could not retrieve security token. Some actions may not work.', 
          variant: 'destructive' 
        });
      }
      // --- End CSRF Token Fetch ---

    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: 'Error Loading Settings',
        description: error instanceof Error ? error.message : 'Failed to load settings.',
        variant: 'destructive'
      });
       // Reset to defaults or handle error state appropriately
       setSettings({
           siteName: 'Cursor Learning Platform', contactEmail: '', enableNotifications: true,
           sessionTimeout: 60, maxLoginAttempts: 5, enableLogging: true, defaultLang: 'en'
       });
       setInitialSettings({
           siteName: 'Cursor Learning Platform', contactEmail: '', enableNotifications: true,
           sessionTimeout: 60, maxLoginAttempts: 5, enableLogging: true, defaultLang: 'en'
       });
    } finally {
      setIsLoading(false);
    }
  }
  
  // Handle settings changes
  function handleSettingChange<K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  }
  
  // Save only changed settings - Include CSRF token from state
  async function saveSettings() {
     if (!initialSettings) { 
       toast({ title: 'Error', description: 'Initial settings not loaded.', variant: 'destructive' });
       return; 
     }
     // Check for CSRF token obtained during page load
     if (!csrfToken) {
        toast({ title: 'Error', description: 'CSRF token not available. Cannot save settings. Please reload the page.', variant: 'destructive' });
        setIsSaving(false); // Ensure saving state is reset
        return;
     }

    setIsSaving(true);
    const changedSettingsPayload: { key: string; value: string }[] = [];
    // Determine changed settings (same logic)
    (Object.keys(settings) as Array<keyof SystemSettings>).forEach(key => {
      if (settings[key] !== initialSettings[key]) {
        let dbKey = ''; let dbValue = '';
        switch(key) {
            case 'siteName': dbKey = 'site_name'; dbValue = String(settings[key]); break;
            case 'contactEmail': dbKey = 'contact_email'; dbValue = String(settings[key]); break;
            case 'enableNotifications': dbKey = 'enable_notifications'; dbValue = String(settings[key]); break;
            case 'sessionTimeout': dbKey = 'session_timeout'; dbValue = String(settings[key]); break;
            case 'maxLoginAttempts': dbKey = 'max_login_attempts'; dbValue = String(settings[key]); break;
            case 'enableLogging': dbKey = 'enable_logging'; dbValue = String(settings[key]); break;
            case 'defaultLang': dbKey = 'default_lang'; dbValue = String(settings[key]); break;
        }
        if (dbKey) { changedSettingsPayload.push({ key: dbKey, value: String(dbValue) }); }
      }
    });

    if (changedSettingsPayload.length === 0) { 
        toast({ title: 'No Changes', description: 'No settings were modified.' });
        setIsSaving(false); 
        return; 
    }

    console.log("Settings to save via API:", changedSettingsPayload);
    console.log("Using CSRF token:", csrfToken);
    
    try {
      // Get session/token again right before saving
      const sessionData = await supabase.auth.getSession();
      const accessToken = sessionData?.data?.session?.access_token;
      if (!accessToken) { throw new Error('Authentication token not found. Please log in again.'); }

      // Call the PUT endpoint with Auth and CSRF headers
      const response = await fetch('/api/admin/config/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'x-csrf-token-header': csrfToken // Use the token from state
        },
        body: JSON.stringify({ settings: changedSettingsPayload })
      });

      // Get the new CSRF token from the response header for the *next* save action
      const newToken = response.headers.get('x-csrf-token-value');
      if (newToken) { 
          console.log("Received new CSRF token after save:", newToken);
          setCsrfToken(newToken); 
      } else {
          console.warn("CSRF token header not found in PUT response. Subsequent saves might fail without page reload.");
          // Keep the old token for now, but warn the user or force reload on next save?
      }

      if (!response.ok) {
          const errorData = await response.json().catch(() => ({})); 
          // If CSRF fails specifically, provide a clearer message
          if (response.status === 403 && (errorData?.error?.includes('CSRF') || response.statusText.includes('Forbidden'))) {
               throw new Error('CSRF validation failed. Please reload the page and try again.');
          }
          throw new Error(errorData?.error || `API Error: ${response.statusText} (${response.status})`);
      }
      
      const result = await response.json();
      console.log("API save result:", result);
      
      // Update initialSettings state ONLY on successful save
      setInitialSettings(settings); 

      toast({
        title: 'Settings Saved',
        description: 'Your changes have been saved successfully.'
      });
      
    } catch (error) { 
       console.error('Error saving settings via API:', error);
       toast({ 
           title: 'Error Saving Settings', 
           description: error instanceof Error ? error.message : 'An unknown error occurred.', 
           variant: 'destructive' 
        });
    } finally {
      setIsSaving(false);
    }
  }
  
  // Function to reset settings to defaults (can remain the same, potentially refetch after reset)
  function resetToDefaults() {
    const defaultSettings = {
        siteName: 'Cursor Learning Platform',
        contactEmail: process.env.REACT_APP_DEFAULT_CONTACT_EMAIL || '', // Use env var if available
        enableNotifications: true,
        sessionTimeout: 60,
        maxLoginAttempts: 5,
        enableLogging: true,
        defaultLang: 'en'
      };
    setSettings(defaultSettings);
    toast({ title: 'Settings Reset', description: 'Settings reset to default values. Click Save to apply.'}) 
  }

  // Calculate if changes exist for disabling save button
  const hasChanges = JSON.stringify(settings) !== JSON.stringify(initialSettings);

  // Add this function to sync contacts with Brevo
  async function syncBrevoContacts(filter: BrevoSyncState['filter']) {
    // Reset previous results and set syncing state
    setBrevoSync(prev => ({
      ...prev,
      isSyncing: true,
      filter,
      results: null,
      error: null
    }));

    // Check if CSRF token is available
    if (!csrfToken) {
      console.warn("No CSRF token available for Brevo sync");
      // Try to fetch a fresh token
      try {
        const csrfResponse = await apiClient.get('/api/config/csrf-token');
        const tokenFromHeader = csrfResponse.headers['x-csrf-token-value'];
        if (tokenFromHeader) {
          setCsrfToken(tokenFromHeader);
        } else {
          throw new Error('Could not retrieve CSRF token');
        }
      } catch (csrfError) {
        setBrevoSync(prev => ({
          ...prev,
          isSyncing: false,
          error: 'CSRF token not available. Please refresh the page and try again.'
        }));
        toast({
          title: 'Sync Failed',
          description: 'Security token not available. Please refresh the page and try again.',
          variant: 'destructive'
        });
        return;
      }
    }

    try {
      // Include the CSRF token in the request headers
      const response = await apiClient.post('/api/admin/sync-brevo-contacts', 
        { filter },
        { 
          headers: { 
            'X-CSRF-Token-Header': csrfToken 
          }
        }
      );
      
      // Update state with results
      setBrevoSync(prev => ({
        ...prev,
        isSyncing: false,
        results: response.data,
        error: null
      }));

      // Show success toast
      toast({
        title: 'Brevo Sync Complete',
        description: `Successfully synced ${response.data.successCount} out of ${response.data.count} users.`
      });
    } catch (error: any) {
      console.error('Error syncing contacts with Brevo:', error);
      
      setBrevoSync(prev => ({
        ...prev,
        isSyncing: false,
        results: null,
        error: error.response?.data?.error || error.message || 'Failed to sync contacts with Brevo'
      }));

      toast({
        title: 'Brevo Sync Failed',
        description: error.response?.data?.error || error.message || 'Failed to sync contacts with Brevo',
        variant: 'destructive'
      });
    }
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Access Denied</CardTitle>
            </CardHeader>
            <CardContent>
              <p>You do not have permission to access the admin settings.</p>
              <Button 
                onClick={() => navigate('/dashboard')} 
                className="mt-4"
              >
                Return to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button 
            variant="ghost" 
            className="mb-2 p-0" 
            onClick={() => navigate('/admin')}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Admin Dashboard
          </Button>
          <h1 className="text-3xl font-bold">Admin Settings</h1>
          <p className="text-muted-foreground">
            Configure advanced system settings and preferences
          </p>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin h-6 w-6 border-2 border-primary rounded-full border-t-transparent" />
            <span className="ml-2">Loading settings...</span>
          </div>
        ) : (
          <>
            <div className="flex justify-end mb-4">
              <div className="space-x-2">
                <Button
                  variant="outline"
                  onClick={resetToDefaults}
                  className="border-destructive text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Reset to Defaults
                </Button>
                <Button
                  onClick={saveSettings}
                  disabled={!hasChanges || isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            <Tabs defaultValue="general">
              <TabsList className="mb-4">
                <TabsTrigger value="general">
                  <Settings className="h-4 w-4 mr-2" />
                  General
                </TabsTrigger>
                <TabsTrigger value="security">
                  <Shield className="h-4 w-4 mr-2" />
                  Security
                </TabsTrigger>
                <TabsTrigger value="notifications">
                  <Mail className="h-4 w-4 mr-2" />
                  Notifications
                </TabsTrigger>
                <TabsTrigger value="localization">
                  <Globe className="h-4 w-4 mr-2" />
                  Localization
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="general" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>General Settings</CardTitle>
                    <CardDescription>
                      Basic configuration for your learning platform
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="siteName">Site Name</Label>
                      <Input
                        id="siteName"
                        value={settings.siteName}
                        onChange={(e) => handleSettingChange('siteName', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactEmail">Contact Email</Label>
                      <Input
                        id="contactEmail"
                        type="email"
                        value={settings.contactEmail}
                        onChange={(e) => handleSettingChange('contactEmail', e.target.value)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="security" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Security Settings</CardTitle>
                    <CardDescription>
                      Configure security options and protections
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                      <Input
                        id="sessionTimeout"
                        type="number"
                        value={settings.sessionTimeout}
                        onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value) || 60)}
                        min={15}
                        max={1440}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                      <Input
                        id="maxLoginAttempts"
                        type="number"
                        value={settings.maxLoginAttempts}
                        onChange={(e) => handleSettingChange('maxLoginAttempts', parseInt(e.target.value) || 5)}
                        min={3}
                        max={10}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="enableLogging">Enable Security Logging</Label>
                        <p className="text-sm text-muted-foreground">
                          Log user access and security events
                        </p>
                      </div>
                      <Switch
                        id="enableLogging"
                        checked={settings.enableLogging}
                        onCheckedChange={(checked) => handleSettingChange('enableLogging', checked)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="notifications" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Notification Settings</CardTitle>
                    <CardDescription>
                      Configure email notification preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="enableNotifications">Enable Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Allow the system to send automated email notifications
                        </p>
                      </div>
                      <Switch
                        id="enableNotifications"
                        checked={settings.enableNotifications}
                        onCheckedChange={(checked) => handleSettingChange('enableNotifications', checked)}
                      />
                    </div>
                  </CardContent>
                </Card>
                
                {/* Brevo Email Integration Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Brevo Email Integration</CardTitle>
                    <CardDescription>
                      Synchronize users with Brevo for email campaigns and notifications
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {brevoSync.error && (
                      <Alert variant="destructive" className="mb-4">
                        <AlertTitle>Sync Failed</AlertTitle>
                        <AlertDescription>{brevoSync.error}</AlertDescription>
                      </Alert>
                    )}
                    
                    {brevoSync.results && (
                      <Alert variant="default" className="mb-4 border-green-500 bg-green-50 text-green-900 dark:bg-green-950 dark:border-green-500 dark:text-green-400">
                        <AlertTitle>Sync Complete</AlertTitle>
                        <AlertDescription>
                          {brevoSync.results.message}
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    <p className="text-sm text-muted-foreground mb-4">
                      Use these controls to manually synchronize users with Brevo contact lists.
                      This enables sending marketing emails and automated notifications based on user preferences.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader className="p-4">
                          <CardTitle className="text-base flex items-center">
                            <Users className="h-4 w-4 mr-2" />
                            All Users
                          </CardTitle>
                        </CardHeader>
                        <CardFooter className="p-4 pt-0">
                          <Button 
                            onClick={() => syncBrevoContacts('all')} 
                            disabled={brevoSync.isSyncing}
                            className="w-full"
                          >
                            {brevoSync.isSyncing && brevoSync.filter === 'all' ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <RefreshCw className="h-4 w-4 mr-2" />
                            )}
                            Sync All Users
                          </Button>
                        </CardFooter>
                      </Card>
                      
                      <Card>
                        <CardHeader className="p-4">
                          <CardTitle className="text-base flex items-center">
                            <Users className="h-4 w-4 mr-2" />
                            New Users (Last 24h)
                          </CardTitle>
                        </CardHeader>
                        <CardFooter className="p-4 pt-0">
                          <Button 
                            onClick={() => syncBrevoContacts('new')} 
                            disabled={brevoSync.isSyncing}
                            className="w-full"
                          >
                            {brevoSync.isSyncing && brevoSync.filter === 'new' ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <RefreshCw className="h-4 w-4 mr-2" />
                            )}
                            Sync New Users
                          </Button>
                        </CardFooter>
                      </Card>
                      

                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="localization" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Localization Settings</CardTitle>
                    <CardDescription>
                      Configure language and regional settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="defaultLang">Default Language</Label>
                      <select
                        id="defaultLang"
                        value={settings.defaultLang}
                        onChange={(e) => handleSettingChange('defaultLang', e.target.value)}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                        <option value="ja">Japanese</option>
                      </select>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
} 