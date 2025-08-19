# Blood Sugar Tracker PWA - Planning & Deployment Guide

# Approach for Claude Code:

1. Start with Phase 1 completely before moving on
2. Test each phase in the browser before proceeding  
3. Use git commits between phases
4. Create a LOCAL_TESTING.md file with:
   - Supabase setup checklist
   - How to test notifications locally
   - PWA installation steps

## Project Overview
Build a Progressive Web App (PWA) for tracking blood sugar levels with timed reminders, using React/Next.js and Supabase for backend.

## Core Requirements

### Primary Features (MVP)
1. **Quick Blood Sugar Entry**
   - Pre-meal reading input
   - 30-minute post-meal reminder & input
   - 90-minute post-meal reminder & input (configurable)
   - Carbohydrate gram tracking per meal
   - Quick-entry buttons for common values (70, 80, 90, 100, 110, 120, 130, 140, 150)
   - Manual time adjustment for backdated entries

2. **Reminders System**
   - Local notifications using Web Push API
   - Configurable reminder intervals (default: 30 and 90 minutes)
   - Persistent reminders if reading not entered
   - Ability to snooze reminders (5, 10, 15 minutes)
   - Silent mode scheduling (e.g., night hours)

3. **Data Visualization**
   - Today's readings timeline
   - 7-day trend graph
   - 30-day patterns by time of day
   - Color-coded values:
     - Low: < 70 (red)
     - Target: 70-140 (green)
     - High: > 140 (yellow)
     - Very high: > 180 (red)

4. **Data Management**
   - Export to CSV for healthcare providers
   - Add notes to any reading
   - Tag readings (before meal, after meal, exercise, feeling symptoms)
   - Edit/delete past entries

## Technical Stack

### Frontend
```json
{
  "next": "14.x",
  "react": "18.x",
  "next-pwa": "5.x",
  "typescript": "5.x",
  "@supabase/supabase-js": "2.x",
  "@supabase/auth-helpers-nextjs": "latest",
  "recharts": "2.x",
  "date-fns": "3.x",
  "react-hook-form": "7.x",
  "zod": "3.x",
  "tailwindcss": "3.x",
  "lucide-react": "latest",
  "sonner": "latest",
  "zustand": "4.x"
}
```

### Backend (Supabase)
- PostgreSQL database
- Row Level Security (RLS)
- Real-time subscriptions
- Edge Functions for complex logic

## Database Schema

### Tables

#### `profiles`
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  target_min INTEGER DEFAULT 70,
  target_max INTEGER DEFAULT 140,
  reminder_1_minutes INTEGER DEFAULT 30,
  reminder_2_minutes INTEGER DEFAULT 90,
  timezone TEXT DEFAULT 'America/Denver',
  silent_start TIME DEFAULT '22:00',
  silent_end TIME DEFAULT '07:00',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `readings`
```sql
CREATE TABLE readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  value INTEGER NOT NULL,
  reading_type TEXT CHECK (reading_type IN ('pre_meal', 'post_30', 'post_90', 'random', 'fasting')),
  carbs INTEGER,
  notes TEXT,
  tags TEXT[],
  meal_id UUID,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_readings_user_recorded ON readings(user_id, recorded_at DESC);
CREATE INDEX idx_readings_meal ON readings(meal_id);
```

#### `meals`
```sql
CREATE TABLE meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT,
  carbs INTEGER,
  pre_meal_reading_id UUID REFERENCES readings(id),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  reminder_1_sent BOOLEAN DEFAULT FALSE,
  reminder_2_sent BOOLEAN DEFAULT FALSE,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `notification_subscriptions`
```sql
CREATE TABLE notification_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Row Level Security Policies
```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_subscriptions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Readings policies
CREATE POLICY "Users can view own readings" ON readings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own readings" ON readings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own readings" ON readings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own readings" ON readings FOR DELETE USING (auth.uid() = user_id);

-- Similar policies for meals and notification_subscriptions
```

## File Structure
```
blood-sugar-tracker/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── register/
│   │       └── page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx           # Main dashboard with today's readings
│   │   ├── add/
│   │   │   └── page.tsx       # Add new reading
│   │   ├── history/
│   │   │   └── page.tsx       # Historical data & graphs
│   │   ├── export/
│   │   │   └── page.tsx       # Export data
│   │   └── settings/
│   │       └── page.tsx       # User settings
│   ├── api/
│   │   ├── notifications/
│   │   │   ├── register/
│   │   │   │   └── route.ts
│   │   │   └── send/
│   │   │       └── route.ts
│   │   └── export/
│   │       └── route.ts
│   ├── layout.tsx
│   ├── manifest.json
│   └── globals.css
├── components/
│   ├── ui/               # Shadcn/ui or custom components
│   ├── charts/
│   │   ├── DailyChart.tsx
│   │   ├── WeeklyTrend.tsx
│   │   └── PatternAnalysis.tsx
│   ├── forms/
│   │   ├── QuickEntry.tsx
│   │   ├── MealForm.tsx
│   │   └── ReadingForm.tsx
│   ├── layout/
│   │   ├── Navigation.tsx
│   │   └── BottomNav.tsx
│   └── notifications/
│       └── NotificationPrompt.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── notifications/
│   │   └── service-worker.ts
│   └── utils/
│       ├── date-helpers.ts
│       └── export-helpers.ts
├── hooks/
│   ├── useReadings.ts
│   ├── useMeals.ts
│   ├── useNotifications.ts
│   └── useReminders.ts
├── store/
│   └── app-store.ts
├── types/
│   └── database.ts
├── public/
│   ├── icons/            # PWA icons (multiple sizes)
│   └── sw.js            # Service worker
├── next.config.js        # PWA configuration
├── tailwind.config.ts
├── package.json
└── .env.local
```

## PWA Configuration

### next.config.js
```javascript
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/v1\/object\/public\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'supabase-storage',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
        },
      },
    },
  ],
});

module.exports = withPWA({
  reactStrictMode: true,
  images: {
    domains: ['*.supabase.co'],
  },
});
```

### manifest.json
```json
{
  "name": "Blood Sugar Tracker",
  "short_name": "BS Tracker",
  "description": "Track blood sugar levels with reminders",
  "theme_color": "#10b981",
  "background_color": "#ffffff",
  "display": "standalone",
  "orientation": "portrait",
  "scope": "/",
  "start_url": "/",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "categories": ["medical", "health", "lifestyle"]
}
```

## Service Worker for Notifications

```javascript
// public/sw.js
self.addEventListener('push', function(event) {
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: data.primaryKey,
      type: data.type
    },
    actions: [
      {
        action: 'log',
        title: 'Log Reading',
      },
      {
        action: 'snooze',
        title: 'Snooze 10 min',
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  if (event.action === 'log') {
    clients.openWindow('/add?from=notification');
  } else if (event.action === 'snooze') {
    // Handle snooze logic
  } else {
    clients.openWindow('/');
  }
});
```

## Implementation Steps

### Phase 1: Setup & Authentication (Day 1)
1. Initialize Next.js project with TypeScript and Tailwind
2. Set up Supabase project and environment variables
3. Create database schema and RLS policies
4. Implement authentication flow (email/password)
5. Set up PWA configuration and manifest

### Phase 2: Core Functionality (Day 2-3)
1. Build quick entry form with preset buttons
2. Create readings CRUD operations
3. Implement meal tracking with carb counting
4. Build basic dashboard showing today's readings
5. Add local storage fallback for offline capability

### Phase 3: Notifications (Day 4)
1. Implement service worker registration
2. Create notification permission flow
3. Build reminder scheduling system
4. Add notification subscription to Supabase
5. Test push notifications on mobile

### Phase 4: Data Visualization (Day 5)
1. Build daily timeline chart
2. Create weekly trend graph
3. Implement pattern analysis by time of day
4. Add color coding for ranges
5. Build export to CSV functionality

### Phase 5: Polish & Deployment (Day 6)
1. Add dark mode support
2. Implement settings page
3. Add data export functionality
4. Performance optimization
5. Deploy to Vercel
6. Test PWA installation on iOS and Android

## Deployment Instructions

### Supabase Setup
1. Create new Supabase project
2. Run SQL migrations for schema
3. Enable Email authentication
4. Set up environment variables:
```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
```

### Vercel Deployment
1. Push code to GitHub
2. Import project to Vercel
3. Add environment variables
4. Configure custom domain (optional)
5. Enable HTTPS (required for PWA)

### Post-Deployment
1. Test PWA installation on target devices
2. Verify notification permissions and delivery
3. Test offline functionality
4. Monitor Supabase usage and logs

## Testing Checklist
- [ ] PWA installs correctly on iOS/Android
- [ ] Notifications work on both platforms
- [ ] Offline mode allows reading entry
- [ ] Data syncs when connection restored
- [ ] Export generates valid CSV
- [ ] Reminders trigger at correct times
- [ ] Color coding displays correctly
- [ ] Dark mode works properly
- [ ] All CRUD operations work
- [ ] Charts render correctly

## Future Enhancements (Post-MVP)
- Integration with CGM devices (Dexcom, Libre)
- Insulin tracking and calculations
- Food database with carb lookup
- Share data with family/caregivers
- A1C estimation
- Apple Health / Google Fit integration
- Predictive alerts based on patterns
- Multiple reminder profiles (weekday/weekend)
- Photo food logging with AI carb estimation

## Security Considerations
- All data encrypted in transit (HTTPS)
- RLS policies enforce data isolation
- Sanitize all user inputs
- Rate limiting on API endpoints
- Regular security audits
- HIPAA compliance considerations for future

## Performance Targets
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3.5s
- Lighthouse Score: > 90
- Offline capability within 2 seconds
- Support 10,000+ readings per user

## Notes for Developer
- Prioritize mobile UX - most usage will be on phones
- Make input as fast as possible - users may be experiencing symptoms
- Ensure high contrast for accessibility
- Consider one-handed operation for all core features
- Pre-populate time but allow adjustment for backdated entries
- Keep reminder notifications persistent until acknowledged
- Consider battery optimization for background tasks