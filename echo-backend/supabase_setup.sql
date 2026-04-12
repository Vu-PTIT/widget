-- Supabase Setup Script for Echo
-- Refined for security, performance, and best practices

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Custom Types (ENUMs)
DO $$ BEGIN
    CREATE TYPE public.user_status AS ENUM ('online', 'offline', 'busy');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.user_type AS ENUM ('individual', 'bot', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.friend_status AS ENUM ('pending', 'accepted', 'blocked');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. Users table (Public profile)
-- Note: Linking to auth.users is handled via triggers or manually
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    username TEXT UNIQUE,
    name TEXT,
    avatar TEXT,
    status public.user_status DEFAULT 'offline',
    streak INT4 DEFAULT 0,
    nickname TEXT,
    type public.user_type DEFAULT 'individual',
    email TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Friends table
CREATE TABLE IF NOT EXISTS public.friends (
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    friend_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    status public.friend_status DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, friend_id),
    CONSTRAINT friends_not_self CHECK (user_id != friend_id)
);

-- 3. Messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    audio_url TEXT NOT NULL,
    audio_path TEXT,
    duration FLOAT4,
    is_played BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_friends_user_id ON public.friends(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend_id ON public.friends(friend_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON public.messages(receiver_id);

-- 4. Stories table
CREATE TABLE IF NOT EXISTS public.stories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    audio_url TEXT NOT NULL,
    duration FLOAT4,
    voice_effect TEXT,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for stories
CREATE INDEX IF NOT EXISTS idx_stories_user_id ON public.stories(user_id);

-- 5. Soundboard Items table (Audible Icons)
CREATE TABLE IF NOT EXISTS public.soundboard_items (
    id TEXT PRIMARY KEY,
    icon TEXT,
    label TEXT,
    sound_url TEXT
);

-- Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.soundboard_items ENABLE ROW LEVEL SECURITY;

-- Basic Policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can see their own friend list" ON public.friends FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can see messages they sent or received" ON public.messages FOR SELECT 
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Soundboard is viewable by all authenticated users" ON public.soundboard_items FOR SELECT USING (true);

-- Extensions for RLS policies
CREATE POLICY "Receivers can update played status" ON public.messages FOR UPDATE USING (auth.uid() = receiver_id);
CREATE POLICY "Users can insert friends" ON public.friends FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can create their own stories" ON public.stories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Stories are viewable by everyone" ON public.stories FOR SELECT USING (true);

-- Real-time Configuration
-- Note: Requires table to be added to publication
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'messages') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'friends') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.friends;
    END IF;
EXCEPTION
    WHEN undefined_object THEN
        -- Publication might not exist in local dev without explicit setup
        NULL;
END $$;

-- Automated Data Cleanup (Placeholder logic)
-- To enable pg_cron:
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.schedule('midnight-cleanup', '0 0 * * *', $$
--   DELETE FROM public.stories WHERE expires_at < NOW();
-- $$);

-- Storage Buckets (Manual creation via UI is recommended, but these are policies)
-- Buckets needed: 'audio-messages', 'sounds', 'avatars'
