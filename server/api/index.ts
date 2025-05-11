import { Request, Response, NextFunction } from 'express';

const express = require('express');
const router = express.Router();

// Import sub-routers using require()
const modulesRouter = require('./modules');
const sectionsRouter = require('./sections');
const subscriptionRouter = require('./subscription/index'); // Keep for now, might remove later
const webhooksRouter = require('./webhooks/stripe');
const adminRouter = require('./admin');
const contactHandler = require('./contact');
const userRouter = require('./user'); // Import the new user router
const bookmarksRouter = require('./bookmarks'); // Import the new bookmarks router
const searchRouter = require('./search'); // Import the new search router

// Mount sub-routers
router.use('/modules', modulesRouter);
router.use('/sections', sectionsRouter);
router.use('/subscription', subscriptionRouter); // Uncomment subscription route
router.use('/webhooks/stripe', webhooksRouter);
router.use('/admin', adminRouter);
router.use('/contact', contactHandler);
router.use('/user', userRouter); // Mount the new user router
router.use('/bookmarks', bookmarksRouter); // Mount the new bookmarks router
router.use('/search', searchRouter); // Mount the new search router

// Default handler for unhandled routes within /api
router.use((req: Request, res: Response, next: NextFunction) => {
  // This middleware runs if no previous route in this router matched
  res.status(404).json({ error: 'API sub-route not found' });
});

// Export the main API router
module.exports = router; 
