import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/lib/apiClient';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/lib/auth';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  LineChart, 
  FileText, 
  Settings, 
  BookOpen,
  Loader2,
  Download,
  ShieldCheck,
  Megaphone
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';

interface Metrics {
  totalUsers: number;
  activeUsers: number;
  premiumUsers: number;
  totalContent: number;
}

interface PublicConfig {
  maintenanceMode: boolean;
  announcementBannerEnabled: boolean;
  announcementBannerText: string;
}

export default function AdminDashboard() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<Metrics>({
    totalUsers: 0,
    activeUsers: 0,
    premiumUsers: 0,
    totalContent: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [isUpdatingMaintenance, setIsUpdatingMaintenance] = useState(false);
  const [bannerEnabled, setBannerEnabled] = useState(false);
  const [bannerText, setBannerText] = useState('');
  const [initialBannerEnabled, setInitialBannerEnabled] = useState(false);
  const [initialBannerText, setInitialBannerText] = useState('');
  const [isBannerLoading, setIsBannerLoading] = useState(true);
  const [isBannerSaving, setIsBannerSaving] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }
    
    fetchDashboardDataAndSetInitial();
  }, [isAdmin, navigate]);
  
  async function fetchDashboardDataAndSetInitial() {
    setIsLoading(true);
    setIsBannerLoading(true);
    try {
      const [metricsResponse, configResponse] = await Promise.all([
        apiClient.get<Metrics>('/api/admin/dashboard-metrics'),
        apiClient.get<PublicConfig>('/api/config/public')
      ]);

      setMetrics(metricsResponse.data);
      
      setMaintenanceMode(configResponse.data.maintenanceMode);
      
      setBannerEnabled(configResponse.data.announcementBannerEnabled);
      setBannerText(configResponse.data.announcementBannerText);
      setInitialBannerEnabled(configResponse.data.announcementBannerEnabled);
      setInitialBannerText(configResponse.data.announcementBannerText);

    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      const errorMsg = err.response?.data?.error || 'Failed to load dashboard data.';
      toast({ title: 'Error Loading Data', description: errorMsg, variant: 'destructive' });
      setMetrics({ totalUsers: 0, activeUsers: 0, premiumUsers: 0, totalContent: 0 });
      setBannerEnabled(false);
      setBannerText('');
      setInitialBannerEnabled(false);
      setInitialBannerText('');
    } finally {
      setIsLoading(false);
      setIsBannerLoading(false);
    }
  }
  
  const toggleMaintenanceMode = async (enable: boolean) => {
    setIsUpdatingMaintenance(true);
    try {
      console.log("Toggling maintenance mode via API:", enable);
      const response = await apiClient.put('/api/admin/config/maintenance', { enable });

      if (response.data.success) {
        setMaintenanceMode(response.data.maintenanceMode);
        toast({
          title: enable ? 'Maintenance Mode Enabled' : 'Maintenance Mode Disabled',
          description: enable 
            ? 'The site is now in maintenance mode. Only admins can access it.'
            : 'The site is now accessible to all users.',
        });
        sessionStorage.setItem('maintenance_mode', enable ? 'true' : 'false');
      } else {
        throw new Error(response.data.message || 'API returned unsuccessful status');
      }
    } catch (err: any) {
      console.error('Error toggling maintenance mode:', err);
      const errorMsg = err.response?.data?.error || 'Failed to update maintenance mode. Please try again.';
      toast({ title: 'Error', description: errorMsg, variant: 'destructive' });
    } finally {
      setIsUpdatingMaintenance(false);
    }
  };
  
  const handleSaveBanner = async () => {
    setIsBannerSaving(true);
    const payload = { enabled: bannerEnabled, text: bannerText };
    console.log("Saving banner settings:", payload);

    try {
        const promise = apiClient.put('/api/admin/config/banner', payload);
        
        toast({
            title: 'Saving Banner Settings...',
            description: 'Please wait while the settings are updated.',
        });

        const response = await promise;
        
        if (response.status === 200 && response.data.success) {
             toast({
                title: 'Banner Settings Saved',
                description: 'Announcement banner settings updated successfully.',
            });
            setInitialBannerEnabled(bannerEnabled);
            setInitialBannerText(bannerText);
        } else {
            throw new Error(response.data.error || 'Failed to save banner settings.');
        }

    } catch (err: any) {
        console.error('Error saving banner settings:', err);
        const errorMsg = err.response?.data?.error || err.message || 'An unexpected error occurred.';
         toast({
            title: 'Error Saving Banner',
            description: errorMsg,
            variant: 'destructive',
        });
    } finally {
        setIsBannerSaving(false);
    }
  };
  
  const createDatabaseBackup = async () => {
    setIsBackingUp(true);
    try {
      const response = await apiClient.get('/api/admin/backup/content', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const contentDisposition = response.headers['content-disposition'];
      let filename = `content-backup-${new Date().toISOString()}.json`; 
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
        if (filenameMatch && filenameMatch.length > 1) {
          filename = filenameMatch[1];
        }
      }
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast({ title: 'Backup Created', description: 'Content backup file has been downloaded.' });
    } catch (err: any) {
      console.error('Error creating database backup:', err);
      const errorMsg = err.response?.data?.error || 'Failed to create backup.';
       toast({ title: 'Error Creating Backup', description: errorMsg, variant: 'destructive' });
    } finally {
      setIsBackingUp(false);
    }
  };
  
  const bannerSettingsChanged = bannerEnabled !== initialBannerEnabled || bannerText !== initialBannerText;

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
              <p>You do not have permission to access the admin dashboard.</p>
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Manage users, content, and view analytics
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Users className="h-4 w-4 text-primary mr-2" />
                <div className="text-2xl font-bold">
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : metrics.totalUsers}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Users (30d)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Users className="h-4 w-4 text-green-500 mr-2" />
                <div className="text-2xl font-bold">
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : metrics.activeUsers}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Premium Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Users className="h-4 w-4 text-purple-500 mr-2" />
                <div className="text-2xl font-bold">
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : metrics.premiumUsers}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Content Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <FileText className="h-4 w-4 text-blue-500 mr-2" />
                <div className="text-2xl font-bold">
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : metrics.totalContent}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:border-primary transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 text-primary mr-2" />
                User Management
              </CardTitle>
              <CardDescription>
                View and manage user accounts, subscriptions, and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => navigate('/admin/users')} 
                className="w-full"
              >
                Manage Users
              </Button>
            </CardContent>
          </Card>
          
          <Card className="hover:border-primary transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center">
                <LineChart className="h-5 w-5 text-primary mr-2" />
                Analytics
              </CardTitle>
              <CardDescription>
                View user engagement analytics, content performance, and revenue metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => navigate('/admin/analytics')} 
                className="w-full"
              >
                View Analytics
              </Button>
            </CardContent>
          </Card>
          
          <Card className="hover:border-primary transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="h-5 w-5 text-primary mr-2" />
                Content Management
              </CardTitle>
              <CardDescription>
                Create and manage modules, sections, and learning resources
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => navigate('/admin/content')} 
                className="w-full"
              >
                Manage Content
              </Button>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 text-primary mr-2" />
              Admin Settings
            </CardTitle>
            <CardDescription>
              Configure system settings, security options, and admin preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-md">
              <div className="mb-3 sm:mb-0">
                <Label htmlFor="maintenance-mode" className="text-lg font-semibold flex items-center">
                   <ShieldCheck className="mr-2 h-5 w-5" /> Maintenance Mode
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Enable maintenance mode to prevent users from accessing the site while you perform updates.
                  Status: {maintenanceMode ? 
                    <span className='font-semibold text-destructive'>Enabled</span> : 
                    <span className='font-semibold text-green-600'>Disabled</span>}
                </p>
              </div>
              <div className="flex space-x-2 shrink-0">
                <Button
                  variant={maintenanceMode ? 'outline' : 'destructive'}
                  size="sm"
                  onClick={() => toggleMaintenanceMode(true)}
                  disabled={maintenanceMode || isUpdatingMaintenance}
                >
                   {isUpdatingMaintenance && maintenanceMode ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Enable
                </Button>
                <Button
                  variant={!maintenanceMode ? 'outline' : 'secondary'}
                  size="sm"
                  onClick={() => toggleMaintenanceMode(false)}
                  disabled={!maintenanceMode || isUpdatingMaintenance}
                >
                   {isUpdatingMaintenance && !maintenanceMode ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                   Disable
                </Button>
              </div>
            </div>

            <Separator />
            <div className="p-4 border rounded-md space-y-4">
                <Label className="text-lg font-semibold flex items-center">
                  <Megaphone className="mr-2 h-5 w-5" /> Announcement Banner
                </Label>
                <p className="text-sm text-muted-foreground">
                   Display a site-wide announcement banner. Save changes after modifying.
                    Status: {initialBannerEnabled ? 
                      <span className='font-semibold text-green-600'>Enabled</span> : 
                      <span className='font-semibold text-muted-foreground'>Disabled</span>}
                </p>
                {isBannerLoading ? (
                  <div className="flex items-center justify-center h-24">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="banner-enabled"
                        checked={bannerEnabled}
                        onCheckedChange={setBannerEnabled}
                        aria-label="Enable announcement banner"
                      />
                      <Label htmlFor="banner-enabled">Enable Banner</Label>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="banner-text">Banner Text</Label>
                      <Textarea 
                        id="banner-text"
                        placeholder="Enter announcement text here... (supports Markdown)"
                        value={bannerText}
                        onChange={(e) => setBannerText(e.target.value)}
                        rows={4}
                        disabled={!bannerEnabled}
                      />
                    </div>
                    <div className="flex justify-end">
                       <Button 
                        onClick={handleSaveBanner}
                        disabled={!bannerSettingsChanged || isBannerSaving}
                        size="sm"
                       >
                         {isBannerSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                         Save Banner Settings
                       </Button>
                    </div>
                 </div>
                )}
             </div>

            <Separator />
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-md">
               <div className="mb-3 sm:mb-0">
                  <Label htmlFor="backup-db" className="text-lg font-semibold flex items-center">
                    <Download className="mr-2 h-5 w-5" /> Database Backup
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Create a backup of the course content (modules and sections) and download it to your computer as a JSON file.
                  </p>
               </div>
               <Button
                 onClick={createDatabaseBackup}
                 disabled={isBackingUp}
                 size="sm"
                 className="shrink-0"
               >
                 {isBackingUp ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                 Download Backup
               </Button>
            </div>

             <Separator />
             <div className="flex justify-center pt-4">
               <Button variant="outline" onClick={() => navigate('/admin/settings')}>
                 Advanced Settings
               </Button>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 