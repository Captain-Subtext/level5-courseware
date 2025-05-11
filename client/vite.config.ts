import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: true,
    port: 80,
    strictPort: true, // Fail if port is already in use
    proxy: {
      // Proxy API requests to our Express server
      '^/api': { // Simplified path matching
        target: 'http://127.0.0.1:8080',
        changeOrigin: true, // Often needed for virtual hosted sites / cookie handling
        secure: false,
        // No rewrite needed if backend expects /api routes
        // rewrite: (path) => path.replace(/^\/api/, ''), // Only uncomment if backend doesn't expect /api
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          // Reduce logging
          /*
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Proxying:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Proxy Response:', proxyRes.statusCode, req.url);
          });
          */
        },
      },
    },
  },
  plugins: [
    react(),
    // Add visualizer plugin - Set open: true to automatically open report in browser
    visualizer({ open: true, filename: 'dist/stats.html' }) 
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: { // Add build options for chunking
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Group Radix UI components
          if (id.includes('@radix-ui')) {
            return 'vendor-radix';
          }
          // Group Lucide icons
          if (id.includes('lucide-react')) {
            return 'vendor-lucide';
          }
          // Group Supabase client
          if (id.includes('@supabase/supabase-js')) {
            return 'vendor-supabase';
          }
          // Group Charting libraries
          if (id.includes('recharts') || id.includes('chart.js')) {
            return 'vendor-charts';
          }
          // Group Axios
          if (id.includes('axios')) {
            return 'vendor-axios';
          }
          // Optional: Group other large dependencies like charting libraries if needed
          // if (id.includes('recharts')) {
          //   return 'vendor-recharts';
          // }
          // Optional: Catch-all for other node_modules, use carefully
          // if (id.includes('node_modules')) {
          //   return 'vendor';
          // }
        }
      }
    }
  }
}));
