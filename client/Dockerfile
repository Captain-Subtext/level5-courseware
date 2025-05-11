# Dockerfile for the React client application

# ---- Build Stage ----
# Use an official Node runtime as a parent image
FROM node:20-alpine AS build

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock)
# Make sure these files exist in your client directory
COPY package*.json ./

# Install dependencies using npm ci for clean installs
RUN npm ci

# Copy the rest of the application code from the client directory
COPY . .

# Define build arguments for environment variables needed at build time
# These should be set in the Railway service configuration
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_STRIPE_PUBLISHABLE_KEY
ARG VITE_API_BASE_URL

# Set environment variables from build arguments
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_STRIPE_PUBLISHABLE_KEY=$VITE_STRIPE_PUBLISHABLE_KEY
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Build the React application for production
RUN npm run build

# ---- Serve Stage ----
# Use a lightweight Nginx image to serve the static files
FROM nginx:alpine

# Remove default nginx website configuration
RUN rm -rf /etc/nginx/conf.d/*

# Copy custom nginx configuration
# We will create this file next in the same client directory
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built assets from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80 to the outside world
# Railway typically handles port mapping automatically
EXPOSE 80

# Start nginx server
CMD ["nginx", "-g", "daemon off;"] 