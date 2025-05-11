#!/bin/bash

# Cursor Learning Platform Sanitization Script
# This script helps prepare the codebase for distribution by removing personal references

# Usage information
if [ "$1" == "-h" ] || [ "$1" == "--help" ]; then
  echo "Usage: ./sanitize.sh [options]"
  echo "Options:"
  echo "  -h, --help        Show this help message"
  echo "  -d, --dry-run     Show what would be changed without making changes"
  echo "  -v, --verbose     Show verbose output"
  exit 0
fi

# Parse arguments
DRY_RUN=0
VERBOSE=0

for arg in "$@"; do
  case $arg in
    -d|--dry-run)
      DRY_RUN=1
      shift
      ;;
    -v|--verbose)
      VERBOSE=1
      shift
      ;;
  esac
done

# Configuration - edit these values
OLD_DOMAIN="cursorfornoncoders.com"
OLD_ADMIN_EMAIL="enjoy@level5.life"
OLD_SITE_NAME="Cursor for Non-Coders"
OLD_SENDER_EMAIL="noreply@cursorfornoncoders.com"

# Directories to scan
DIRS=("client" "server" "*.md" "*.sh")

echo "=== Cursor Learning Platform Sanitization Tool ==="
echo "This tool will find and replace personal references in the codebase."
echo "It will scan for:"
echo "- Domain: $OLD_DOMAIN"
echo "- Admin Email: $OLD_ADMIN_EMAIL"
echo "- Site Name: $OLD_SITE_NAME"
echo "- Sender Email: $OLD_SENDER_EMAIL"
echo 

if [ $DRY_RUN -eq 1 ]; then
  echo "Running in DRY RUN mode - no changes will be made"
fi

echo "Scanning for domain references..."
for dir in "${DIRS[@]}"; do
  if [ $VERBOSE -eq 1 ]; then
    echo "Scanning $dir"
  fi
  
  if [ $DRY_RUN -eq 1 ]; then
    grep -r "$OLD_DOMAIN" --include="*.{ts,tsx,js,jsx,md,sql,html,css,sh}" $dir
  else
    # Find files containing the string
    grep -l "$OLD_DOMAIN" --include="*.{ts,tsx,js,jsx,md,sql,html,css,sh}" -r $dir | while read file; do
      echo "Processing $file"
      # Replace with template placeholder or default value
      sed -i '' "s/$OLD_DOMAIN/{{DOMAIN_NAME}}/g" "$file"
    done
  fi
done

echo "Scanning for admin email references..."
for dir in "${DIRS[@]}"; do
  if [ $VERBOSE -eq 1 ]; then
    echo "Scanning $dir"
  fi
  
  if [ $DRY_RUN -eq 1 ]; then
    grep -r "$OLD_ADMIN_EMAIL" --include="*.{ts,tsx,js,jsx,md,sql,html,css,sh}" $dir
  else
    # Find files containing the string
    grep -l "$OLD_ADMIN_EMAIL" --include="*.{ts,tsx,js,jsx,md,sql,html,css,sh}" -r $dir | while read file; do
      echo "Processing $file"
      # Replace with template placeholder or environment variable reference
      if [[ "$file" == *".sql" ]]; then
        sed -i '' "s/$OLD_ADMIN_EMAIL/{{ADMIN_EMAIL}}/g" "$file"
      elif [[ "$file" == *".ts" || "$file" == *".tsx" || "$file" == *".js" ]]; then
        sed -i '' "s/\"$OLD_ADMIN_EMAIL\"/process.env.ADMIN_EMAIL/g" "$file"
        sed -i '' "s/'$OLD_ADMIN_EMAIL'/process.env.ADMIN_EMAIL/g" "$file"
      else
        sed -i '' "s/$OLD_ADMIN_EMAIL/{{ADMIN_EMAIL}}/g" "$file"
      fi
    done
  fi
done

echo "Scanning for site name references..."
for dir in "${DIRS[@]}"; do
  if [ $VERBOSE -eq 1 ]; then
    echo "Scanning $dir"
  fi
  
  if [ $DRY_RUN -eq 1 ]; then
    grep -r "$OLD_SITE_NAME" --include="*.{ts,tsx,js,jsx,md,sql,html,css,sh}" $dir
  else
    # Find files containing the string
    grep -l "$OLD_SITE_NAME" --include="*.{ts,tsx,js,jsx,md,sql,html,css,sh}" -r $dir | while read file; do
      echo "Processing $file"
      # Replace with template placeholder or environment variable reference
      if [[ "$file" == *".sql" ]]; then
        sed -i '' "s/$OLD_SITE_NAME/{{SITE_NAME}}/g" "$file"
      elif [[ "$file" == *".ts" || "$file" == *".tsx" || "$file" == *".js" ]]; then
        sed -i '' "s/\"$OLD_SITE_NAME\"/process.env.ADMIN_SENDER_NAME || \"Your Platform Name\"/g" "$file"
        sed -i '' "s/'$OLD_SITE_NAME'/process.env.ADMIN_SENDER_NAME || \"Your Platform Name\"/g" "$file"
      else
        sed -i '' "s/$OLD_SITE_NAME/{{SITE_NAME}}/g" "$file"
      fi
    done
  fi
done

echo "Scanning for sender email references..."
for dir in "${DIRS[@]}"; do
  if [ $VERBOSE -eq 1 ]; then
    echo "Scanning $dir"
  fi
  
  if [ $DRY_RUN -eq 1 ]; then
    grep -r "$OLD_SENDER_EMAIL" --include="*.{ts,tsx,js,jsx,md,sql,html,css,sh}" $dir
  else
    # Find files containing the string
    grep -l "$OLD_SENDER_EMAIL" --include="*.{ts,tsx,js,jsx,md,sql,html,css,sh}" -r $dir | while read file; do
      echo "Processing $file"
      # Replace with template placeholder or environment variable reference
      if [[ "$file" == *".sql" ]]; then
        sed -i '' "s/$OLD_SENDER_EMAIL/{{SENDER_EMAIL}}/g" "$file"
      elif [[ "$file" == *".ts" || "$file" == *".tsx" || "$file" == *".js" ]]; then
        sed -i '' "s/\"$OLD_SENDER_EMAIL\"/process.env.ADMIN_SENDER_EMAIL || \"noreply@example.com\"/g" "$file"
        sed -i '' "s/'$OLD_SENDER_EMAIL'/process.env.ADMIN_SENDER_EMAIL || \"noreply@example.com\"/g" "$file"
      else
        sed -i '' "s/$OLD_SENDER_EMAIL/{{SENDER_EMAIL}}/g" "$file"
      fi
    done
  fi
done

echo "Done!"
if [ $DRY_RUN -eq 1 ]; then
  echo "This was a dry run. To apply changes, run without the --dry-run flag."
else
  echo "Codebase has been sanitized."
  echo "Remember to create .env.example files for both client and server directories."
fi 