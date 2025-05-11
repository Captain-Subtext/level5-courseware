import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, DownloadCloud, UploadCloud, ArrowLeft, RefreshCw, Package, FileText, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { backupContent, restoreContent, backupModule, backupSection, restorePartialContent } from '@/lib/api';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAuth } from '@/lib/auth';

export default function ContentBackup() {
  const { isLoading: isAuthLoading, session } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [backupError, setBackupError] = useState<string | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [backupSuccess, setBackupSuccess] = useState<string | null>(null);
  const [restoreSuccess, setRestoreSuccess] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [backupType, setBackupType] = useState<string>('full');
  const [selectedModuleId, setSelectedModuleId] = useState<string>('');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [modules, setModules] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [sectionsByModule, setSectionsByModule] = useState<Record<string, any[]>>({});
  const [isLoadingContent, setIsLoadingContent] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Fetch modules and sections for selection - NOW depends on auth state
  useEffect(() => {
    // Only run if auth is loaded and user is logged in
    if (!isAuthLoading && session) {
      setIsLoadingContent(true); // Start loading content
      async function fetchModulesAndSections() {
        try {
          setBackupError(null);
          
          // Use direct API calls
          console.log('Using direct data fetching for module and section data');
          await directDataFetch(); // Made await
        } catch (error) {
          console.error('Error fetching content:', error);
          // Attempt direct fetch again on error? Or just report? Let's report.
          setBackupError(`Failed initial load: ${error instanceof Error ? error.message : 'Unknown error'}`);
          // await directDataFetch(); // Avoid potentially looping on error
        } finally {
           setIsLoadingContent(false); // Stop loading content regardless of outcome
        }
      }
      
      // Use direct API calls
      async function directDataFetch() {
        console.log('Using direct data fetching');
        try {
          // Use the API functions directly instead of fetch
          const modulesResult = await backupContent();
          
          // Check for specific admin access error
          if (modulesResult.error?.includes('Admin access required')) {
              setBackupError('Admin access required for content backup. Please ensure you are logged in as an administrator.');
              return; // Stop further processing
          } else if (modulesResult.error || !modulesResult.data) {
            setBackupError(`Failed to load content: ${modulesResult.error || 'Unknown error'}`);
            return;
          }
          
          // Extract modules and sections from the backup data
          const modulesData = modulesResult.data.modules || [];
          const sectionsData = modulesResult.data.sections || [];
          
          setModules(modulesData);
          setSections(sectionsData);
          
          // Organize sections by module
          const sectionMap: Record<string, any[]> = {};
          sectionsData.forEach((section: any) => {
            if (!sectionMap[section.module_id]) {
              sectionMap[section.module_id] = [];
            }
            sectionMap[section.module_id].push(section);
          });
          setSectionsByModule(sectionMap);
          
          console.log('Direct data fetch successful');
        } catch (error) {
          console.error('Direct data fetch failed:', error);
          setBackupError(`Failed to load content: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      fetchModulesAndSections();
    } else if (!isAuthLoading && !session) {
        // Handle case where user is not logged in after auth check
        setBackupError("Authentication required. Please log in.");
        setIsLoadingContent(false);
    }
    // Dependency: Run when auth loading state changes or session status changes
  }, [isAuthLoading, session]);

  // Check URL parameters on initial load
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const type = params.get('type');
    const id = params.get('id');
    
    if (type === 'module' && id) {
      setBackupType('module');
      setSelectedModuleId(id);
    } else if (type === 'section' && id) {
      setBackupType('section');
      
      // We'll need to fetch the module ID for this section
      async function getModuleForSection(sectionId: string) {
        try {
          // Skip fetch attempt and use direct API call
          directGetSection(sectionId);
        } catch (error) {
          console.error('Error fetching section details:', error);
          directGetSection(sectionId);
        }
      }
      
      // Use direct API call
      async function directGetSection(sectionId: string) {
        console.log('Using direct section data fetching');
        try {
          // Use the backup function and extract data about this section
          const result = await backupSection(sectionId);
          
          if (result.error || !result.data) {
            setBackupError(`Failed to load section: ${result.error || 'Unknown error'}`);
            return;
          }
          
          // The section should be in the data
          const section = result.data.sections[0];
          if (section && section.module_id) {
            setSelectedModuleId(section.module_id);
            setSelectedSectionId(sectionId);
          } else {
            setBackupError('Failed to find section details');
          }
        } catch (error) {
          console.error('Direct section fetch failed:', error);
          setBackupError(`Failed to load section: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      getModuleForSection(id);
    }
  }, [location]);

  // Auto-trigger backup if we received direct parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const type = params.get('type');
    const autoBackup = params.get('autoBackup');
    
    // Only auto-backup if explicitly requested and we have all necessary data
    if (autoBackup === 'true') {
      const id = params.get('id'); // Get id only if needed for auto-backup
      if ((type === 'module' && selectedModuleId && id === selectedModuleId) || 
          (type === 'section' && selectedSectionId && id === selectedSectionId)) {
        // Clear parameters before backing up to avoid loops
        navigate('/admin/content/backup', { replace: true });
        // Short delay to ensure state is updated
        const timeoutId = setTimeout(() => {
          handleBackup();
        }, 300);
        
        return () => clearTimeout(timeoutId);
      }
    }
  }, [selectedModuleId, selectedSectionId, location]);

  // Handle module selection change - reset section selection
  function handleModuleChange(moduleId: string) {
    setSelectedModuleId(moduleId);
    setSelectedSectionId('');
  }

  async function handleBackup() {
    try {
      setIsBackingUp(true);
      setBackupError(null);
      setBackupSuccess(null);
      
      let result;
      
      switch (backupType) {
        case 'module':
          if (!selectedModuleId) {
            setBackupError('Please select a module to backup');
            return;
          }
          result = await backupModule(selectedModuleId);
          break;
        case 'section':
          if (!selectedSectionId) {
            setBackupError('Please select a section to backup');
            return;
          }
          result = await backupSection(selectedSectionId);
          break;
        default:
          result = await backupContent();
          break;
      }
      
      if (result.error) {
        setBackupError(result.error);
        toast({
          title: 'Backup Failed',
          description: result.error,
          variant: 'destructive'
        });
        return;
      }
      
      if (result.data) {
        // Generate a descriptive filename based on backup type
        let filename = 'content-backup';
        if (backupType === 'module') {
          const moduleName = modules.find(m => m.id === selectedModuleId)?.title || 'module';
          filename = `module-${moduleName.toLowerCase().replace(/\s+/g, '-')}`;
        } else if (backupType === 'section') {
          const sectionName = sections.find(s => s.id === selectedSectionId)?.title || 'section';
          filename = `section-${sectionName.toLowerCase().replace(/\s+/g, '-')}`;
        }
        
        // Convert to JSON string
        const jsonString = JSON.stringify(result.data, null, 2);
        
        // Create blob and download link
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 0);
        
        setBackupSuccess(result.message || 'Backup completed successfully');
        toast({
          title: 'Backup Complete',
          description: result.message || 'Content backup was created successfully'
        });
      }
    } catch (error) {
      console.error('Error during backup:', error);
      setBackupError(error instanceof Error ? error.message : 'Unknown error occurred');
      toast({
        title: 'Backup Failed',
        description: 'An unexpected error occurred during backup',
        variant: 'destructive'
      });
    } finally {
      setIsBackingUp(false);
    }
  }
  
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setRestoreError(null);
    }
  }
  
  async function handleRestore() {
    try {
      if (!selectedFile) {
        setRestoreError('Please select a backup file first');
        return;
      }
      
      setIsRestoring(true);
      setRestoreError(null);
      setRestoreSuccess(null);
      
      // Read the file
      const fileContent = await readFileAsJson(selectedFile);
      
      if (!fileContent) {
        setRestoreError('Invalid JSON file or file could not be read');
        return;
      }
      
      // Confirm before proceeding
      if (!window.confirm('Are you sure you want to restore this content? This operation cannot be undone and may affect existing content.')) {
        setIsRestoring(false);
        return;
      }
      
      // Determine if it's a partial restore (module or section) based on file content
      const isPartial = fileContent.type === 'module' || fileContent.type === 'section';
      
      // Call the appropriate restore function
      const result = isPartial 
        ? await restorePartialContent(fileContent)
        : await restoreContent(fileContent);
      
      if (result.error) {
        setRestoreError(result.error);
        toast({
          title: 'Restore Failed',
          description: result.error,
          variant: 'destructive'
        });
        return;
      }
      
      setRestoreSuccess(result.message || 'Content was restored successfully');
      toast({
        title: 'Restore Complete',
        description: result.message || 'Content was restored successfully'
      });
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setSelectedFile(null);
      
    } catch (error) {
      console.error('Error during restore:', error);
      setRestoreError(error instanceof Error ? error.message : 'Unknown error occurred');
      toast({
        title: 'Restore Failed',
        description: 'An unexpected error occurred during restore',
        variant: 'destructive'
      });
    } finally {
      setIsRestoring(false);
    }
  }
  
  function readFileAsJson(file: File): Promise<any> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const jsonData = JSON.parse(event.target?.result as string);
          resolve(jsonData);
        } catch (error) {
          reject(new Error('Invalid JSON file'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Error reading file'));
      };
      
      reader.readAsText(file);
    });
  }

  // Render icon based on backup type
  function getBackupTypeIcon() {
    switch(backupType) {
      case 'module':
        return <Package className="h-4 w-4 mr-2" />;
      case 'section':
        return <FileText className="h-4 w-4 mr-2" />;
      default:
        return <DownloadCloud className="h-4 w-4 mr-2" />;
    }
  }

  // Show loading indicator while auth or content is loading
  if (isAuthLoading || isLoadingContent) {
      return (
          <div className="container mx-auto px-4 py-6 flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading Content Backup...</span>
          </div>
      );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/admin/content')}
          className="mr-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Content
        </Button>
        <h1 className="text-2xl font-bold">Content Backup & Restore</h1>
      </div>
      
      <Tabs defaultValue="backup" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="backup">Backup Content</TabsTrigger>
          <TabsTrigger value="restore">Restore Content</TabsTrigger>
        </TabsList>
        
        <TabsContent value="backup">
          <Card>
            <CardHeader>
              <CardTitle>Backup Course Content</CardTitle>
              <CardDescription>
                Create a backup of your course content. You can backup everything or select specific modules or sections.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {backupError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{backupError}</AlertDescription>
                </Alert>
              )}
              
              {backupSuccess && (
                <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
                  <AlertTitle>Success</AlertTitle>
                  <AlertDescription>{backupSuccess}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-4">
                <RadioGroup
                  value={backupType}
                  onValueChange={setBackupType}
                  className="flex flex-col space-y-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="full" id="full" />
                    <Label htmlFor="full">Full Backup (All Content)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="module" id="module" />
                    <Label htmlFor="module">Single Module</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="section" id="section" />
                    <Label htmlFor="section">Single Section</Label>
                  </div>
                </RadioGroup>
                
                {backupType === 'module' && (
                  <div className="mt-4">
                    <Label htmlFor="module-select" className="block mb-2">Select Module</Label>
                    <Select 
                      value={selectedModuleId} 
                      onValueChange={handleModuleChange}
                    >
                      <SelectTrigger id="module-select">
                        <SelectValue placeholder="Select a module" />
                      </SelectTrigger>
                      <SelectContent>
                        {modules.length === 0 && !isLoadingContent && (
                           <SelectItem value="none" disabled>No modules found or failed to load.</SelectItem>
                        )}
                        {modules.map((module) => (
                          <SelectItem key={module.id} value={module.id}>
                            {module.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                {backupType === 'section' && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="module-filter" className="block mb-2">Select Module</Label>
                      <Select 
                        value={selectedModuleId} 
                        onValueChange={handleModuleChange}
                      >
                        <SelectTrigger id="module-filter">
                          <SelectValue placeholder="Select a module first" />
                        </SelectTrigger>
                        <SelectContent>
                          {modules.map((module) => (
                            <SelectItem key={module.id} value={module.id}>
                              {module.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {selectedModuleId && (
                      <div>
                        <Label htmlFor="section-select" className="block mb-2">Select Section</Label>
                        <Select 
                          value={selectedSectionId} 
                          onValueChange={setSelectedSectionId}
                          disabled={!selectedModuleId}
                        >
                          <SelectTrigger id="section-select">
                            <SelectValue placeholder="Select a section" />
                          </SelectTrigger>
                          <SelectContent>
                            {(sectionsByModule[selectedModuleId]?.length ?? 0) === 0 && !isLoadingContent && (
                              <SelectItem value="none" disabled>
                                {selectedModuleId ? 'No sections in this module or failed to load.' : 'Select a module first.'}
                              </SelectItem>
                            )}
                            {sectionsByModule[selectedModuleId]?.map((section) => (
                              <SelectItem key={section.id} value={section.id}>
                                {section.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="mt-4">
                  <p className="font-medium mb-2">The backup will include:</p>
                  <ul className="list-disc pl-5 mb-4 space-y-1">
                    {backupType === 'full' && (
                      <>
                        <li>All course modules with their metadata</li>
                        <li>All sections with their content</li>
                        <li>Order and structure of your course</li>
                      </>
                    )}
                    {backupType === 'module' && (
                      <>
                        <li>The selected module with its metadata</li>
                        <li>All sections belonging to this module</li>
                        <li>Order information for proper restoration</li>
                      </>
                    )}
                    {backupType === 'section' && (
                      <>
                        <li>The selected section with its content</li>
                        <li>The parent module (for reference)</li>
                        <li>Order information for proper restoration</li>
                      </>
                    )}
                  </ul>
                </div>
                
                <p className="text-amber-600 text-sm mb-4">
                  Note: User data, progress tracking, and comments are not included in this backup.
                </p>

                {backupType === 'section' && (
                  <div className="bg-blue-50 p-3 rounded-md border border-blue-200 text-blue-700 text-sm mb-4">
                    <strong>Restoration Info:</strong> When restoring a section, the system will check if the original module exists.
                    If found, the section will be added to that module. If not, a new module will be created.
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleBackup} 
                disabled={isBackingUp || 
                  (backupType === 'module' && !selectedModuleId) || 
                  (backupType === 'section' && !selectedSectionId)}
                className="w-full"
              >
                {isBackingUp ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Creating Backup...
                  </>
                ) : (
                  <>
                    {getBackupTypeIcon()}
                    Download {backupType === 'full' ? 'Full' : backupType === 'module' ? 'Module' : 'Section'} Backup
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="restore">
          <Card>
            <CardHeader>
              <CardTitle>Restore Course Content</CardTitle>
              <CardDescription>
                Restore your course content from a previously created backup file.
                The system will automatically detect if it's a full, module, or section backup.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {restoreError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{restoreError}</AlertDescription>
                </Alert>
              )}
              
              {restoreSuccess && (
                <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
                  <AlertTitle>Success</AlertTitle>
                  <AlertDescription>{restoreSuccess}</AlertDescription>
                </Alert>
              )}
              
              <div className="mb-4">
                <label htmlFor="file-upload" className="block text-sm font-medium mb-2">
                  Select Backup File
                </label>
                <Input
                  ref={fileInputRef}
                  id="file-upload"
                  type="file"
                  accept=".json"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
                {selectedFile && (
                  <p className="text-sm mt-2">
                    Selected: <span className="font-medium">{selectedFile.name}</span> ({formatFileSize(selectedFile.size)})
                  </p>
                )}
              </div>
              
              <Alert className="mb-4 bg-amber-50 text-amber-800 border-amber-200">
                <AlertTitle>Important</AlertTitle>
                <AlertDescription>
                  <p className="mb-2">Restoring content will:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Add the content from the backup file</li>
                    <li>Generate new IDs for all imported content</li>
                    <li>Not remove or modify any existing content</li>
                    {backupType === 'section' ? (
                      <li>Look for a matching module by title. If found, the section will be restored to that module; otherwise, a new module will be created.</li>
                    ) : (
                      <li>For module or section backups, restored items will have "(Restored)" in their titles</li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row gap-2">
              <Button 
                onClick={handleRestore} 
                disabled={isRestoring || !selectedFile}
                className="w-full"
              >
                {isRestoring ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Restoring...
                  </>
                ) : (
                  <>
                    <UploadCloud className="h-4 w-4 mr-2" />
                    Restore Content
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' bytes';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
} 