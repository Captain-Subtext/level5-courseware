import { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Folder, File, Plus, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

// Types imported from the Content page
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

interface ContentSidebarProps {
  modules: Module[];
  sections: Section[];
  expandedModules: Record<string, boolean>;
  selectedContent: { type: 'module' | 'section'; id: string } | null;
  onToggleModule: (moduleId: string) => void;
  onSelectContent: (type: 'module' | 'section', id: string) => void;
  onAddModule: () => void;
  onAddSection: (moduleId: string, orderIndex: number) => void;
}

export function ContentSidebar({
  modules,
  sections,
  expandedModules,
  selectedContent,
  onToggleModule,
  onSelectContent,
  onAddModule,
  onAddSection
}: ContentSidebarProps) {
  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-lg">Content Structure</CardTitle>
      </CardHeader>
      <CardContent className="py-2">
        <div className="space-y-1">
          {modules.length === 0 ? (
            <p className="text-sm text-muted-foreground p-2">No modules found</p>
          ) : (
            modules.map(module => {
              const moduleSections = sections.filter(s => s.module_id === module.id);
              const isExpanded = expandedModules[module.id];
              const isSelected = selectedContent?.type === 'module' && selectedContent.id === module.id;
              
              return (
                <div key={module.id} className="space-y-1">
                  <div 
                    className={cn(
                      "flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-secondary",
                      isSelected && "bg-secondary"
                    )}
                    onClick={() => onSelectContent('module', module.id)}
                  >
                    <div className="flex items-center">
                      <Folder className="h-4 w-4 mr-2" />
                      <span className="text-sm">{module.title}</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleModule(module.id);
                      }}
                    >
                      <ChevronDown className={cn("h-4 w-4 transition-transform", isExpanded ? "" : "-rotate-90")} />
                    </Button>
                  </div>
                  
                  {isExpanded && (
                    <div className="ml-4 pl-2 border-l space-y-1">
                      {moduleSections.length === 0 ? (
                        <p className="text-xs text-muted-foreground p-1">No sections</p>
                      ) : (
                        moduleSections.map(section => {
                          const isSectionSelected = selectedContent?.type === 'section' && selectedContent.id === section.id;
                          
                          return (
                            <div 
                              key={section.id}
                              className={cn(
                                "flex items-center p-1 pl-2 rounded-md cursor-pointer hover:bg-secondary text-sm",
                                isSectionSelected && "bg-secondary"
                              )}
                              onClick={() => onSelectContent('section', section.id)}
                            >
                              <File className="h-3 w-3 mr-2" />
                              <span className="text-xs truncate">{section.title}</span>
                            </div>
                          );
                        })
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="w-full h-6 text-xs flex items-center justify-start pl-2 text-muted-foreground"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddSection(module.id, moduleSections.length);
                        }}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Section
                      </Button>
                    </div>
                  )}
                </div>
              );
            })
          )}
          
          <Button 
            variant="outline" 
            size="sm"
            className="w-full mt-2"
            onClick={onAddModule}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Module
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 