// Augment the Express Request interface to include our custom 'user' property

declare namespace Express {
  export interface Request {
    user?: {
      id: string;
      // Add other user properties from your JWT payload if needed
      email?: string;
      // etc.
    };
  }
} 