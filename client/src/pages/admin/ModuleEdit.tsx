import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
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
import {
  ChevronLeft,
  Save,
  Plus,
  Folder,
  File,
  ClipboardList,
  AlertTriangle,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { Separator } from '@/components/ui/separator';

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

export default function ModuleEdit() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isNewModule = id === 'new';
  
  const [module, setModule] = useState<Module>({
    id: '',
    title: '',
    description: '',
    order_index: 0,
    created_at: '',
    updated_at: ''
  });
  
  const [sections, setSections] = useState<Section[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  useEffect(() => {
    // Redirect if not admin
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }
    
    if (!isNewModule) {
      fetchModule();
      fetchModuleSections();
    } else {
      // For new modules, set default values and mark as having changes
      setModule({
        id: 'new',
        title: '',
        description: '',
        order_index: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      setHasChanges(true);
      setIsLoading(false);
    }
  }, [id, isAdmin, navigate]);
  
  // Fetch module data
  async function fetchModule() {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      if (data) {
        setModule(data);
      } else {
        toast({
          title: 'Module not found',
          description: 'The requested module could not be found.',
          variant: 'destructive'
        });
        navigate('/admin/content');
      }
    } catch (error) {
      console.error('Error fetching module:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch module',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }
  
  // Fetch sections for this module
  async function fetchModuleSections() {
    try {
      const { data, error } = await supabase
        .from('sections')
        .select('*')
        .eq('module_id', id)
        .order('order_index', { ascending: true });
      
      if (error) throw error;
      
      setSections(data || []);
    } catch (error) {
      console.error('Error fetching sections:', error);
    }
  }
  
  // Handle changes to module fields
  function handleChange(field: keyof Module, value: any) {
    setModule(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
  }
  
  // Save module changes
  async function handleSave() {
    try {
      setIsSaving(true);
      
      if (isNewModule) {
        // Create new module
        const { data, error } = await supabase
          .from('modules')
          .insert([{
            title: module.title,
            description: module.description || null,
            order_index: module.order_index
          }])
          .select()
          .single();
        
        if (error) throw error;
        
        toast({ title: 'Module created successfully' });
        
        // Redirect to the edit page for the newly created module
        navigate(`/admin/module/${data.id}`);
      } else {
        // Update existing module
        const { error } = await supabase
          .from('modules')
          .update({
            title: module.title,
            description: module.description,
            order_index: module.order_index,
            updated_at: new Date().toISOString()
          })
          .eq('id', module.id);
        
        if (error) throw error;
        
        toast({ title: 'Module updated successfully' });
        setHasChanges(false);
      }
    } catch (error) {
      console.error('Error saving module:', error);
      toast({ 
        title: 'Error',
        description: 'Failed to save module',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  }
  
  // Navigate to a section edit page
  function navigateToSection(sectionId: string) {
    navigate(`/admin/section/${sectionId}`);
  }
  
  // Create a new section for this module
  function createNewSection() {
    // First make sure the module is saved
    if (isNewModule || hasChanges) {
      toast({
        title: 'Save required',
        description: 'Please save the module before adding sections.',
        variant: 'destructive'
      });
      return;
    }
    
    navigate(`/admin/section/new?moduleId=${module.id}`);
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
              onClick={() => navigate('/admin/content')}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Content Management
            </Button>
            <h1 className="text-3xl font-bold">
              {isNewModule ? 'Create Module' : 'Edit Module'}
            </h1>
            <p className="text-muted-foreground">
              {isNewModule 
                ? 'Add a new module to your course' 
                : 'Update the details of this course module'}
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
              disabled={isSaving || !module.title.trim()}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Module'}
            </Button>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin h-6 w-6 border-2 border-primary rounded-full border-t-transparent" />
            <span className="ml-2">Loading module...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main module edit form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Folder className="h-5 w-5 mr-2" />
                    Module Details
                  </CardTitle>
                  <CardDescription>
                    Edit the details of your module
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input 
                      id="title" 
                      value={module.title}
                      onChange={(e) => handleChange('title', e.target.value)}
                      placeholder="Module Title"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea 
                      id="description" 
                      value={module.description || ''}
                      onChange={(e) => handleChange('description', e.target.value)}
                      placeholder="Module Description"
                      rows={6}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="order">Order</Label>
                    <Input 
                      id="order" 
                      type="number"
                      value={module.order_index}
                      onChange={(e) => handleChange('order_index', parseInt(e.target.value) || 0)}
                      min={0}
                    />
                    <p className="text-xs text-muted-foreground">
                      Determines the display order of this module (lower numbers shown first)
                    </p>
                  </div>
                  
                  {!isNewModule && (
                    <div className="pt-2 space-y-2 text-sm text-muted-foreground">
                      <p>Created: {new Date(module.created_at).toLocaleString()}</p>
                      <p>Last updated: {new Date(module.updated_at).toLocaleString()}</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="justify-between">
                  <Button
                    variant="outline"
                    onClick={() => navigate('/admin/content')}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={isSaving || !module.title.trim()}
                  >
                    {isSaving ? 'Saving...' : (isNewModule ? 'Create Module' : 'Update Module')}
                  </Button>
                </CardFooter>
              </Card>
            </div>
            
            {/* Sections sidebar */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ClipboardList className="h-5 w-5 mr-2" />
                    Module Sections
                  </CardTitle>
                  <CardDescription>
                    {isNewModule 
                      ? 'Save the module first to add sections' 
                      : 'Manage sections in this module'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isNewModule ? (
                    <div className="py-8 text-center">
                      <p className="text-muted-foreground mb-4">
                        You need to save the module before adding sections
                      </p>
                    </div>
                  ) : sections.length === 0 ? (
                    <div className="py-8 text-center">
                      <File className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-4">No sections found</p>
                      <Button onClick={createNewSection}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Section
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {sections.map((section) => (
                        <div 
                          key={section.id}
                          className="p-3 border rounded-md hover:bg-secondary transition-colors cursor-pointer"
                          onClick={() => navigateToSection(section.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center">
                              <File className="h-4 w-4 mr-2 flex-shrink-0" />
                              <div>
                                <p className="font-medium">{section.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {section.duration || 'No duration set'} • Order: {section.order_index}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      <Separator className="my-4" />
                      
                      <Button 
                        className="w-full"
                        onClick={createNewSection}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Section
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 