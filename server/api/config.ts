import { Request, Response, NextFunction } from 'express';
const express = require('express');
const router = express.Router();

// Adjust path to your Supabase client lib - Reverting to original path
const { supabase } = require('../src/lib/supabase'); // Corrected path
const { handleSupabaseError } = require('./error-utils');

// GET /api/config/public - Unauthenticated endpoint for public config
router.get('/public', async (req: Request, res: Response, next: NextFunction) => {
  // console.log('API: Fetching public config');
  try {
    const { data, error, status } = await supabase
      .from('config')
      .select('key, value')
      .in('key', ['maintenance_mode', 'announcement_banner_enabled', 'announcement_banner_text']); // Fetch relevant keys

    if (error && status !== 406) { // 406 = zero rows, handled below
      return handleSupabaseError(error, res, next, status, 'Error fetching public config');
    }

    // Process the results into a more usable format
    const configMap = new Map<string, string | boolean>();
    if (data) {
      data.forEach((row: { key: string; value: string }) => {
        // Convert boolean strings explicitly
        if (row.key === 'maintenance_mode' || row.key === 'announcement_banner_enabled') {
          configMap.set(row.key, row.value === 'true');
        } else {
          configMap.set(row.key, row.value);
        }
      });
    }

    const maintenanceMode = configMap.get('maintenance_mode') ?? false; // Default false
    const announcementBannerEnabled = configMap.get('announcement_banner_enabled') ?? false; // Default false
    let announcementBannerText = configMap.get('announcement_banner_text') ?? '';

    // Only include text if banner is enabled
    if (!announcementBannerEnabled) {
      announcementBannerText = '';
    }

    // console.log(`API: Public Config - Maintenance: ${maintenanceMode}, Banner Enabled: ${announcementBannerEnabled}, Banner Text: ${announcementBannerText || 'N/A'}`);
    res.status(200).json({
      maintenanceMode,
      announcementBannerEnabled,
      announcementBannerText,
     });

  } catch (err) {
    console.error('Unexpected error fetching public config:', err);
    // Provide default safe values in case of unexpected errors
    res.status(500).json({
      maintenanceMode: false,
      announcementBannerEnabled: false,
      announcementBannerText: '',
    });
  }
});

// GET /api/config/csrf-token - Endpoint specifically for getting a CSRF token
router.get('/csrf-token', (req: Request, res: Response) => {
  // The CSRF token should already be set in the cookie and header by the middleware
  // But let's ensure it's in the response header
  const cookieName = 'csrf_token_cookie';
  const responseHeaderName = 'x-csrf-token-value';
  
  // Get the token from the cookie (should be set by middleware)
  const csrfToken = req.cookies[cookieName];
  
  if (csrfToken) {
    // Explicitly set the token in the response header
    res.setHeader(responseHeaderName, csrfToken);
    
    // Also return it in the response body
    return res.status(200).json({ 
      success: true, 
      message: 'CSRF token retrieved successfully' 
    });
  } else {
    // If no token in cookie, something is wrong with the CSRF middleware
    console.error('CSRF token not found in cookie when requested explicitly');
    return res.status(500).json({ 
      success: false, 
      message: 'CSRF token not available' 
    });
  }
});

module.exports = router; 