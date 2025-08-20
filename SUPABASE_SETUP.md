# Supabase Setup Guide

This application now uses Supabase for authentication and data storage. Follow these steps to set up Supabase integration:

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new account or sign in
3. Create a new project
4. Wait for the project to be set up

## 2. Get Your Credentials

1. Go to your project settings
2. Navigate to API settings
3. Copy your:
   - Project URL
   - Anon (public) key

## 3. Environment Variables

Create a `.env` file in the root directory with:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## 4. Database Schema

Run the following SQL in your Supabase SQL editor to create the necessary tables:

```sql
-- Create prompts table
CREATE TABLE prompts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  industry TEXT,
  use_case TEXT,
  tags TEXT[],
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user sessions table for additional user data
CREATE TABLE user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Prompts policies
CREATE POLICY "Users can view public prompts" ON prompts
  FOR SELECT USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can insert their own prompts" ON prompts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own prompts" ON prompts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own prompts" ON prompts
  FOR DELETE USING (auth.uid() = user_id);

-- User sessions policies
CREATE POLICY "Users can manage their own sessions" ON user_sessions
  FOR ALL USING (auth.uid() = user_id);
```

## 5. Features Enabled

With Supabase integration, you now have:

- ✅ User authentication (sign up, sign in, sign out)
- ✅ Secure user sessions
- ✅ Database storage for prompts
- ✅ Row-level security
- ✅ Real-time capabilities (can be extended)

## 6. Usage

1. Users can sign up/sign in using the auth modal
2. Authenticated users can save their prompts
3. Public prompts are visible to all users
4. Private prompts are only visible to their creators

## 7. Optional Enhancements

You can extend this setup by:
- Adding email verification
- Implementing OAuth providers (Google, GitHub, etc.)
- Adding real-time collaboration features
- Implementing prompt sharing and collaboration
- Adding user profiles and preferences
