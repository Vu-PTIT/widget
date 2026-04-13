-- Supabase Setup Script for Echo
-- Refined for security, performance, and best practices with Group Messaging support

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 0. Cleanup existing schema (Safe because user confirmed no data to preserve)
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.group_members CASCADE;
DROP TABLE IF EXISTS public.friends CASCADE;
DROP TABLE IF EXISTS public.stories CASCADE;
DROP TABLE IF EXISTS public.groups CASCADE;
DROP TABLE IF EXISTS public.soundboard_items CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

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

DO $$ BEGIN
    CREATE TYPE public.group_role AS ENUM ('admin', 'member');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. Users table (Public profile)
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

-- 2. Friends table (Improved bidirectional logic)
-- Recommendation: Always store with user_id < friend_id to avoid redundant rows
CREATE TABLE IF NOT EXISTS public.friends (
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    friend_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    status public.friend_status DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, friend_id),
    CONSTRAINT friends_not_self CHECK (user_id != friend_id),
    CONSTRAINT friends_ordered CHECK (user_id < friend_id)
);

-- 3. Groups table
CREATE TABLE IF NOT EXISTS public.groups (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    avatar TEXT,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Group Members table
CREATE TABLE IF NOT EXISTS public.group_members (
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    role public.group_role DEFAULT 'member',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (group_id, user_id)
);

-- 5. Messages table (Polymorphic: 1-1 or Group)
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES public.users(id) ON DELETE CASCADE, -- Null if group message
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE, -- Null if direct message
    audio_url TEXT NOT NULL,
    audio_path TEXT,
    duration FLOAT4,
    voice_effect TEXT,
    is_played BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT message_target_check CHECK (
        (receiver_id IS NOT NULL AND group_id IS NULL) OR
        (receiver_id IS NULL AND group_id IS NOT NULL)
    )
);

-- 6. Stories table
CREATE TABLE IF NOT EXISTS public.stories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    audio_url TEXT NOT NULL,
    duration FLOAT4,
    voice_effect TEXT,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Soundboard Items table
CREATE TABLE IF NOT EXISTS public.soundboard_items (
    id TEXT PRIMARY KEY,
    icon TEXT,
    label TEXT,
    sound_url TEXT
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_friends_friend_id ON public.friends(friend_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON public.messages(receiver_id) WHERE (receiver_id IS NOT NULL);
CREATE INDEX IF NOT EXISTS idx_messages_group_id ON public.messages(group_id) WHERE (group_id IS NOT NULL);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON public.messages(receiver_id) WHERE (is_played = FALSE AND receiver_id IS NOT NULL);
CREATE INDEX IF NOT EXISTS idx_stories_user_id ON public.stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_expires_at ON public.stories(expires_at);
CREATE INDEX IF NOT EXISTS idx_groups_created_by ON public.groups(created_by);

-- Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.soundboard_items ENABLE ROW LEVEL SECURITY;

-- Policies: Users
CREATE POLICY "Public profiles are viewable by everyone" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Policies: Friends
CREATE POLICY "Users can see their own friend list" ON public.friends FOR SELECT 
USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "Users can insert friendship" ON public.friends FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() = friend_id);

-- Policies: Groups
CREATE POLICY "Members can see group details" ON public.groups FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.group_members WHERE group_id = id AND user_id = auth.uid()));

-- Policies: Group Members
CREATE POLICY "Members can see other members" ON public.group_members FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.group_members WHERE group_id = public.group_members.group_id AND user_id = auth.uid()));

-- Policies: Messages
CREATE POLICY "Users can see messages they sent or received" ON public.messages FOR SELECT 
USING (
    auth.uid() = sender_id OR 
    auth.uid() = receiver_id OR 
    (group_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.group_members WHERE group_id = public.messages.group_id AND user_id = auth.uid()))
);
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT 
WITH CHECK (
    auth.uid() = sender_id AND 
    (
        receiver_id IS NOT NULL OR 
        (group_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.group_members WHERE group_id = public.messages.group_id AND user_id = auth.uid()))
    )
);
CREATE POLICY "Receivers can update played status" ON public.messages FOR UPDATE 
USING (auth.uid() = receiver_id OR (group_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.group_members WHERE group_id = public.messages.group_id AND user_id = auth.uid())));

-- Policies: Stories (Friends Only)
CREATE POLICY "Stories are viewable by friends" ON public.stories FOR SELECT 
USING (
    auth.uid() = user_id OR 
    EXISTS (
        SELECT 1 FROM public.friends 
        WHERE (user_id = public.stories.user_id AND friend_id = auth.uid()) 
           OR (friend_id = public.stories.user_id AND user_id = auth.uid())
        AND status = 'accepted'
    )
);
CREATE POLICY "Users can create their own stories" ON public.stories FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies: Soundboard
CREATE POLICY "Soundboard is viewable by all authenticated users" ON public.soundboard_items FOR SELECT USING (auth.role() = 'authenticated');

-- Real-time Configuration
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages, public.friends, public.groups, public.group_members;
EXCEPTION
    WHEN others THEN NULL;
END $$;

-- Trigger: Automatically create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, username)
  VALUES (NEW.id, NEW.email, split_part(NEW.email, '@', 1));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger: Ensure friends are ordered (user_id < friend_id)
-- Note: This is an optional sanity check if the application layer fails to sort
CREATE OR REPLACE FUNCTION public.enforce_friend_order()
RETURNS TRIGGER AS $$
DECLARE
    temp_id UUID;
BEGIN
    IF NEW.user_id > NEW.friend_id THEN
        temp_id := NEW.user_id;
        NEW.user_id := NEW.friend_id;
        NEW.friend_id := temp_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_enforce_friend_order ON public.friends;
CREATE TRIGGER tr_enforce_friend_order
    BEFORE INSERT ON public.friends
    FOR EACH ROW EXECUTE FUNCTION public.enforce_friend_order();
