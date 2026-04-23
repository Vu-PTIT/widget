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
DROP TABLE IF EXISTS public.user_settings CASCADE;
DROP TABLE IF EXISTS public.user_widget_configs CASCADE;
DROP TABLE IF EXISTS public.soundboard_items CASCADE;
DROP TABLE IF EXISTS public.voice_effects CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Custom Types (ENUMs)
DO $$ BEGIN
    CREATE TYPE public.user_status AS ENUM ('online', 'offline', 'busy', 'listening', 'sleep');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.friend_status AS ENUM ('pending', 'accepted', 'blocked');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.membership_type AS ENUM ('free', 'premium');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.haptic_type AS ENUM ('heartbeat', 'intense', 'gentle');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. Soundboard Items table
CREATE TABLE IF NOT EXISTS public.soundboard_items (
    id TEXT PRIMARY KEY,
    icon TEXT,
    label TEXT,
    sound_url TEXT,
    is_premium BOOLEAN DEFAULT FALSE
);

-- 2. Voice Effects table
CREATE TABLE IF NOT EXISTS public.voice_effects (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    icon TEXT,
    is_premium BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Users table (Public profile)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    username TEXT UNIQUE,
    name TEXT,
    avatar TEXT,
    status public.user_status DEFAULT 'offline',
    streak INT4 DEFAULT 0,
    nickname TEXT,

    membership public.membership_type DEFAULT 'free',
    premium_until TIMESTAMPTZ,
    email TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. User Settings table
CREATE TABLE IF NOT EXISTS public.user_settings (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    app_theme TEXT DEFAULT 'bg-neutral-950',
    sleep_mode BOOLEAN DEFAULT FALSE,
    raise_to_listen BOOLEAN DEFAULT TRUE,
    haptic_feedback public.haptic_type DEFAULT 'heartbeat'
);

-- 5. User Widget Configuration table
CREATE TABLE IF NOT EXISTS public.user_widget_configs (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    theme TEXT DEFAULT 'bg-pink-500',
    slot_1_id TEXT REFERENCES public.soundboard_items(id) ON DELETE SET NULL,
    slot_2_id TEXT REFERENCES public.soundboard_items(id) ON DELETE SET NULL,
    slot_3_id TEXT REFERENCES public.soundboard_items(id) ON DELETE SET NULL,
    slot_4_id TEXT REFERENCES public.soundboard_items(id) ON DELETE SET NULL
);

-- 6. Friends table (Improved bidirectional logic)
-- Recommendation: Always store with user_id < friend_id to avoid redundant rows
CREATE TABLE IF NOT EXISTS public.friends (
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    friend_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    initiator_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    status public.friend_status DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, friend_id),
    CONSTRAINT friends_not_self CHECK (user_id != friend_id),
    CONSTRAINT friends_ordered CHECK (user_id < friend_id),
    CONSTRAINT friends_initiator_check CHECK (initiator_id = user_id OR initiator_id = friend_id)
);

-- 7. Groups table
CREATE TABLE IF NOT EXISTS public.groups (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    avatar TEXT,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Group Members table
CREATE TABLE IF NOT EXISTS public.group_members (
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,

    joined_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (group_id, user_id)
);

-- 9. Messages table (Polymorphic: 1-1 or Group)
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES public.users(id) ON DELETE CASCADE, -- Null if group message
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE, -- Null if direct message
    audio_url TEXT NOT NULL,
    audio_path TEXT,
    duration FLOAT4,
    voice_effect TEXT REFERENCES public.voice_effects(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT message_target_check CHECK (
        (receiver_id IS NOT NULL AND group_id IS NULL) OR
        (receiver_id IS NULL AND group_id IS NOT NULL)
    )
);

-- 10. Message Read States (New table for tracking who read what)
CREATE TABLE IF NOT EXISTS public.message_read_states (
    message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (message_id, user_id)
);

-- 11. Stories table
CREATE TABLE IF NOT EXISTS public.stories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    audio_url TEXT NOT NULL,
    duration FLOAT4,
    voice_effect TEXT REFERENCES public.voice_effects(id) ON DELETE SET NULL,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);



-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_friends_friend_id ON public.friends(friend_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON public.messages(receiver_id) WHERE (receiver_id IS NOT NULL);
CREATE INDEX IF NOT EXISTS idx_messages_group_id ON public.messages(group_id) WHERE (group_id IS NOT NULL);
CREATE INDEX IF NOT EXISTS idx_message_reads_user_id ON public.message_read_states(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_user_id ON public.stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_expires_at ON public.stories(expires_at);
CREATE INDEX IF NOT EXISTS idx_groups_created_by ON public.groups(created_by);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON public.group_members(user_id);

-- Composite indexes for fast message loading & sorting
CREATE INDEX IF NOT EXISTS idx_messages_direct_lookup 
ON public.messages (sender_id, receiver_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_group_lookup 
ON public.messages (group_id, created_at DESC);

-- Faster inbox lookup for the user
CREATE INDEX IF NOT EXISTS idx_messages_recent_inbox 
ON public.messages (receiver_id, created_at DESC);

-- Optimized indexes for OR queries in DMs
CREATE INDEX IF NOT EXISTS idx_messages_sender_created ON public.messages(sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_created ON public.messages(receiver_id, created_at DESC);


-- Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.soundboard_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_widget_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_effects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_read_states ENABLE ROW LEVEL SECURITY;

-- Policies: Users
CREATE POLICY "Public profiles are viewable by everyone" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Policies: Friends
CREATE POLICY "Users can see their own friend list" ON public.friends FOR SELECT 
USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "Users can insert friendship" ON public.friends FOR INSERT WITH CHECK (auth.uid() = initiator_id AND (auth.uid() = user_id OR auth.uid() = friend_id));

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

-- Policies: Message Read States
CREATE POLICY "Users can see who read messages in their conversations" ON public.message_read_states FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.messages m 
        WHERE m.id = message_id AND (
            m.sender_id = auth.uid() OR 
            m.receiver_id = auth.uid() OR 
            (m.group_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = m.group_id AND gm.user_id = auth.uid()))
        )
    )
);
CREATE POLICY "Users can mark messages as read" ON public.message_read_states FOR INSERT 
WITH CHECK (
    auth.uid() = user_id AND 
    EXISTS (
        SELECT 1 FROM public.messages m 
        WHERE m.id = message_id AND (
            m.receiver_id = auth.uid() OR 
            (m.group_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = m.group_id AND gm.user_id = auth.uid()))
        )
    )
);

-- Required for upsert (ON CONFLICT DO UPDATE) to work through RLS
CREATE POLICY "Users can update their own read states" ON public.message_read_states FOR UPDATE
USING (auth.uid() = user_id);

-- Policies: Stories (Friends Only)
-- H3 FIX: Wrap both OR conditions in parentheses BEFORE applying AND status='accepted'
-- so that status check applies to BOTH halves of the OR.
CREATE POLICY "Stories are viewable by friends" ON public.stories FOR SELECT 
USING (
    (expires_at IS NULL OR expires_at > NOW()) AND (
        auth.uid() = user_id OR 
        EXISTS (
            SELECT 1 FROM public.friends 
            WHERE (
                (user_id = public.stories.user_id AND friend_id = auth.uid()) 
                OR (friend_id = public.stories.user_id AND user_id = auth.uid())
            )
            AND status = 'accepted'
        )
    )
);
CREATE POLICY "Users can create their own stories" ON public.stories FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies: Soundboard
CREATE POLICY "Soundboard is viewable by all authenticated users" ON public.soundboard_items FOR SELECT USING (auth.role() = 'authenticated');

-- Policies: Voice Effects
CREATE POLICY "Voice effects are viewable by all authenticated users" ON public.voice_effects FOR SELECT USING (auth.role() = 'authenticated');

-- Policies: User Settings
CREATE POLICY "Users can view own settings" ON public.user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON public.user_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON public.user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies: Widget Configs
CREATE POLICY "Users can view own widget config" ON public.user_widget_configs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own widget config" ON public.user_widget_configs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own widget config" ON public.user_widget_configs FOR INSERT WITH CHECK (auth.uid() = user_id);

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
  -- Profile (Handle username collision by setting to NULL)
  BEGIN
    INSERT INTO public.users (id, email, username, membership)
    VALUES (NEW.id, NEW.email, split_part(NEW.email, '@', 1), 'free');
  EXCEPTION WHEN unique_violation THEN
    INSERT INTO public.users (id, email, username, membership)
    VALUES (NEW.id, NEW.email, NULL, 'free');
  END;

  -- Default Settings
  INSERT INTO public.user_settings (user_id) VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Default Widget Config
  INSERT INTO public.user_widget_configs (user_id) VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

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

-- Trigger: Enforcement of premium content
CREATE OR REPLACE FUNCTION public.check_premium_content_access()
RETURNS TRIGGER AS $$
DECLARE
    user_is_premium BOOLEAN;
    asset_is_premium BOOLEAN;
BEGIN
    -- Check user membership status
    SELECT (membership = 'premium') INTO user_is_premium 
    FROM public.users WHERE id = auth.uid();

    -- Determine if the asset being used is premium
    IF TG_TABLE_NAME = 'messages' OR TG_TABLE_NAME = 'stories' THEN
        IF NEW.voice_effect IS NOT NULL THEN
            SELECT is_premium INTO asset_is_premium FROM public.voice_effects WHERE id = NEW.voice_effect;
            IF asset_is_premium AND NOT COALESCE(user_is_premium, FALSE) THEN
                RAISE EXCEPTION 'Premium membership required to use this voice effect.';
            END IF;
        END IF;
    ELSIF TG_TABLE_NAME = 'user_widget_configs' THEN
        -- Check if any of the new items in slots are premium
        IF EXISTS (
            SELECT 1 FROM public.soundboard_items 
            WHERE id IN (NEW.slot_1_id, NEW.slot_2_id, NEW.slot_3_id, NEW.slot_4_id) 
            AND is_premium = TRUE
        ) AND NOT COALESCE(user_is_premium, FALSE) THEN
            RAISE EXCEPTION 'Premium membership required to use these soundboard items in your widget.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_check_message_premium ON public.messages;
CREATE TRIGGER tr_check_message_premium
    BEFORE INSERT ON public.messages
    FOR EACH ROW EXECUTE FUNCTION public.check_premium_content_access();

DROP TRIGGER IF EXISTS tr_check_story_premium ON public.stories;
CREATE TRIGGER tr_check_story_premium
    BEFORE INSERT ON public.stories
    FOR EACH ROW EXECUTE FUNCTION public.check_premium_content_access();

DROP TRIGGER IF EXISTS tr_check_widget_premium ON public.user_widget_configs;
CREATE TRIGGER tr_check_widget_premium
    BEFORE INSERT OR UPDATE ON public.user_widget_configs
    FOR EACH ROW EXECUTE FUNCTION public.check_premium_content_access();

-- Additional RLS Policies (Fixing missing ones)
-- Users: cho phép tự tạo profile
CREATE POLICY "Users can insert own profile" ON public.users 
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Groups: tạo và xóa
CREATE POLICY "Authenticated users can create groups" ON public.groups 
  FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Members can update group" ON public.groups 
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.group_members 
    WHERE group_id = id AND user_id = auth.uid()
  ));

-- Group members
CREATE POLICY "Members can add members" ON public.group_members 
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.group_members 
    WHERE group_id = public.group_members.group_id AND user_id = auth.uid()
  ));
CREATE POLICY "Members can remove members" ON public.group_members 
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.group_members 
      WHERE group_id = public.group_members.group_id AND user_id = auth.uid()
    )
  );

-- Friends: chấp nhận/từ chối + xóa bạn
CREATE POLICY "Users can update friend status" ON public.friends 
  FOR UPDATE USING (
    (auth.uid() = user_id OR auth.uid() = friend_id) AND 
    (auth.uid() != initiator_id OR status != 'pending')
  );
CREATE POLICY "Users can remove friendship" ON public.friends 
  FOR DELETE USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Stories: xóa story của mình
CREATE POLICY "Users can delete own stories" ON public.stories 
  FOR DELETE USING (auth.uid() = user_id);


-- Missing Performance Indexes
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_friends_status ON public.friends(status);
-- Fast friend lookup for RLS and feed loading
CREATE INDEX IF NOT EXISTS idx_friends_lookup ON public.friends(user_id, friend_id, status);
-- For Story Feed loading
CREATE INDEX IF NOT EXISTS idx_stories_feed_lookup ON public.stories(user_id, created_at DESC);

-- Function to prune expired stories
-- M4: This is a SECURITY DEFINER function. It should ONLY be called from a
--     server-side cron job (e.g. pg_cron or Supabase Edge Functions scheduler).
--     Do NOT expose this via the client-side RPC API.
CREATE OR REPLACE FUNCTION public.delete_expired_stories()
RETURNS VOID AS $$
BEGIN
    DELETE FROM public.stories WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Revoke direct client execution permission
REVOKE EXECUTE ON FUNCTION public.delete_expired_stories() FROM PUBLIC, anon, authenticated;

-- Sample Data for Premium Content Testing
INSERT INTO public.soundboard_items (id, label, icon, sound_url, is_premium)
VALUES 
    ('airhorn', 'Airhorn', '📢', 'https://example.com/airhorn.mp3', FALSE),
    ('cheer', 'Cheer', '🎉', 'https://example.com/cheer.mp3', FALSE),
    ('fart', 'Fart', '💨', 'https://example.com/fart.mp3', TRUE), -- Premium
    ('drumroll', 'Drumroll', '🥁', 'https://example.com/drumroll.mp3', TRUE) -- Premium
ON CONFLICT (id) DO UPDATE SET is_premium = EXCLUDED.is_premium;

INSERT INTO public.voice_effects (id, label, icon, is_premium)
VALUES 
    ('none', 'Normal', '🎤', FALSE),
    ('chipmunk', 'Chipmunk', '🐿️', FALSE),
    ('robot', 'Robot', '🤖', TRUE), -- Premium
    ('deep', 'Deep Voice', '🌑', TRUE) -- Premium
ON CONFLICT (id) DO UPDATE SET is_premium = EXCLUDED.is_premium;

-- Function: Optimized Inbox Fetching
-- Returns the latest message for each conversation (direct or group) including peer info
-- M3 SECURITY: Although this is SECURITY DEFINER, we validate the caller's identity
--   using auth.uid() inside the function. The API layer MUST always pass current_user_id
--   derived from the JWT, not from user-supplied input.
CREATE OR REPLACE FUNCTION public.get_user_inbox(p_user_id UUID)
RETURNS TABLE (
    peer_id UUID,
    is_group BOOLEAN,
    peer_name TEXT,
    peer_avatar TEXT,
    last_message JSONB
) AS $$
BEGIN
    -- M3: Enforce that callers can only retrieve their own inbox
    IF auth.uid() IS NOT NULL AND auth.uid() != p_user_id THEN
        RAISE EXCEPTION 'Unauthorized: cannot access another user inbox';
    END IF;

    RETURN QUERY
    WITH conversation_peers AS (
        -- Direct messages latest message per peer
        (
            SELECT DISTINCT ON (
                CASE WHEN sender_id = p_user_id THEN receiver_id ELSE sender_id END
            )
                m.*,
                CASE WHEN sender_id = p_user_id THEN receiver_id ELSE sender_id END as target_peer_id,
                FALSE as is_grp
            FROM public.messages m
            WHERE (sender_id = p_user_id OR receiver_id = p_user_id) AND group_id IS NULL
            ORDER BY CASE WHEN sender_id = p_user_id THEN receiver_id ELSE sender_id END, created_at DESC
        )
        
        UNION ALL
        
        -- Group messages latest message per group
        (
            SELECT DISTINCT ON (group_id)
                m.*,
                group_id as target_peer_id,
                TRUE as is_grp
            FROM public.messages m
            WHERE group_id IN (SELECT gm.group_id FROM public.group_members gm WHERE gm.user_id = p_user_id)
            ORDER BY group_id, created_at DESC
        )
    )

    SELECT 
        target_peer_id as peer_id,
        is_grp as is_group,
        CASE 
            WHEN is_grp THEN g.name 
            ELSE COALESCE(u.username, u.name, 'User') 
        END as peer_name,
        CASE WHEN is_grp THEN g.avatar ELSE u.avatar END as peer_avatar,
        (to_jsonb(cp.*) - 'target_peer_id' - 'is_grp') || jsonb_build_object('is_played', (
            cp.sender_id = p_user_id OR -- Always played if I sent it
            EXISTS (
                SELECT 1 FROM public.message_read_states mrs 
                WHERE mrs.message_id = cp.id AND mrs.user_id = p_user_id
            )
        )) as last_message
    FROM conversation_peers cp
    LEFT JOIN public.users u ON NOT is_grp AND u.id = target_peer_id
    LEFT JOIN public.groups g ON is_grp AND g.id = target_peer_id
    ORDER BY cp.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get unread counts per conversation
CREATE OR REPLACE FUNCTION public.get_unread_counts(p_user_id UUID)
RETURNS TABLE (
    conversation_id UUID,
    is_group BOOLEAN,
    unread_count BIGINT
) AS $$
BEGIN
    -- M3: Enforce that callers can only retrieve their own counts
    IF auth.uid() IS NOT NULL AND auth.uid() != p_user_id THEN
        RAISE EXCEPTION 'Unauthorized: cannot access another user unread counts';
    END IF;

    RETURN QUERY
    WITH personal_chats AS (
        -- For direct messages, the "conversation id" is the peer's user_id
        SELECT 
            CASE WHEN m.sender_id = p_user_id THEN m.receiver_id ELSE m.sender_id END as conv_id,
            m.id as msg_id,
            FALSE as is_grp
        FROM public.messages m
        WHERE (m.sender_id = p_user_id OR m.receiver_id = p_user_id) 
          AND m.group_id IS NULL
          AND m.sender_id != p_user_id -- Only messages from others can be unread
    ),
    group_chats AS (
        SELECT 
            m.group_id as conv_id,
            m.id as msg_id,
            TRUE as is_grp
        FROM public.messages m
        WHERE m.group_id IN (SELECT gm.group_id FROM public.group_members gm WHERE gm.user_id = p_user_id)
          AND m.sender_id != p_user_id
    ),
    all_chats AS (
        SELECT * FROM personal_chats
        UNION ALL
        SELECT * FROM group_chats
    )
    SELECT 
        a.conv_id as conversation_id,
        a.is_grp as is_group,
        COUNT(a.msg_id) - COUNT(mrs.message_id) as unread_count
    FROM all_chats a
    LEFT JOIN public.message_read_states mrs ON mrs.message_id = a.msg_id AND mrs.user_id = p_user_id
    GROUP BY a.conv_id, a.is_grp
    HAVING (COUNT(a.msg_id) - COUNT(mrs.message_id)) > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Mark all messages in a conversation as read
CREATE OR REPLACE FUNCTION public.mark_conversation_as_read(p_user_id UUID, p_other_id UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.message_read_states (message_id, user_id)
    SELECT m.id, p_user_id
    FROM public.messages m
    WHERE m.sender_id = p_other_id 
      AND m.receiver_id = p_user_id
      AND m.group_id IS NULL
      AND NOT EXISTS (
        SELECT 1 FROM public.message_read_states mrs 
        WHERE mrs.message_id = m.id AND mrs.user_id = p_user_id
      )
    ON CONFLICT (message_id, user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Mark all messages in a group as read
CREATE OR REPLACE FUNCTION public.mark_group_as_read(p_user_id UUID, p_group_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Verify membership
    IF NOT EXISTS (SELECT 1 FROM public.group_members WHERE group_id = p_group_id AND user_id = p_user_id) THEN
        RAISE EXCEPTION 'Not a member of this group';
    END IF;

    INSERT INTO public.message_read_states (message_id, user_id)
    SELECT m.id, p_user_id
    FROM public.messages m
    WHERE m.group_id = p_group_id
      AND m.sender_id != p_user_id -- Can't mark own as unread anyway, but good to be explicit
      AND NOT EXISTS (
        SELECT 1 FROM public.message_read_states mrs 
        WHERE mrs.message_id = m.id AND mrs.user_id = p_user_id
      )
    ON CONFLICT (message_id, user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Payment History table (For RevenueCat webhooks)
CREATE TABLE IF NOT EXISTS public.payment_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_history_user_id ON public.payment_history(user_id);
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;


