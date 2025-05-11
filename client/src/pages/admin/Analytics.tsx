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
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ChevronLeft,
  TrendingUp,
  Users,
  Calendar,
  TableIcon,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';

interface AnalyticsData {
  userGrowth: {
    labels: string[];
    data: number[];
  };
  userEngagement: {
    labels: string[];
    data: number[];
  };
  contentPopularity: {
    labels: string[];
    data: number[];
  };
  subscriptionDistribution: {
    labels: string[];
    data: number[];
  };
}

export default function AdminAnalytics() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState('30days');
  const [isLoading, setIsLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    userGrowth: {
      labels: [],
      data: [],
    },
    userEngagement: {
      labels: [],
      data: [],
    },
    contentPopularity: {
      labels: [],
      data: [],
    },
    subscriptionDistribution: {
      labels: [],
      data: [],
    },
  });

  useEffect(() => {
    fetchAnalyticsData(timeRange);
  }, [timeRange]);

  // Function to fetch analytics data
  const fetchAnalyticsData = async (range: string) => {
    try {
      setIsLoading(true);

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      
      switch (range) {
        case '7days':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30days':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90days':
          startDate.setDate(endDate.getDate() - 90);
          break;
        case '365days':
          startDate.setDate(endDate.getDate() - 365);
          break;
        default:
          startDate.setDate(endDate.getDate() - 30);
          break;
      }

      // Format the dates to ISO strings
      const startDateStr = startDate.toISOString();
      const endDateStr = endDate.toISOString();

      // 1. Fetch user growth data (users created per time period)
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('created_at')
        .gte('created_at', startDateStr)
        .lte('created_at', endDateStr)
        .order('created_at', { ascending: true });

      if (usersError) throw usersError;

      // 2. Fetch user engagement data (progress records per time period)
      const { data: progressData, error: progressError } = await supabase
        .from('user_progress')
        .select('created_at')
        .gte('created_at', startDateStr)
        .lte('created_at', endDateStr)
        .order('created_at', { ascending: true });

      if (progressError) throw progressError;

      // 3. Fetch content popularity (most completed sections)
      const { data: sectionData, error: sectionError } = await supabase
        .from('user_progress')
        .select('section_id, completed')
        .eq('completed', true);

      if (sectionError) throw sectionError;

      // Create a map to count section completions
      const sectionCompletions: Record<string, number> = {};
      sectionData.forEach(item => {
        sectionCompletions[item.section_id] = (sectionCompletions[item.section_id] || 0) + 1;
      });

      // Get top sections by completion count
      const topSections = Object.entries(sectionCompletions)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      // Fetch section titles for the top sections
      const sectionIds = topSections.map(([id]) => id);
      const { data: sectionsWithTitles, error: titlesError } = await supabase
        .from('sections')
        .select('id, title')
        .in('id', sectionIds);

      if (titlesError) throw titlesError;

      // Map section IDs to titles
      const sectionTitles: Record<string, string> = {};
      sectionsWithTitles.forEach(item => {
        sectionTitles[item.id] = item.title;
      });

      // 4. Fetch subscription distribution
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('profiles')
        .select('subscription_tier');

      if (subscriptionError) throw subscriptionError;

      // Count subscriptions by tier
      const subscriptionCounts: Record<string, number> = {};
      subscriptionData.forEach(item => {
        const tier = item.subscription_tier || 'unknown';
        subscriptionCounts[tier] = (subscriptionCounts[tier] || 0) + 1;
      });

      // Process user growth data into charts format
      const userGrowthData = processTimeSeriesData(usersData.map(u => u.created_at), range);
      
      // Process user engagement data into charts format
      const userEngagementData = processTimeSeriesData(progressData.map(p => p.created_at), range);

      // Process content popularity data
      const contentLabels = topSections.map(([id]) => {
        const shortTitle = sectionTitles[id]?.slice(0, 20) || id.slice(0, 8);
        return shortTitle + (sectionTitles[id]?.length > 20 ? '...' : '');
      });
      const contentData = topSections.map(([, count]) => count);

      // Process subscription distribution data
      const subscriptionLabels = Object.keys(subscriptionCounts).map(tier => 
        tier.charAt(0).toUpperCase() + tier.slice(1)
      );
      const subscriptionValues = Object.values(subscriptionCounts);

      // Set analytics data
      setAnalyticsData({
        userGrowth: {
          labels: userGrowthData.labels,
          data: userGrowthData.data,
        },
        userEngagement: {
          labels: userEngagementData.labels,
          data: userEngagementData.data,
        },
        contentPopularity: {
          labels: contentLabels,
          data: contentData,
        },
        subscriptionDistribution: {
          labels: subscriptionLabels,
          data: subscriptionValues,
        },
      });
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to process time series data into chart format
  const processTimeSeriesData = (timestamps: string[], range: string) => {
    // Create empty result structure
    const result = {
      labels: [] as string[],
      data: [] as number[],
    };

    if (timestamps.length === 0) {
      return result;
    }

    // Determine the period format based on the time range
    let format: 'day' | 'week' | 'month';
    switch (range) {
      case '7days':
        format = 'day';
        break;
      case '30days':
        format = 'day';
        break;
      case '90days':
        format = 'week';
        break;
      case '365days':
        format = 'month';
        break;
      default:
        format = 'day';
        break;
    }

    // Sort timestamps
    const sortedTimestamps = [...timestamps].sort();
    
    // Get start and end dates
    const startDate = new Date(sortedTimestamps[0]);
    const endDate = new Date(sortedTimestamps[sortedTimestamps.length - 1]);
    
    // Initialize period mapping
    const periodCounts: Record<string, number> = {};
    
    // Initialize periods
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      let periodKey: string;
      
      if (format === 'day') {
        periodKey = currentDate.toISOString().split('T')[0];
      } else if (format === 'week') {
        // Get start of the week (Sunday)
        const weekStart = new Date(currentDate);
        weekStart.setDate(currentDate.getDate() - currentDate.getDay());
        periodKey = `Week of ${weekStart.toISOString().split('T')[0]}`;
      } else { // month
        periodKey = `${currentDate.toLocaleString('default', { month: 'short' })} ${currentDate.getFullYear()}`;
      }
      
      periodCounts[periodKey] = 0;
      
      // Move to next period
      if (format === 'day') {
        currentDate.setDate(currentDate.getDate() + 1);
      } else if (format === 'week') {
        currentDate.setDate(currentDate.getDate() + 7);
      } else { // month
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
    }
    
    // Count items per period
    timestamps.forEach(timestamp => {
      const date = new Date(timestamp);
      let periodKey: string;
      
      if (format === 'day') {
        periodKey = date.toISOString().split('T')[0];
      } else if (format === 'week') {
        // Get start of the week (Sunday)
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        periodKey = `Week of ${weekStart.toISOString().split('T')[0]}`;
      } else { // month
        periodKey = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
      }
      
      if (periodKey in periodCounts) {
        periodCounts[periodKey]++;
      }
    });
    
    // Convert to arrays for chart
    result.labels = Object.keys(periodCounts);
    result.data = Object.values(periodCounts);
    
    return result;
  };

  // Check if user is admin
  // const isAdmin = user?.email === 'admin@example.com';
  
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
              <p>You do not have permission to access the analytics dashboard.</p>
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
            <Button 
              variant="ghost" 
              className="mb-2 p-0" 
              onClick={() => navigate('/admin')}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Admin Dashboard
            </Button>
            <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
            <p className="text-muted-foreground">
              View platform performance metrics and insights
            </p>
          </div>
          
          <div className="mt-4 md:mt-0 flex items-center">
            <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
            <Select 
              value={timeRange} 
              onValueChange={setTimeRange}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Last 7 days</SelectItem>
                <SelectItem value="30days">Last 30 days</SelectItem>
                <SelectItem value="90days">Last 90 days</SelectItem>
                <SelectItem value="365days">Last 365 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Tabs defaultValue="growth" className="w-full">
          <TabsList className="grid grid-cols-3 mb-8">
            <TabsTrigger value="growth">
              <TrendingUp className="h-4 w-4 mr-2" />
              User Growth
            </TabsTrigger>
            <TabsTrigger value="engagement">
              <Users className="h-4 w-4 mr-2" />
              Engagement
            </TabsTrigger>
            <TabsTrigger value="content">
              <TableIcon className="h-4 w-4 mr-2" />
              Content & Revenue
            </TabsTrigger>
          </TabsList>
          
          {/* User Growth Tab */}
          <TabsContent value="growth" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  User Growth
                </CardTitle>
                <CardDescription>
                  New user registrations over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center items-center py-16">
                    <div className="animate-spin h-6 w-6 border-2 border-primary rounded-full border-t-transparent" />
                    <span className="ml-2">Loading data...</span>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Period</TableHead>
                        <TableHead className="text-right">New Users</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analyticsData.userGrowth.labels.map((label, index) => (
                        <TableRow key={label}>
                          <TableCell>{label}</TableCell>
                          <TableCell className="text-right">{analyticsData.userGrowth.data[index]}</TableCell>
                        </TableRow>
                      ))}
                      {analyticsData.userGrowth.labels.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={2} className="text-center text-muted-foreground">No data available</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  Subscription Distribution
                </CardTitle>
                <CardDescription>
                  Breakdown of users by subscription tier
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center items-center py-16">
                    <div className="animate-spin h-6 w-6 border-2 border-primary rounded-full border-t-transparent" />
                    <span className="ml-2">Loading data...</span>
                  </div>
                ) : (
                   <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tier</TableHead>
                        <TableHead className="text-right">User Count</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analyticsData.subscriptionDistribution.labels.map((label, index) => (
                        <TableRow key={label}>
                          <TableCell>{label}</TableCell>
                          <TableCell className="text-right">{analyticsData.subscriptionDistribution.data[index]}</TableCell>
                        </TableRow>
                      ))}
                      {analyticsData.subscriptionDistribution.labels.length === 0 && (
                         <TableRow>
                          <TableCell colSpan={2} className="text-center text-muted-foreground">No data available</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Engagement Tab */}
          <TabsContent value="engagement" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  User Engagement
                </CardTitle>
                <CardDescription>
                  Course content interactions over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center items-center py-16">
                    <div className="animate-spin h-6 w-6 border-2 border-primary rounded-full border-t-transparent" />
                    <span className="ml-2">Loading data...</span>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Period</TableHead>
                        <TableHead className="text-right">Interactions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analyticsData.userEngagement.labels.map((label, index) => (
                        <TableRow key={label}>
                          <TableCell>{label}</TableCell>
                          <TableCell className="text-right">{analyticsData.userEngagement.data[index]}</TableCell>
                        </TableRow>
                      ))}
                       {analyticsData.userEngagement.labels.length === 0 && (
                         <TableRow>
                          <TableCell colSpan={2} className="text-center text-muted-foreground">No data available</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Content Tab */}
          <TabsContent value="content" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  Most Popular Content
                </CardTitle>
                <CardDescription>
                  Sections with the highest completion rates
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center items-center py-16">
                    <div className="animate-spin h-6 w-6 border-2 border-primary rounded-full border-t-transparent" />
                    <span className="ml-2">Loading data...</span>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Section</TableHead>
                        <TableHead className="text-right">Completions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analyticsData.contentPopularity.labels.map((label, index) => (
                        <TableRow key={label}>
                          <TableCell>{label}</TableCell>
                          <TableCell className="text-right">{analyticsData.contentPopularity.data[index]}</TableCell>
                        </TableRow>
                      ))}
                       {analyticsData.contentPopularity.labels.length === 0 && (
                         <TableRow>
                          <TableCell colSpan={2} className="text-center text-muted-foreground">No data available</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 