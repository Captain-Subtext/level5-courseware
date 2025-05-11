import { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  ChevronLeft,
  Save,
  File,
  Folder,
  Eye,
  Edit as EditIcon,
  AlertTriangle,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import { cn } from '@/lib/utils';

// Dynamically import MDEditor
const LazyMDEditor = lazy(() => import('@uiw/react-md-editor'));

interface Module {
  id: string;
  title: string;
  description: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}

interface Section {
  id: string;
  module_id: string;
  title: string;
  content: string | null;
  duration: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export default function SectionEdit() {
  const { user, isAdmin } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const isNewSection = id === 'new';
  
  // Get moduleId from query params for new sections
  const queryParams = new URLSearchParams(location.search);
  const moduleIdFromQuery = queryParams.get('moduleId');
  
  const [section, setSection] = useState<Section>({
    id: '',
    module_id: moduleIdFromQuery || '',
    title: '',
    content: '',
    duration: '',
    order_index: 0,
    created_at: '',
    updated_at: ''
  });
  
  const [modules, setModules] = useState<Module[]>([]);
  const [parentModule, setParentModule] = useState<Module | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('edit');
  
  // Get current color mode for MDEditor
  const colorMode = theme === 'dark' ? 'dark' : 'light';
  
  useEffect(() => {
    // Redirect if not admin
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }
    
    // Load modules for dropdown
    fetchModules();
    
    if (!isNewSection) {
      fetchSection();
    } else {
      // For new sections, set default values and mark as having changes
      if (moduleIdFromQuery) {
        fetchNextOrderIndex(moduleIdFromQuery);
        fetchModuleDetails(moduleIdFromQuery);
      }
      
      setSection({
        id: 'new',
        module_id: moduleIdFromQuery || '',
        title: '',
        content: '',
        duration: '',
        order_index: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      setHasChanges(true);
      setIsLoading(false);
    }
  }, [id, isAdmin, navigate, moduleIdFromQuery]);
  
  // Fetch modules for dropdown
  async function fetchModules() {
    try {
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .order('order_index', { ascending: true });
      
      if (error) throw error;
      
      setModules(data || []);
    } catch (error) {
      console.error('Error fetching modules:', error);
    }
  }
  
  // Fetch module details
  async function fetchModuleDetails(moduleId: string) {
    try {
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .eq('id', moduleId)
        .single();
      
      if (error) throw error;
      
      setParentModule(data);
    } catch (error) {
      console.error('Error fetching module details:', error);
    }
  }
  
  // Get the next order index for a new section in a module
  async function fetchNextOrderIndex(moduleId: string) {
    try {
      const { data, error } = await supabase
        .from('sections')
        .select('order_index')
        .eq('module_id', moduleId)
        .order('order_index', { ascending: false })
        .limit(1);
      
      if (error) throw error;
      
      const nextIndex = data && data.length > 0 ? data[0].order_index + 1 : 0;
      
      setSection(prev => ({
        ...prev,
        order_index: nextIndex
      }));
    } catch (error) {
      console.error('Error fetching next order index:', error);
    }
  }
  
  // Fetch section data
  async function fetchSection() {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('sections')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      if (data) {
        setSection(data);
        
        // Fetch parent module details
        if (data.module_id) {
          fetchModuleDetails(data.module_id);
        }
      } else {
        toast({
          title: 'Section not found',
          description: 'The requested section could not be found.',
          variant: 'destructive'
        });
        navigate('/admin/content');
      }
    } catch (error) {
      console.error('Error fetching section:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch section',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }
  
  // Handle changes to section fields
  function handleChange(field: keyof Section, value: any) {
    setSection(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
  }
  
  // Handle module change
  function handleModuleChange(moduleId: string) {
    if (moduleId !== section.module_id) {
      fetchNextOrderIndex(moduleId);
      fetchModuleDetails(moduleId);
      setSection(prev => ({
        ...prev,
        module_id: moduleId
      }));
      setHasChanges(true);
    }
  }
  
  // Save section changes
  async function handleSave() {
    try {
      setIsSaving(true);
      
      if (isNewSection) {
        // Create new section
        const { data, error } = await supabase
          .from('sections')
          .insert([{
            module_id: section.module_id,
            title: section.title,
            content: section.content || null,
            duration: section.duration || null,
            order_index: section.order_index
          }])
          .select()
          .single();
        
        if (error) throw error;
        
        toast({ title: 'Section created successfully' });
        
        // Redirect to the edit page for the newly created section
        navigate(`/admin/section/${data.id}`);
      } else {
        // Update existing section
        const { error } = await supabase
          .from('sections')
          .update({
            module_id: section.module_id,
            title: section.title,
            content: section.content,
            duration: section.duration,
            order_index: section.order_index,
            updated_at: new Date().toISOString()
          })
          .eq('id', section.id);
        
        if (error) throw error;
        
        toast({ title: 'Section updated successfully' });
        setHasChanges(false);
      }
    } catch (error) {
      console.error('Error saving section:', error);
      toast({ 
        title: 'Error',
        description: 'Failed to save section',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
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
              <p>You do not have permission to access the content management system.</p>
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
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <Button 
              variant="ghost" 
              className="mb-2 p-0" 
              onClick={() => {
                if (parentModule) {
                  navigate(`/admin/module/${parentModule.id}`);
                } else {
                  navigate('/admin/content');
                }
              }}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              {parentModule 
                ? `Back to ${parentModule.title}` 
                : 'Back to Content Management'}
            </Button>
            <h1 className="text-3xl font-bold">
              {isNewSection ? 'Create Section' : 'Edit Section'}
            </h1>
            <p className="text-muted-foreground">
              {isNewSection 
                ? 'Add a new section to your course' 
                : 'Update the content of this section'}
            </p>
          </div>
          
          <div className="flex items-center gap-2 mt-4 md:mt-0">
            {hasChanges && (
              <div className="flex items-center text-amber-500 mr-2">
                <AlertTriangle className="h-4 w-4 mr-1" />
                <span className="text-sm">Unsaved changes</span>
              </div>
            )}
            <Button 
              variant="default"
              onClick={handleSave}
              disabled={isSaving || !section.title.trim() || !section.module_id}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Section'}
            </Button>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin h-6 w-6 border-2 border-primary rounded-full border-t-transparent" />
            <span className="ml-2">Loading section...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Section metadata */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <File className="h-5 w-5 mr-2" />
                  Section Details
                </CardTitle>
                <CardDescription>
                  Edit basic information about this section
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input 
                      id="title" 
                      value={section.title}
                      onChange={(e) => handleChange('title', e.target.value)}
                      placeholder="Section Title"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration</Label>
                    <Input 
                      id="duration" 
                      value={section.duration || ''}
                      onChange={(e) => handleChange('duration', e.target.value)}
                      placeholder="e.g. 10 min"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="module_id">Module *</Label>
                    <select 
                      id="module_id" 
                      value={section.module_id}
                      onChange={(e) => handleModuleChange(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="" disabled>Select a module</option>
                      {modules.map(module => (
                        <option key={module.id} value={module.id}>
                          {module.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="order">Order</Label>
                    <Input 
                      id="order" 
                      type="number"
                      value={section.order_index}
                      onChange={(e) => handleChange('order_index', parseInt(e.target.value) || 0)}
                      min={0}
                    />
                    <p className="text-xs text-muted-foreground">
                      Determines the display order within this module
                    </p>
                  </div>
                </div>
                
                {!isNewSection && (
                  <div className="pt-2 space-y-2 text-sm text-muted-foreground">
                    <p>Created: {new Date(section.created_at).toLocaleString()}</p>
                    <p>Last updated: {new Date(section.updated_at).toLocaleString()}</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Content Editor */}
            <Card>
              <CardHeader className="pb-0">
                <CardTitle className="flex items-center">
                  Content Editor
                </CardTitle>
                <CardDescription>
                  Create and format content using Markdown
                </CardDescription>
              </CardHeader>
              <Tabs 
                value={activeTab} 
                onValueChange={setActiveTab}
                className="w-full"
              >
                <CardContent className="pb-2 pt-4">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="edit" className="flex items-center">
                      <EditIcon className="h-4 w-4 mr-2" />
                      Edit
                    </TabsTrigger>
                    <TabsTrigger value="preview" className="flex items-center">
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </TabsTrigger>
                  </TabsList>
                </CardContent>
                
                <CardContent className="pt-4">
                  <TabsContent value="edit" className="mt-0">
                    <div data-color-mode={colorMode}>
                      <Suspense fallback={<div className="p-4 border rounded-md min-h-[300px]">Loading Editor...</div>}>
                        <LazyMDEditor
                          value={section.content || ''}
                          onChange={(value) => handleChange('content', value || '')}
                          height={500}
                          preview="edit"
                        />
                      </Suspense>
                    </div>
                    <div className="mt-4">
                      <p className="text-sm text-muted-foreground">
                        Use Markdown to format your content. Supports headings, lists, links, code blocks, and more.
                      </p>
                    </div>
                  </TabsContent>
                  <TabsContent value="preview" className="mt-0">
                    <Card className={cn(
                      "border shadow-sm p-6 min-h-[500px]",
                      "prose prose-sm md:prose max-w-none dark:prose-invert"
                    )}>
                      {section.content ? (
                        <ReactMarkdown rehypePlugins={[rehypeSanitize]}>
                          {section.content}
                        </ReactMarkdown>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                          <p>No content to preview</p>
                          <p className="text-sm mt-2">Switch to edit mode to add content</p>
                        </div>
                      )}
                    </Card>
                  </TabsContent>
                </CardContent>
              </Tabs>
              
              <CardFooter className="justify-between">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (parentModule) {
                      navigate(`/admin/module/${parentModule.id}`);
                    } else {
                      navigate('/admin/content');
                    }
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving || !section.title.trim() || !section.module_id}
                >
                  {isSaving ? 'Saving...' : (isNewSection ? 'Create Section' : 'Update Section')}
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
} 