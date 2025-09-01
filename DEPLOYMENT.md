# Deployment Guide

## Vercel Deployment

### Prerequisites
1. Supabase project with the required database schema
2. Environment variables configured

### Environment Variables
Create these environment variables in Vercel:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Deployment Steps
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Vercel will automatically detect Next.js and use the correct build settings
4. Add environment variables in Vercel dashboard
5. Deploy!

### PWA Features
- Works offline with service worker caching
- Can be installed on mobile devices
- Push notifications for meal reminders
- Optimized for mobile and desktop

### Database Setup
Ensure your Supabase database has:
- RLS policies enabled
- Profile creation trigger configured  
- Notification subscriptions table
- All required tables from the schema

### Performance
- Static pages are pre-rendered for fast loading
- Images and assets are optimized
- Service worker caches static resources
- Bundle size optimized with code splitting