import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import { ContentSidebar } from '@/components/admin/ContentSidebar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ChevronLeft,
  Folder,
  File,
  Plus,
  Edit,
  Trash2,
  Search,
  LayoutList,
  Copy,
  Loader2,
  Database,
  DownloadCloud,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { Separator } from '@/components/ui/separator';
import MDEditor from '@uiw/react-md-editor';
import { duplicateModule, duplicateSection } from '@/lib/api';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { PaginationControls } from '@/components/admin/PaginationControls';

// Define types for modules and sections
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
  content?: string | null;
  duration: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}

interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

export default function AdminContent() {
  const { isAdmin } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('modules');
  const [modules, setModules] = useState<Module[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [allSectionsForSidebar, setAllSectionsForSidebar] = useState<Section[]>([]);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showModuleDialog, setShowModuleDialog] = useState(false);
  const [showSectionDialog, setShowSectionDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Pagination state
  const [modulesPagination, setModulesPagination] = useState<PaginationState>({
    page: 1,
    pageSize: 5,
    total: 0
  });
  
  const [sectionsPagination, setSectionsPagination] = useState<PaginationState>({
    page: 1,
    pageSize: 10,
    total: 0
  });
  
  // Search state
  const [moduleSearchQuery, setModuleSearchQuery] = useState('');
  const [sectionSearchQuery, setSectionSearchQuery] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<number | null>(null);
  const [sectionSearchTimeout, setSectionSearchTimeout] = useState<number | null>(null);
  
  // Filter state for sections
  const [sectionFilterModule, setSectionFilterModule] = useState<string>('all');
  
  // State for hierarchical navigation
  const [showSidebar, setShowSidebar] = useState(true);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [selectedContent, setSelectedContent] = useState<{ type: 'module' | 'section'; id: string } | null>(null);
  
  const [newModule, setNewModule] = useState({
    title: '',
    description: '',
    order_index: 0
  });
  const [newSection, setNewSection] = useState({
    title: '',
    content: '',
    duration: '',
    order_index: 0,
    module_id: ''
  });
  const [deleteType, setDeleteType] = useState<'module' | 'section'>('module');
  const [deleteItemId, setDeleteItemId] = useState<string>('');
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [duplicateError, setDuplicateError] = useState(false);

  // Get current color mode for MDEditor
  const colorMode = theme === 'dark' ? 'dark' : 'light';

  // Set document title on mount
  useEffect(() => {
    document.title = 'Admin: Content Management | Cursor for Non-Coders';
  }, []);

  useEffect(() => {
    // Redirect if not admin
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }
    
    // Load paginated/filtered content for main view
    fetchModules();
    fetchSections();
    // Load all sections for the sidebar ONCE initially
    fetchAllSectionsForSidebar(); 
  }, [navigate, isAdmin, modulesPagination.page, modulesPagination.pageSize, sectionsPagination.page, sectionsPagination.pageSize, sectionFilterModule]);
  
  // Effect for module search with debounce
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    const timeout = window.setTimeout(() => {
      fetchModules();
    }, 500); // 500ms debounce
    
    setSearchTimeout(timeout);
    
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [moduleSearchQuery]);

  // Effect for section search with debounce
  useEffect(() => {
    if (sectionSearchTimeout) {
      clearTimeout(sectionSearchTimeout);
    }
    
    const timeout = window.setTimeout(() => {
      fetchSections();
    }, 500); // 500ms debounce
    
    setSectionSearchTimeout(timeout);
    
    return () => {
      if (sectionSearchTimeout) {
        clearTimeout(sectionSearchTimeout);
      }
    };
  }, [sectionSearchQuery]);

  // Function to fetch modules with pagination
  async function fetchModules() {
    try {
      setIsLoading(true);
      
      // Count total modules for pagination
      const countQuery = supabase
        .from('modules')
        .select('id', { count: 'exact' });
        
      // Apply search filter if query exists
      if (moduleSearchQuery) {
        countQuery.ilike('title', `%${moduleSearchQuery}%`);
      }
      
      const { count, error: countError } = await countQuery;
      
      if (countError) throw countError;
      
      // Set total count for pagination
      setModulesPagination(prev => ({
        ...prev,
        total: count || 0
      }));
      
      // Build the query for fetching modules
      let query = supabase
        .from('modules')
        .select('*')
        .order('order_index', { ascending: true });
      
      // Apply search filter if query exists
      if (moduleSearchQuery) {
        query = query.ilike('title', `%${moduleSearchQuery}%`);
      }
      
      // Apply pagination
      const from = (modulesPagination.page - 1) * modulesPagination.pageSize;
      const to = from + modulesPagination.pageSize - 1;
      
      query = query.range(from, to);
      
      const { data, error } = await query;

      if (error) throw error;
      setModules(data || []);
    } catch (error) {
      console.error('Error fetching modules:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch modules',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Function to fetch sections with pagination
  async function fetchSections() {
    try {
      setIsLoading(true);
      
      // Count total sections for pagination
      let countQuery = supabase
        .from('sections')
        .select('id', { count: 'exact' });
        
      // Apply search filter if query exists
      if (sectionSearchQuery) {
        countQuery.ilike('title', `%${sectionSearchQuery}%`);
      }
      
      // Apply module filter if not "all"
      if (sectionFilterModule !== 'all') {
        countQuery.eq('module_id', sectionFilterModule);
      }
      
      const { count, error: countError } = await countQuery;
      
      if (countError) throw countError;
      
      // Set total count for pagination
      setSectionsPagination(prev => ({
        ...prev,
        total: count || 0
      }));
      
      // Build the query for fetching sections
      let query = supabase
        .from('sections')
        // Select specific columns, excluding the potentially large 'content' field
        .select('id, module_id, title, duration, order_index, created_at, updated_at')
        .order('order_index', { ascending: true });
      
      // Apply search filter if query exists
      if (sectionSearchQuery) {
        query = query.ilike('title', `%${sectionSearchQuery}%`);
      }
      
      // Apply module filter if not "all"
      if (sectionFilterModule !== 'all') {
        query = query.eq('module_id', sectionFilterModule);
      }
      
      // Apply pagination
      const from = (sectionsPagination.page - 1) * sectionsPagination.pageSize;
      const to = from + sectionsPagination.pageSize - 1;
      
      query = query.range(from, to);
      
      const { data, error } = await query;

      if (error) throw error;
      setSections(data || []);
    } catch (error) {
      console.error('Error fetching sections:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch sections',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Function to fetch ALL sections for the sidebar (no pagination/filtering)
  async function fetchAllSectionsForSidebar() {
    try {
      // No need to set isLoading here unless it's the very initial load
      const { data, error } = await supabase
        .from('sections')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;
      
      setAllSectionsForSidebar(data || []);
      console.log('Fetched all sections for sidebar:', data?.length);

    } catch (error) {
      console.error('Error fetching all sections for sidebar:', error);
      // Optionally show a toast, but maybe less critical than main content failing
    }
  }

  // Add or update module
  async function handleSaveModule() {
    try {
      setIsLoading(true);
      
      if (selectedModule) {
        // Update existing module
        const { error } = await supabase
          .from('modules')
          .update({
            title: newModule.title,
            description: newModule.description,
            order_index: newModule.order_index,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedModule.id);

        if (error) throw error;
        
        await fetchModules();
        setShowModuleDialog(false);
        toast({ title: 'Module updated successfully' });
      } else {
        // Create new module
        const { error } = await supabase
          .from('modules')
          .insert([{
            title: newModule.title,
            description: newModule.description || null,
            order_index: newModule.order_index
          }]);

        if (error) throw error;
        
        await fetchModules();
        setShowModuleDialog(false);
        toast({ title: 'Module created successfully' });
      }
    } catch (error) {
      console.error('Error saving module:', error);
      toast({ 
        title: 'Error',
        description: 'Failed to save module',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Add or update section
  async function handleSaveSection() {
    try {
      setIsLoading(true);
      
      if (selectedSection) {
        // Update existing section
        const { error } = await supabase
          .from('sections')
          .update({
            title: newSection.title,
            content: newSection.content,
            duration: newSection.duration,
            order_index: newSection.order_index,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedSection.id);

        if (error) throw error;
        
        await fetchSections();
        setShowSectionDialog(false);
        toast({ title: 'Section updated successfully' });
      } else {
        // Create new section
        const { error } = await supabase
          .from('sections')
          .insert([{
            title: newSection.title,
            content: newSection.content || null,
            duration: newSection.duration || null,
            order_index: newSection.order_index,
            module_id: newSection.module_id
          }]);

        if (error) throw error;
        
        await fetchSections();
        setShowSectionDialog(false);
        toast({ title: 'Section created successfully' });
      }
    } catch (error) {
      console.error('Error saving section:', error);
      toast({ 
        title: 'Error',
        description: 'Failed to save section',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Handle delete confirmation
  async function handleDelete() {
    try {
      setIsLoading(true);
      
      if (deleteType === 'module') {
        // Delete module
        const { error } = await supabase
          .from('modules')
          .delete()
          .eq('id', deleteItemId);

        if (error) throw error;
        
        await fetchModules();
        await fetchSections(); // Refresh sections as they might be affected
        toast({ title: 'Module deleted successfully' });
      } else {
        // Delete section
        const { error } = await supabase
          .from('sections')
          .delete()
          .eq('id', deleteItemId);

        if (error) throw error;
        
        await fetchSections();
        toast({ title: 'Section deleted successfully' });
      }
      
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({ 
        title: 'Error',
        description: 'Failed to delete item',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Open module dialog for creation or editing
  function openModuleDialog(module?: Module) {
    if (module) {
      setSelectedModule(module);
      setNewModule({
        title: module.title,
        description: module.description || '',
        order_index: module.order_index
      });
    } else {
      setSelectedModule(null);
      setNewModule({
        title: '',
        description: '',
        order_index: modules.length // Default to the end of the list
      });
    }
    setShowModuleDialog(true);
  }

  // Open section dialog for creation or editing
  async function openSectionDialog(section?: Section) {
    if (section) {
      // If editing, fetch full section data first
      setIsLoading(true); // Indicate loading while fetching
      try {
        const { data: fullSectionData, error } = await supabase
          .from('sections')
          .select('*, modules(title)') // Fetch content and module title
          .eq('id', section.id)
          .single();

        if (error) throw error;
        if (!fullSectionData) throw new Error('Section not found');

        setSelectedSection(fullSectionData); // Set the full data
        setNewSection({
          title: fullSectionData.title,
          // Use fetched content
          content: fullSectionData.content || '', 
          duration: fullSectionData.duration || '',
          order_index: fullSectionData.order_index,
          module_id: fullSectionData.module_id
        });
        setShowSectionDialog(true); // Open dialog only after fetching

      } catch (err) {
        console.error('Error fetching full section data for edit:', err);
        toast({ title: 'Error', description: 'Failed to load section content for editing.', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    } else {
      // Creating a new section
      setSelectedSection(null);
      
      // Select the default module ID if possible (e.g., from selectedContent or first module)
      let defaultModuleId = '';
      if (selectedContent?.type === 'module') {
          defaultModuleId = selectedContent.id;
      } else if (selectedContent?.type === 'section') {
          // Find the module ID of the currently selected section in the main list
          const currentSectionInList = sections.find(s => s.id === selectedContent.id);
          if (currentSectionInList) {
              defaultModuleId = currentSectionInList.module_id;
          }
      } else if (modules.length > 0) {
          defaultModuleId = modules[0].id; // Fallback to first module
      }
      
      setNewSection({
        title: '',
        content: '', // Start with empty content
        duration: '',
        // Calculate next order_index based on sections for the selected module
        order_index: allSectionsForSidebar.filter(s => s.module_id === defaultModuleId).length,
        module_id: defaultModuleId
      });
      setShowSectionDialog(true); // Open dialog for creation
    }
  }

  // Open delete confirmation dialog
  function openDeleteDialog(type: 'module' | 'section', id: string) {
    setDeleteType(type);
    setDeleteItemId(id);
    setShowDeleteDialog(true);
  }
  
  // Toggle expanded state for a module
  function toggleModuleExpanded(moduleId: string) {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  }
  
  // Select a module or section
  function handleSelectContent(type: 'module' | 'section', id: string) {
    setSelectedContent({ type, id });
    
    // If selecting a module, ensure it's expanded
    if (type === 'module') {
      setExpandedModules(prev => ({
        ...prev,
        [id]: true
      }));
    }
    
    // If selecting a section, set the active tab to sections
    if (type === 'section') {
      setActiveTab('sections');
      
      // Find the module this section belongs to and filter to it
      const section = sections.find(s => s.id === id);
      if (section) {
        setSectionFilterModule(section.module_id);
        
        // Make sure pagination shows this section
        const index = sections.filter(s => s.module_id === section.module_id).findIndex(s => s.id === id);
        const page = Math.floor(index / sectionsPagination.pageSize) + 1;
        setSectionsPagination(prev => ({
          ...prev,
          page
        }));
      }
    } else {
      setActiveTab('modules');
      
      // If selecting a module, filter sections to show only this module's sections
      setSectionFilterModule(id);
    }
  }
  
  // Function to handle module duplication
  async function handleDuplicateModule(moduleId: string) {
    try {
      setDuplicateError(false);
      setIsDuplicating(true);
      console.log('Attempting to duplicate module:', moduleId);
      
      const result = await duplicateModule(moduleId);
      console.log('Duplication result:', result);
      
      if (result.error) {
        console.error('Error duplicating module:', result.error);
        setDuplicateError(true);
        toast({
          title: 'Duplication Failed',
          description: `Error: ${result.error}`,
          variant: 'destructive'
        });
        return;
      }
      
      toast({
        title: 'Success',
        description: result.message
      });
      
      // Refresh the modules list
      fetchModules();
    } catch (error) {
      console.error('Error duplicating module:', error);
      setDuplicateError(true);
      toast({
        title: 'Error',
        description: 'Failed to duplicate module. See console for details.',
        variant: 'destructive'
      });
    } finally {
      setIsDuplicating(false);
    }
  }
  
  // Function to handle section duplication
  async function handleDuplicateSection(sectionId: string) {
    try {
      setDuplicateError(false);
      setIsDuplicating(true);
      console.log('Attempting to duplicate section:', sectionId);
      
      const result = await duplicateSection(sectionId);
      console.log('Duplication result:', result);
      
      if (result.error) {
        console.error('Error duplicating section:', result.error);
        setDuplicateError(true);
        toast({
          title: 'Duplication Failed',
          description: `Error: ${result.error}`,
          variant: 'destructive'
        });
        return;
      }
      
      toast({
        title: 'Success',
        description: result.message
      });
      
      // Refresh the sections list
      fetchSections();
    } catch (error) {
      console.error('Error duplicating section:', error);
      setDuplicateError(true);
      toast({
        title: 'Error',
        description: 'Failed to duplicate section. See console for details.',
        variant: 'destructive'
      });
    } finally {
      setIsDuplicating(false);
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
            <h1 
              className="text-3xl font-bold cursor-pointer hover:text-primary transition-colors"
              onClick={() => {
                // Reset filters and selections
                setActiveTab('modules');
                setSelectedContent(null);
                setModuleSearchQuery('');
                setSectionSearchQuery('');
                setSectionFilterModule('all');
                setModulesPagination(prev => ({ ...prev, page: 1 }));
                setSectionsPagination(prev => ({ ...prev, page: 1 }));
                
                // Fetch fresh data
                fetchModules();
                fetchSections();
              }}
              title="Reset filters and return to main view"
            >
              Content Management
            </h1>
            <p className="text-muted-foreground">
              Create and manage course content
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={() => navigate('/admin/content/backup')}
            >
              <Database className="h-4 w-4 mr-2" />
              Backup & Restore
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => setShowSidebar(!showSidebar)}
            >
              <LayoutList className="h-4 w-4 mr-2" />
              {showSidebar ? 'Hide Navigation' : 'Show Navigation'}
            </Button>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-6">
          {/* Hierarchical Navigation Sidebar */}
          {showSidebar && (
            <div className="md:w-1/4 lg:w-1/5">
              <ContentSidebar
                modules={modules}
                sections={allSectionsForSidebar}
                expandedModules={expandedModules}
                selectedContent={selectedContent}
                onToggleModule={toggleModuleExpanded}
                onSelectContent={handleSelectContent}
                onAddModule={() => openModuleDialog()}
                onAddSection={(moduleId, orderIndex) => {
                  setNewSection(prev => ({
                    ...prev, 
                    module_id: moduleId,
                    order_index: orderIndex
                  }));
                  openSectionDialog();
                }}
              />
            </div>
          )}
          
          {/* Main Content Area */}
          <div className={showSidebar ? "md:w-3/4 lg:w-4/5" : "w-full"}>
            <Tabs 
              defaultValue="modules" 
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid grid-cols-2 mb-8">
                <TabsTrigger value="modules">
                  <Folder className="h-4 w-4 mr-2" />
                  Modules
                </TabsTrigger>
                <TabsTrigger value="sections">
                  <File className="h-4 w-4 mr-2" />
                  Sections
                </TabsTrigger>
              </TabsList>
              
              {/* Modules Tab */}
              <TabsContent value="modules" className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <h2 className="text-xl font-semibold">Course Modules</h2>
                  
                  <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search modules..."
                        className="pl-8"
                        value={moduleSearchQuery}
                        onChange={(e) => setModuleSearchQuery(e.target.value)}
                      />
                    </div>
                    
                    <Button onClick={() => {
                      setModuleSearchQuery('');
                      navigate('/admin/module/new');
                    }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Module
                    </Button>
                  </div>
                </div>
                
                {isLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin h-6 w-6 border-2 border-primary rounded-full border-t-transparent" />
                    <span className="ml-2">Loading modules...</span>
                  </div>
                ) : modules.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Folder className="h-12 w-12 text-muted-foreground mb-4" />
                      {moduleSearchQuery ? (
                        <p className="text-muted-foreground mb-4">No modules found matching "{moduleSearchQuery}"</p>
                      ) : (
                        <p className="text-muted-foreground mb-4">No modules found</p>
                      )}
                      <Button onClick={() => {
                        setModuleSearchQuery('');
                        setTimeout(() => openModuleDialog(), 100);
                      }}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Your First Module
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    <PaginationControls 
                      pagination={modulesPagination}
                      onPageChange={(page) => setModulesPagination(prev => ({ ...prev, page }))}
                      itemCount={modules.length}
                      itemName="modules"
                    />
                    
                    <div className="grid gap-4">
                      {modules.map((module) => (
                        <Card key={module.id}>
                          <CardHeader>
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle>{module.title}</CardTitle>
                                <CardDescription>
                                  {module.description || 'No description'}
                                </CardDescription>
                              </div>
                              <div className="flex space-x-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => navigate(`/admin/module/${module.id}`)}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDuplicateModule(module.id)}
                                  disabled={isDuplicating}
                                  className={duplicateError ? 'border-red-500' : ''}
                                >
                                  {isDuplicating ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : duplicateError ? (
                                    <ExclamationTriangleIcon className="h-4 w-4 text-red-500 mr-1" />
                                  ) : (
                                    <Copy className="h-4 w-4 mr-1" />
                                  )}
                                  Duplicate
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => navigate(`/admin/content/backup?type=module&id=${module.id}&autoBackup=true`)}
                                >
                                  <DownloadCloud className="h-4 w-4 mr-2" />
                                  Backup
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="text-destructive"
                                  onClick={() => openDeleteDialog('module', module.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground">
                              Order: {module.order_index}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Sections: {sections.filter(s => s.module_id === module.id).length}
                            </p>
                          </CardContent>
                          <CardFooter>
                            <Button 
                              variant="ghost" 
                              onClick={() => {
                                setNewSection(prev => ({...prev, module_id: module.id}));
                                setActiveTab('sections');
                              }}
                            >
                              View Sections
                            </Button>
                            <Button 
                              variant="outline"
                              className="ml-auto"
                              onClick={() => navigate(`/admin/section/new?moduleId=${module.id}`)}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Section
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                    
                    <PaginationControls 
                      pagination={modulesPagination}
                      onPageChange={(page) => setModulesPagination(prev => ({ ...prev, page }))}
                      itemCount={modules.length}
                      itemName="modules"
                    />
                  </>
                )}
              </TabsContent>
              
              {/* Sections Tab */}
              <TabsContent value="sections" className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <h2 className="text-xl font-semibold">Course Sections</h2>
                  
                  <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search sections..."
                        className="pl-8"
                        value={sectionSearchQuery}
                        onChange={(e) => setSectionSearchQuery(e.target.value)}
                      />
                    </div>
                    
                    <select 
                      className="h-10 w-full md:w-auto rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={sectionFilterModule}
                      onChange={(e) => {
                        setSectionFilterModule(e.target.value);
                        setSectionsPagination(prev => ({ ...prev, page: 1 })); // Reset page when changing filter
                      }}
                    >
                      <option value="all">All Modules</option>
                      {modules.map(module => (
                        <option key={module.id} value={module.id}>
                          {module.title}
                        </option>
                      ))}
                    </select>
                    
                    <Button onClick={() => openSectionDialog()}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Section
                    </Button>
                  </div>
                </div>
                
                {isLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin h-6 w-6 border-2 border-primary rounded-full border-t-transparent" />
                    <span className="ml-2">Loading sections...</span>
                  </div>
                ) : sections.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <File className="h-12 w-12 text-muted-foreground mb-4" />
                      {sectionSearchQuery || sectionFilterModule !== 'all' ? (
                        <p className="text-muted-foreground mb-4">No sections found matching your filters</p>
                      ) : (
                        <p className="text-muted-foreground mb-4">No sections found</p>
                      )}
                      <Button onClick={() => navigate('/admin/section/new')}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Section
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    <div>
                      {/* Group sections by module */}
                      {sectionFilterModule === 'all' ? (
                        // When showing all modules, group by module
                        modules.map(module => {
                          const moduleSections = sections.filter(s => s.module_id === module.id);
                          
                          if (moduleSections.length === 0) return null;
                          
                          return (
                            <div key={module.id} className="mb-8">
                              <div className="flex items-center mb-4">
                                <h3 className="text-lg font-medium">{module.title}</h3>
                                <Button 
                                  variant="ghost"
                                  size="sm"
                                  className="ml-2"
                                  onClick={() => navigate(`/admin/section/new?moduleId=${module.id}`)}
                                >
                                  <Plus className="h-4 w-4 mr-1" />
                                  Add Section
                                </Button>
                              </div>
                              <div className="grid gap-4">
                                {moduleSections.map(section => (
                                  <Card key={section.id}>
                                    <CardHeader>
                                      <div className="flex justify-between items-start">
                                        <div>
                                          <CardTitle>{section.title}</CardTitle>
                                          <CardDescription>
                                            {section.duration ? `Duration: ${section.duration}` : 'No duration set'}
                                          </CardDescription>
                                        </div>
                                        <div className="flex space-x-2">
                                          <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => navigate(`/admin/section/${section.id}`)}
                                          >
                                            <Edit className="h-4 w-4 mr-2" />
                                            Edit
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDuplicateSection(section.id)}
                                            disabled={isDuplicating}
                                            className={duplicateError ? 'border-red-500' : ''}
                                          >
                                            {isDuplicating ? (
                                              <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : duplicateError ? (
                                              <ExclamationTriangleIcon className="h-4 w-4 text-red-500 mr-1" />
                                            ) : (
                                              <Copy className="h-4 w-4 mr-1" />
                                            )}
                                            Duplicate
                                          </Button>
                                          <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => navigate(`/admin/content/backup?type=section&id=${section.id}&autoBackup=true`)}
                                          >
                                            <DownloadCloud className="h-4 w-4 mr-2" />
                                            Backup
                                          </Button>
                                          <Button 
                                            variant="outline" 
                                            size="sm"
                                            className="text-destructive"
                                            onClick={() => openDeleteDialog('section', section.id)}
                                          >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete
                                          </Button>
                                        </div>
                                      </div>
                                    </CardHeader>
                                    <CardContent>
                                      <p className="text-sm text-muted-foreground">
                                        Order: {section.order_index}
                                      </p>
                                      <Separator className="my-4" />
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        // When filtering by a specific module, show sections directly
                        <div className="grid gap-4">
                          {sections.map(section => (
                            <Card key={section.id}>
                              <CardHeader>
                                <div className="flex justify-between items-start">
                                  <div>
                                    <CardTitle>{section.title}</CardTitle>
                                    <CardDescription>
                                      {section.duration ? `Duration: ${section.duration}` : 'No duration set'}
                                    </CardDescription>
                                  </div>
                                  <div className="flex space-x-2">
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => navigate(`/admin/section/${section.id}`)}
                                    >
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleDuplicateSection(section.id)}
                                      disabled={isDuplicating}
                                      className={duplicateError ? 'border-red-500' : ''}
                                    >
                                      {isDuplicating ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : duplicateError ? (
                                        <ExclamationTriangleIcon className="h-4 w-4 text-red-500 mr-1" />
                                      ) : (
                                        <Copy className="h-4 w-4 mr-1" />
                                      )}
                                      Duplicate
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => navigate(`/admin/content/backup?type=section&id=${section.id}&autoBackup=true`)}
                                    >
                                      <DownloadCloud className="h-4 w-4 mr-2" />
                                      Backup
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      className="text-destructive"
                                      onClick={() => openDeleteDialog('section', section.id)}
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </Button>
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent>
                                <p className="text-sm text-muted-foreground">
                                  Order: {section.order_index}
                                </p>
                                <Separator className="my-4" />
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <PaginationControls 
                      pagination={sectionsPagination}
                      onPageChange={(page) => setSectionsPagination(prev => ({ ...prev, page }))}
                      itemCount={sections.length}
                      itemName="sections"
                    />
                  </>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      
      {/* Module Dialog */}
      <Dialog open={showModuleDialog} onOpenChange={setShowModuleDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {selectedModule ? 'Edit Module' : 'Create Module'}
            </DialogTitle>
            <DialogDescription>
              {selectedModule 
                ? 'Update the details of this course module' 
                : 'Add a new module to your course'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input 
                id="title" 
                value={newModule.title}
                onChange={(e) => setNewModule({...newModule, title: e.target.value})}
                placeholder="Module Title"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                value={newModule.description}
                onChange={(e) => setNewModule({...newModule, description: e.target.value})}
                placeholder="Module Description"
                rows={4}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="order">Order</Label>
              <Input 
                id="order" 
                type="number"
                value={newModule.order_index}
                onChange={(e) => setNewModule({...newModule, order_index: parseInt(e.target.value) || 0})}
                min={0}
              />
              <p className="text-xs text-muted-foreground">
                Determines the display order of this module (lower numbers shown first)
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModuleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveModule} disabled={!newModule.title}>
              {selectedModule ? 'Update Module' : 'Create Module'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Section Dialog */}
      <Dialog open={showSectionDialog} onOpenChange={setShowSectionDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {selectedSection ? 'Edit Section' : 'Create Section'}
            </DialogTitle>
            <DialogDescription>
              {selectedSection 
                ? 'Update the details of this section' 
                : 'Add a new section to your course'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="module_id">Module</Label>
              <select 
                id="module_id" 
                value={newSection.module_id}
                onChange={(e) => setNewSection({...newSection, module_id: e.target.value})}
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
              <Label htmlFor="title">Title</Label>
              <Input 
                id="title" 
                value={newSection.title}
                onChange={(e) => setNewSection({...newSection, title: e.target.value})}
                placeholder="Section Title"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <div data-color-mode={colorMode}>
                <MDEditor
                  value={newSection.content}
                  onChange={(value) => setNewSection({...newSection, content: value || ''})}
                  preview="edit"
                  height={300}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Use Markdown to format your content. Supports headings, lists, links, code blocks, and more.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Input 
                id="duration" 
                value={newSection.duration}
                onChange={(e) => setNewSection({...newSection, duration: e.target.value})}
                placeholder="e.g. 10 min"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="order">Order</Label>
              <Input 
                id="order" 
                type="number"
                value={newSection.order_index}
                onChange={(e) => setNewSection({...newSection, order_index: parseInt(e.target.value) || 0})}
                min={0}
              />
              <p className="text-xs text-muted-foreground">
                Determines the display order within this module (lower numbers shown first)
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSectionDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveSection} 
              disabled={!newSection.title || !newSection.module_id}
            >
              {selectedSection ? 'Update Section' : 'Create Section'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this {deleteType}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-destructive font-medium">
              Warning: {deleteType === 'module' && 'This will also delete all sections within this module.'}
            </p>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete {deleteType}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 