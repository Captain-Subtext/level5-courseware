import { supabase } from './supabase';
import { User } from '@supabase/supabase-js';

// User profile functions
export async function getUserProfile() {
  const { data: user } = await supabase.auth.getUser();
  
  if (!user) return null;
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.user.id)
    .single();
    
  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
  
  return data;
}

export async function updateUserProfile(updates: Partial<User & {
  nickname?: string;
  avatar_color?: string;
  email_preferences?: {
    courseUpdates: boolean;
    newContent: boolean;
    accountChanges: boolean;
    marketing: boolean;
  };
}>) {
  const { data: user } = await supabase.auth.getUser();
  
  if (!user) return { error: 'Not authenticated' };
  
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.user.id)
    .select()
    .single();
    
  return { data, error };
}

// Course content functions
export async function getCourseModules() {
  const { data, error } = await supabase
    .from('modules')
    .select('*')
    .order('order_index', { ascending: true });
    
  if (error) {
    console.error('Error fetching modules:', error);
    return [];
  }
  
  return data || [];
}

export async function getModuleSections(moduleId: string) {
  const { data, error } = await supabase
    .from('sections')
    .select('*')
    .eq('module_id', moduleId)
    .order('order_index', { ascending: true });
    
  if (error) {
    console.error('Error fetching sections:', error);
    return [];
  }
  
  return data || [];
}

export async function getSectionContent(sectionId: string) {
  const { data, error } = await supabase
    .from('sections')
    .select('*')
    .eq('id', sectionId)
    .single();
    
  if (error) {
    console.error('Error fetching section content:', error);
    return null;
  }
  
  return data;
}

// User progress functions
export async function getUserProgress() {
  const { data: user } = await supabase.auth.getUser();
  
  if (!user) return [];
  
  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', user.user.id);
    
  if (error) {
    console.error('Error fetching user progress:', error);
    return [];
  }
  
  return data || [];
}

export async function updateSectionProgress(sectionId: string, completed: boolean) {
  const { data: user } = await supabase.auth.getUser();
  
  if (!user) return { error: 'Not authenticated' };
  
  // Check if progress entry exists
  const { data: existingProgress } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', user.user.id)
    .eq('section_id', sectionId)
    .maybeSingle();
    
  if (existingProgress) {
    // Update existing progress
    const { data, error } = await supabase
      .from('user_progress')
      .update({
        completed,
        completed_at: completed ? new Date().toISOString() : null
      })
      .eq('id', existingProgress.id)
      .select()
      .single();
      
    return { data, error };
  } else {
    // Insert new progress
    const { data, error } = await supabase
      .from('user_progress')
      .insert({
        user_id: user.user.id,
        section_id: sectionId,
        completed,
        completed_at: completed ? new Date().toISOString() : null
      })
      .select()
      .single();
      
    return { data, error };
  }
}

// Get complete course content with user progress
export async function getFullCourseContent() {
  const modules = await getCourseModules();
  const { data: user } = await supabase.auth.getUser();
  
  if (!modules.length) return [];
  
  // If user is authenticated, get their progress and profile for subscription info
  let userProgress: Record<string, boolean> = {};
  let userSubscriptionTier = 'free'; // Default to free tier
  
  if (user?.user) {
    // Get user progress
    const progress = await getUserProgress();
    progress.forEach(item => {
      userProgress[item.section_id] = item.completed;
    });
    
    // Get user subscription tier
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.user.id)
      .single();
      
    if (profile?.subscription_tier) {
      userSubscriptionTier = profile.subscription_tier;
    }
  }
  
  // Get all sections for all modules
  const { data: allSections, error } = await supabase
    .from('sections')
    .select('*')
    .order('order_index', { ascending: true });
    
  if (error) {
    console.error('Error fetching sections:', error);
    return modules;
  }
  
  // Group sections by module
  const sectionsByModule: Record<string, any[]> = {};
  allSections?.forEach(section => {
    if (!sectionsByModule[section.module_id]) {
      sectionsByModule[section.module_id] = [];
    }
    sectionsByModule[section.module_id].push({
      ...section,
      completed: userProgress[section.id] || false
    });
  });
  
  // Add sections to each module and calculate completion status
  const modulesWithSections = modules.map((module, index) => {
    const sections = sectionsByModule[module.id] || [];
    const completedSections = sections.filter(section => section.completed).length;
    const isCompleted = sections.length > 0 && completedSections === sections.length;
    
    // Determine access based on subscription tier
    let hasAccess = true;
    
    // If user is on free tier, they can only access Module 1 (index 0)
    if (userSubscriptionTier === 'free' && index > 0) {
      hasAccess = false;
    }
    
    return {
      ...module,
      sections,
      completed: isCompleted,
      progress: sections.length ? Math.round((completedSections / sections.length) * 100) : 0,
      hasAccess: hasAccess
    };
  });
  
  return modulesWithSections;
}

// Get user's bookmark (last viewed position)
export async function getUserBookmark() {
  const { data: user } = await supabase.auth.getUser();
  
  if (!user) return null;
  
  const { data, error } = await supabase
    .from('user_bookmarks')
    .select('*')
    .eq('user_id', user.user.id)
    .order('timestamp', { ascending: false })
    .limit(1)
    .maybeSingle();
  
  if (error) {
    console.error('Error fetching user bookmark:', error);
    return null;
  }
  
  return data;
}

// Get user's bookmark for a specific module
export async function getModuleBookmark(moduleId: string) {
  const { data: user } = await supabase.auth.getUser();
  
  if (!user) return null;
  
  const { data, error } = await supabase
    .from('user_bookmarks')
    .select('*')
    .eq('user_id', user.user.id)
    .eq('module_id', moduleId)
    .single();
  
  if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" which is fine
    console.error('Error fetching module bookmark:', error);
  }
  
  return data || null;
}

// Save or update bookmark (last viewed position)
export async function updateBookmark(moduleId: string, sectionId: string) {
  const { data: user } = await supabase.auth.getUser();
  
  if (!user) return { error: 'Not authenticated' };
  
  // Check if bookmark exists for this module
  const { data: existingBookmark } = await supabase
    .from('user_bookmarks')
    .select('*')
    .eq('user_id', user.user.id)
    .eq('module_id', moduleId)
    .maybeSingle();
    
  if (existingBookmark) {
    // Update existing bookmark
    const { data, error } = await supabase
      .from('user_bookmarks')
      .update({
        section_id: sectionId,
        timestamp: new Date().toISOString()
      })
      .eq('id', existingBookmark.id)
      .select()
      .single();
      
    return { data, error };
  } else {
    // Insert new bookmark
    const { data, error } = await supabase
      .from('user_bookmarks')
      .insert({
        user_id: user.user.id,
        module_id: moduleId,
        section_id: sectionId
      })
      .select()
      .single();
      
    return { data, error };
  }
}

// Duplicate a module (admin only)
export async function duplicateModule(moduleId: string) {
  try {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user) return { error: 'Not authenticated' };

    // console.log('Checking admin status for user:', user.user.id);
    
    // First approach: Use direct RPC call to the is_admin function
    const { data: isAdminData } = await supabase.rpc('is_admin', {
      user_id: user.user.id
    });
    
    // console.log('is_admin RPC result:', { isAdminData });
    
    if (isAdminData === true) {
      // console.log('User is admin via is_admin function');
    } else {
      // Fallback approaches
      // 1. Check roles table directly
      const { data: roleData } = await supabase
        .from('roles')
        .select('role')
        .eq('user_id', user.user.id)
        .eq('role', 'admin')
        .single();
        
      // 2. Check profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.user.id)
        .single();
      
      // Combine all possible ways to determine admin status
      const hasAdminRole = !!roleData;
      const isAdmin = isAdminData === true || 
                     hasAdminRole || 
                     user.user.app_metadata?.is_admin === true || 
                     profile?.is_admin === true || 
                     profile?.role === 'admin';
      
      // console.log('Admin check results:', { 
      //   isAdminFunction: isAdminData,
      //   hasAdminRole, 
      //   appMetadataAdmin: user.user.app_metadata?.is_admin, 
      //   profileAdmin: profile?.is_admin, 
      //   profileRole: profile?.role,
      //   isAdmin
      // });

      if (!isAdmin) {
        return { error: 'Admin access required. You do not have permission to perform this action.' };
      }
    }
    
    // Get the module to duplicate
    const { data: moduleData } = await supabase
      .from('modules')
      .select('*')
      .eq('id', moduleId)
      .single();
      
    if (!moduleData) return { error: 'Module not found' };
    
    // Create a new module as a copy
    const { data: newModule, error: createError } = await supabase
      .from('modules')
      .insert({
        title: `${moduleData.title} (Copy)`,
        description: moduleData.description,
        order_index: moduleData.order_index + 1, // Place it right after the original
      })
      .select()
      .single();
      
    if (createError) throw createError;
    
    // Get sections for the original module
    const { data: sectionsData } = await supabase
      .from('sections')
      .select('*')
      .eq('module_id', moduleId)
      .order('order_index', { ascending: true });
      
    if (!sectionsData || sectionsData.length === 0) return { error: 'Module has no sections' };
    
    // Duplicate all sections if they exist
    const newSections = sectionsData.map(section => ({
      module_id: newModule.id,
      title: section.title,
      content: section.content,
      duration: section.duration,
      order_index: section.order_index,
    }));
    
    const { error: insertError } = await supabase
      .from('sections')
      .insert(newSections);
      
    if (insertError) throw insertError;
    
    return { 
      data: newModule, 
      message: `Module "${moduleData.title}" duplicated successfully with ${sectionsData.length} sections.` 
    };
  } catch (err) {
    console.error('Error duplicating module:', err);
    return { error: 'Failed to duplicate module: ' + (err instanceof Error ? err.message : String(err)) };
  }
}

// Duplicate a section (admin only)
export async function duplicateSection(sectionId: string) {
  try {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user) return { error: 'Not authenticated' };

    // console.log('Checking admin status for user:', user.user.id);
    
    // First approach: Use direct RPC call to the is_admin function
    const { data: isAdminData } = await supabase.rpc('is_admin', {
      user_id: user.user.id
    });
    
    // console.log('is_admin RPC result:', { isAdminData });
    
    if (isAdminData === true) {
      // console.log('User is admin via is_admin function');
    } else {
      // Fallback approaches
      // 1. Check roles table directly
      const { data: roleData } = await supabase
        .from('roles')
        .select('role')
        .eq('user_id', user.user.id)
        .eq('role', 'admin')
        .single();
        
      // 2. Check profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.user.id)
        .single();
      
      // Combine all possible ways to determine admin status
      const hasAdminRole = !!roleData;
      const isAdmin = isAdminData === true || 
                     hasAdminRole || 
                     user.user.app_metadata?.is_admin === true || 
                     profile?.is_admin === true || 
                     profile?.role === 'admin';
      
      // console.log('Admin check results:', { 
      //   isAdminFunction: isAdminData,
      //   hasAdminRole, 
      //   appMetadataAdmin: user.user.app_metadata?.is_admin, 
      //   profileAdmin: profile?.is_admin, 
      //   profileRole: profile?.role,
      //   isAdmin
      // });

      if (!isAdmin) {
        return { error: 'Admin access required. You do not have permission to perform this action.' };
      }
    }
    
    // Get the section to duplicate
    const { data: sectionData } = await supabase
      .from('sections')
      .select('*')
      .eq('id', sectionId)
      .single();
      
    if (!sectionData) return { error: 'Section not found' };
    
    // Create a new section as a copy
    const { data: newSection, error: createError } = await supabase
      .from('sections')
      .insert({
        module_id: sectionData.module_id,
        title: `${sectionData.title} (Copy)`,
        content: sectionData.content,
        duration: sectionData.duration,
        order_index: sectionData.order_index + 1, // Place it right after the original
      })
      .select()
      .single();
      
    if (createError) throw createError;
    
    return { 
      data: newSection, 
      message: `Section "${sectionData.title}" duplicated successfully.` 
    };
  } catch (err) {
    console.error('Error duplicating section:', err);
    return { error: 'Failed to duplicate section: ' + (err instanceof Error ? err.message : String(err)) };
  }
}

// Backup modules and sections
export async function backupContent() {
  try {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user) return { error: 'Not authenticated' };
    
    // console.log('Starting content backup...');
    
    // REMOVED Insecure and non-functional client-side admin check
    // const { data: isAdminData } = await supabase.rpc('is_admin', {
    //   user_id: user.user.id
    // });
    // 
    // if (!isAdminData) {
    //   return { error: 'Admin access required for content backup' };
    // }
    
    // TODO: This should call the backend API endpoint GET /api/admin/backup/content
    // For now, keeping the direct Supabase calls but removing the bad admin check.
    
    // Get all modules
    const { data: modules, error: modulesError } = await supabase
      .from('modules')
      .select('*')
      .order('order_index', { ascending: true });
      
    if (modulesError) {
      throw new Error(`Error fetching modules: ${modulesError.message}`);
    }
    
    // Get all sections
    const { data: sections, error: sectionsError } = await supabase
      .from('sections')
      .select('*')
      .order('order_index', { ascending: true });
      
    if (sectionsError) {
      throw new Error(`Error fetching sections: ${sectionsError.message}`);
    }
    
    // Structure the backup data
    const backupData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      modules: modules || [],
      sections: sections || []
    };
    
    // console.log(`Backup complete: ${modules?.length || 0} modules and ${sections?.length || 0} sections`);
    
    return { 
      success: true, 
      data: backupData,
      message: `Successfully backed up ${modules?.length || 0} modules and ${sections?.length || 0} sections.`
    };
  } catch (error) {
    console.error('Error during content backup:', error);
    return { 
      error: 'Failed to backup content: ' + (error instanceof Error ? error.message : String(error))
    };
  }
}

// Backup a specific module with its sections
export async function backupModule(moduleId: string) {
  try {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user) return { error: 'Not authenticated' };
    
    // console.log(`Starting backup of module ${moduleId}...`);
    
    // REMOVED Insecure and non-functional client-side admin check
    // const { data: isAdminData } = await supabase.rpc('is_admin', {
    //   user_id: user.user.id
    // });
    // 
    // if (!isAdminData) {
    //   return { error: 'Admin access required for module backup' };
    // }
    
    // TODO: This should call a backend API endpoint GET /api/admin/backup/module/:id
    // For now, keeping the direct Supabase calls but removing the bad admin check.

    // Get the module
    const { data: module } = await supabase
      .from('modules')
      .select('*')
      .eq('id', moduleId)
      .single();
      
    if (!module) {
      return { error: 'Module not found' };
    }
    
    // Get the module's sections
    const { data: sections } = await supabase
      .from('sections')
      .select('*')
      .eq('module_id', moduleId)
      .order('order_index', { ascending: true });
      
    if (!sections || sections.length === 0) {
      return { error: 'Module has no sections' };
    }
    
    // Structure the backup data
    const backupData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      type: 'module',
      modules: [module],
      sections: sections || []
    };
    
    // console.log(`Module backup complete: module "${module.title}" with ${sections?.length || 0} sections`);
    
    return { 
      success: true, 
      data: backupData,
      message: `Successfully backed up module "${module.title}" with ${sections?.length || 0} sections.`
    };
  } catch (error) {
    console.error('Error during module backup:', error);
    return { 
      error: 'Failed to backup module: ' + (error instanceof Error ? error.message : String(error))
    };
  }
}

// Backup a specific section
export async function backupSection(sectionId: string) {
  try {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user) return { error: 'Not authenticated' };
    
    // console.log(`Starting backup of section ${sectionId}...`);
    
    // REMOVED Insecure and non-functional client-side admin check
    // const { data: isAdminData } = await supabase.rpc('is_admin', {
    //   user_id: user.user.id
    // });
    // 
    // if (!isAdminData) {
    //   return { error: 'Admin access required for section backup' };
    // }
    
    // TODO: This should call a backend API endpoint GET /api/admin/backup/section/:id
    // For now, keeping the direct Supabase calls but removing the bad admin check.

    // Get the section
    const { data: section } = await supabase
      .from('sections')
      .select('*')
      .eq('id', sectionId)
      .single();
      
    if (!section) {
      return { error: 'Section not found' };
    }
    
    // Get the module this section belongs to (for reference)
    const { data: module } = await supabase
      .from('modules')
      .select('*')
      .eq('id', section.module_id)
      .single();
      
    if (!module) {
      return { error: 'Module not found' };
    }
    
    // Structure the backup data
    const backupData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      type: 'section',
      modules: [module],
      sections: [section]
    };
    
    console.log(`Section backup complete: "${section.title}" from module "${module?.title || 'Unknown'}"`);
    
    return { 
      success: true, 
      data: backupData,
      message: `Successfully backed up section "${section.title}".`
    };
  } catch (error) {
    console.error('Error during section backup:', error);
    return { 
      error: 'Failed to backup section: ' + (error instanceof Error ? error.message : String(error))
    };
  }
}

// Restore modules and sections from backup
export async function restoreContent(backupData: any) {
  try {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user) return { error: 'Not authenticated' };
    
    console.log('Starting content restoration...');
    
    // Check admin status
    const { data: isAdminData } = await supabase.rpc('is_admin', {
      user_id: user.user.id
    });
    
    if (!isAdminData) {
      return { error: 'Admin access required for content restoration' };
    }
    
    // Validate backup data
    if (!backupData || !backupData.modules || !backupData.sections) {
      return { error: 'Invalid backup data format' };
    }
    
    // Create a mapping from old module IDs to new module IDs
    const moduleIdMap = new Map();
    
    // Transaction for restoration
    const { error: transactionError } = await supabase.rpc('restore_content_transaction', {
      backup_data: backupData
    });
    
    if (transactionError) {
      // If RPC transaction fails, try manual restoration
      console.warn('Transaction-based restoration failed, attempting manual restoration:', transactionError);
      
      // Start manual restoration
      // Step 1: Clear existing data (optional, could be configurable)
      // Uncomment if you want to clear existing data before restoration
      /*
      const { error: clearError } = await supabase
        .from('sections')
        .delete()
        .not('id', 'is', null);
        
      if (clearError) {
        throw new Error(`Error clearing sections: ${clearError.message}`);
      }
      
      const { error: clearModulesError } = await supabase
        .from('modules')
        .delete()
        .not('id', 'is', null);
        
      if (clearModulesError) {
        throw new Error(`Error clearing modules: ${clearModulesError.message}`);
      }
      */
      
      // Step 2: Insert modules
      for (const module of backupData.modules) {
        const oldModuleId = module.id;
        
        // Remove ID to let Supabase generate a new one
        const moduleData = { ...module };
        delete moduleData.id;
        
        // Add or update timestamps
        moduleData.created_at = new Date().toISOString();
        moduleData.updated_at = new Date().toISOString();
        
        const { data: newModule, error: insertError } = await supabase
          .from('modules')
          .insert(moduleData)
          .select()
          .single();
          
        if (insertError) {
          throw new Error(`Error inserting module: ${insertError.message}`);
        }
        
        // Store mapping from old ID to new ID
        moduleIdMap.set(oldModuleId, newModule.id);
      }
      
      // Step 3: Insert sections with updated module_id references
      for (const section of backupData.sections) {
        const sectionData = { ...section };
        delete sectionData.id;
        
        // Map the old module_id to the new one
        if (moduleIdMap.has(section.module_id)) {
          sectionData.module_id = moduleIdMap.get(section.module_id);
        } else {
          console.warn(`No mapping found for module_id: ${section.module_id}`);
          // Skip this section if we can't find the corresponding module
          continue;
        }
        
        // Add or update timestamps
        sectionData.created_at = new Date().toISOString();
        sectionData.updated_at = new Date().toISOString();
        
        const { error: insertError } = await supabase
          .from('sections')
          .insert(sectionData);
          
        if (insertError) {
          throw new Error(`Error inserting section: ${insertError.message}`);
        }
      }
    }
    
    console.log('Content restoration complete');
    
    return { 
      success: true, 
      message: `Successfully restored ${backupData.modules.length} modules and ${backupData.sections.length} sections.`
    };
  } catch (error) {
    console.error('Error during content restoration:', error);
    return { 
      error: 'Failed to restore content: ' + (error instanceof Error ? error.message : String(error))
    };
  }
}

// Restore a specific module or section from backup
export async function restorePartialContent(backupData: any) {
  try {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user) return { error: 'Not authenticated' };
    
    console.log('Starting partial content restoration...');
    
    // Check admin status - CORRECTED CALL
    const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin_by_email');
    
    if (adminError) {
      console.error('Error checking admin status:', adminError);
      return { error: 'Failed to verify admin status before restore.' };
    }
    
    if (!isAdmin) {
      return { error: 'Admin access required for content restoration' };
    }
    
    // Validate backup data
    if (!backupData || !backupData.modules || !backupData.sections) {
      return { error: 'Invalid backup data format' };
    }
    
    // Determine the type of backup
    const backupType = backupData.type || 'full';
    console.log(`Restoring ${backupType} backup`);
    
    // For section backups, check if the parent module exists
    if (backupType === 'section') {
      const originalModuleId = backupData.sections[0]?.module_id;
      const originalModuleTitle = backupData.modules[0]?.title;
      
      if (originalModuleId) {
        // Check if a module with the same title exists
        const { data: existingModules, error: moduleError } = await supabase
          .from('modules')
          .select('id, title')
          .eq('title', originalModuleTitle);
          
        if (!moduleError && existingModules && existingModules.length > 0) {
          console.log(`Found existing module "${originalModuleTitle}" to restore section to`);
          
          // We'll restore the section to the first matching module
          const targetModule = existingModules[0];
          
          // Create a copy of the section with the updated module_id
          const sectionData = { ...backupData.sections[0] };
          delete sectionData.id;
          sectionData.module_id = targetModule.id;
          
          // Add "(Restored)" to the section title
          sectionData.title = `${sectionData.title} (Restored)`;
          
          // Find the highest order_index in the target module
          const { data: highestOrderSection, error: orderError } = await supabase
            .from('sections')
            .select('order_index')
            .eq('module_id', targetModule.id)
            .order('order_index', { ascending: false })
            .limit(1);
            
          if (!orderError && highestOrderSection && highestOrderSection.length > 0) {
            // Place the restored section after the highest current order index
            sectionData.order_index = (highestOrderSection[0].order_index || 0) + 1;
          } else {
            // If no existing sections, start at order_index 1
            sectionData.order_index = 1;
          }
          
          // Add timestamps
          sectionData.created_at = new Date().toISOString();
          sectionData.updated_at = new Date().toISOString();
          
          // Insert the section
          const { error: insertError } = await supabase
            .from('sections')
            .insert(sectionData)
            .select()
            .single();
            
          if (insertError) {
            throw new Error(`Error inserting section: ${insertError.message}`);
          }
          
          // Return success message
          const sectionName = sectionData.title;
          const moduleName = targetModule.title;
          return { 
            success: true, 
            message: `Successfully restored section "${sectionName}" to existing module "${moduleName}".`
          };
        }
      }
    }
    
    // If we're here, either it's not a section backup, or we couldn't find a matching module
    // Proceed with the original logic to create new modules
    
    // Create a mapping from old module IDs to new module IDs
    const moduleIdMap = new Map();
    
    // Insert modules
    for (const module of backupData.modules) {
      const oldModuleId = module.id;
      
      // Remove ID to let Supabase generate a new one
      const moduleData = { ...module };
      delete moduleData.id;
      
      // Add or update timestamps
      moduleData.created_at = new Date().toISOString();
      moduleData.updated_at = new Date().toISOString();
      
      // For module restore, append "(Restored)" to title
      if (backupType === 'module' || backupType === 'section') {
        moduleData.title = `${moduleData.title} (Restored)`;
      }
      
      const { data: newModule, error: insertError } = await supabase
        .from('modules')
        .insert(moduleData)
        .select()
        .single();
        
      if (insertError) {
        throw new Error(`Error inserting module: ${insertError.message}`);
      }
      
      // Store mapping from old ID to new ID
      moduleIdMap.set(oldModuleId, newModule.id);
    }
    
    // Insert sections with updated module_id references
    for (const section of backupData.sections) {
      const sectionData = { ...section };
      delete sectionData.id;
      
      // Map the old module_id to the new one
      if (moduleIdMap.has(section.module_id)) {
        sectionData.module_id = moduleIdMap.get(section.module_id);
      } else {
        console.warn(`No mapping found for module_id: ${section.module_id}`);
        // Skip this section if we can't find the corresponding module
        continue;
      }
      
      // Add or update timestamps
      sectionData.created_at = new Date().toISOString();
      sectionData.updated_at = new Date().toISOString();
      
      // For section restore, append "(Restored)" to title
      if (backupType === 'section') {
        sectionData.title = `${sectionData.title} (Restored)`;
      }
      
      const { error: insertError } = await supabase
        .from('sections')
        .insert(sectionData);
        
      if (insertError) {
        throw new Error(`Error inserting section: ${insertError.message}`);
      }
    }
    
    // Generate appropriate success message
    let successMessage = '';
    if (backupType === 'module') {
      const moduleName = backupData.modules[0]?.title || 'Unknown module';
      successMessage = `Successfully restored module "${moduleName}" with ${backupData.sections.length} sections.`;
    } else if (backupType === 'section') {
      const sectionName = backupData.sections[0]?.title || 'Unknown section';
      const moduleName = backupData.modules[0]?.title || 'Unknown module';
      successMessage = `Successfully restored section "${sectionName}" with a new module "${moduleName} (Restored)".`;
    } else {
      successMessage = `Successfully restored ${backupData.modules.length} modules and ${backupData.sections.length} sections.`;
    }
    
    console.log('Partial content restoration complete');
    
    return { 
      success: true, 
      message: successMessage
    };
  } catch (error) {
    console.error('Error during partial content restoration:', error);
    return { 
      error: 'Failed to restore content: ' + (error instanceof Error ? error.message : String(error))
    };
  }
} 