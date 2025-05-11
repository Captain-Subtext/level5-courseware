import { Request, Response, NextFunction } from 'express';
const express = require('express');
const router = express.Router();

// Import individual route handlers (assuming they export routers or handlers)
const getDetailsRouter = require('./get-details');
const createCheckoutRouter = require('./create-checkout');
const createPortalRouter = require('./create-portal');
const cancelRouter = require('./cancel');

// Mount the handlers/routers
// Adjust paths/methods as needed based on how handlers are structured
router.use('/get-details', getDetailsRouter); 
router.use('/create-checkout', createCheckoutRouter); 
router.use('/create-portal', createPortalRouter);
router.use('/cancel', cancelRouter);

// Default handler for unhandled routes within /api/subscription
router.use((req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({ error: 'Subscription API sub-route not found' });
});

module.exports = router; 