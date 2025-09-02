# Local Testing Guide

## Supabase Setup Checklist

### 1. Create Supabase Project
- [ ] Go to [supabase.com](https://supabase.com) and create a new project
- [ ] Note down your project URL and anon key
- [ ] Update `.env.local` with your credentials

### 2. Database Schema Setup
Run the following SQL in your Supabase SQL editor:

```sql
-- Create profiles table
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
  enable_general_reminders BOOLEAN DEFAULT FALSE,
  general_reminder_minutes INTEGER DEFAULT 120,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create readings table
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

-- Create meals table
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

-- Create notification_subscriptions table
CREATE TABLE notification_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_readings_user_recorded ON readings(user_id, recorded_at DESC);
CREATE INDEX idx_readings_meal ON readings(meal_id);

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Readings policies
CREATE POLICY "Users can view own readings" ON readings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own readings" ON readings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own readings" ON readings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own readings" ON readings FOR DELETE USING (auth.uid() = user_id);

-- Meals policies
CREATE POLICY "Users can view own meals" ON meals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own meals" ON meals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own meals" ON meals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own meals" ON meals FOR DELETE USING (auth.uid() = user_id);

-- Notification subscriptions policies
CREATE POLICY "Users can view own subscriptions" ON notification_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own subscriptions" ON notification_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own subscriptions" ON notification_subscriptions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own subscriptions" ON notification_subscriptions FOR DELETE USING (auth.uid() = user_id);

-- Create a trigger to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 3. Environment Variables
Update your `.env.local` file:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
```

## How to Test Notifications Locally

### 1. HTTPS Required
- Notifications only work over HTTPS
- For local testing, use `ngrok` or similar tool:
```bash
npm install -g ngrok
npm run dev
# In another terminal:
ngrok http 3000
```

### 2. Browser Requirements
- Chrome/Edge: Full support
- Firefox: Full support 
- Safari: Limited support (iOS 16.4+)

### 3. Testing Steps
1. Open app in HTTPS environment
2. Grant notification permission when prompted
3. Test notifications from browser dev tools:
```javascript
// In browser console
new Notification("Test", {
  body: "Testing notifications",
  icon: "/icons/icon-192x192.png"
});
```

## PWA Installation Steps

### Desktop (Chrome/Edge)
1. Open the app in browser
2. Look for install icon in address bar
3. Click "Install Blood Sugar Tracker"
4. App opens in standalone window

### Mobile (Chrome Android)
1. Open app in Chrome
2. Tap menu (3 dots)
3. Select "Add to Home screen"
4. Confirm installation

### Mobile (Safari iOS)
1. Open app in Safari
2. Tap Share button
3. Select "Add to Home Screen"
4. Confirm installation

## Development Testing Checklist

### Authentication Flow
- [ ] User can register with email/password
- [ ] User can login with valid credentials
- [ ] User is redirected to dashboard after login
- [ ] User can logout successfully
- [ ] Protected routes redirect to login when not authenticated

### Basic Functionality
- [ ] Dashboard loads and shows "No readings" message for new users
- [ ] Navigation between pages works
- [ ] PWA manifest loads correctly (check DevTools > Application > Manifest)
- [ ] Service worker registers (check DevTools > Application > Service Workers)

### Database Connection
- [ ] No console errors related to Supabase
- [ ] User profile is created on registration
- [ ] Database queries work without RLS violations

## Common Issues & Solutions

### "Failed to load manifest" Error
- Ensure `manifest.json` is in the correct location (`src/app/manifest.json`)
- Check that all icon paths in manifest are valid

### Supabase RLS Errors
- Verify all RLS policies are created
- Check that user is authenticated before making database calls
- Ensure `auth.uid()` matches the user_id in your queries

### PWA Not Installing
- Ensure app is served over HTTPS
- Check that manifest.json has all required fields
- Verify service worker is registering successfully

### Notification Permission Denied
- Clear browser data and retry
- Check browser notification settings
- Ensure HTTPS is being used

## Next Phase Setup

After Phase 1 is working:
- [ ] All authentication flows tested
- [ ] Database schema created and tested
- [ ] PWA basics working (installable)
- [ ] Service worker registered
- [ ] Basic navigation working

Ready to proceed to Phase 2: Core Functionality