import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark'; // The actual theme after resolving 'system'
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Helper to get system preference
const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

// Apply theme to document
const applyThemeToDocument = (theme: 'light' | 'dark') => {
  if (typeof window === 'undefined') return;
  
  // Get the document element
  const root = window.document.documentElement;
  
  // Remove both classes first
  root.classList.remove('light', 'dark');
  
  // Add appropriate class
  root.classList.add(theme);
  
  // For debugging
  console.debug(`[ThemeProvider] Applied theme: ${theme}`);
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Initialize theme from localStorage or system preference
  const [theme, setTheme] = useState<Theme>(() => {
    // Check if running in browser environment
    if (typeof window === 'undefined') return 'system';
    
    // Get saved theme from localStorage
    const savedTheme = localStorage.getItem('theme') as Theme;
    
    // If valid saved theme, use it
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      return savedTheme;
    }
    
    // Default to system
    return 'system';
  });
  
  // Track the resolved theme (actual light/dark value after considering system preference)
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(
    theme === 'system' ? getSystemTheme() : theme as 'light' | 'dark'
  );

  // Update the document element class when theme changes
  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined') return;
    
    const actualTheme = theme === 'system' ? getSystemTheme() : theme;
    
    // Set the resolved theme
    setResolvedTheme(actualTheme as 'light' | 'dark');
    
    // Apply theme to document
    applyThemeToDocument(actualTheme as 'light' | 'dark');
    
    // Save preference to localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Listen for system preference changes
  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Handler for changes to system color scheme
    const handleChange = () => {
      if (theme === 'system') {
        const newResolvedTheme = getSystemTheme();
        setResolvedTheme(newResolvedTheme);
        
        // Apply theme to document
        applyThemeToDocument(newResolvedTheme);
      }
    };
    
    // Add event listener
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
    }
    
    // Cleanup
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        // Fallback for older browsers
        mediaQuery.removeListener(handleChange);
      }
    };
  }, [theme]);

  // Toggle between light and dark (ignoring system)
  const toggleTheme = () => {
    setTheme(prev => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'light';
      
      // If system, toggle based on current resolved theme
      return resolvedTheme === 'light' ? 'dark' : 'light';
    });
  };

  // Context value
  const value = {
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
} 