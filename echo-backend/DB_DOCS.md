# Echo Database Documentation

This document provides a detailed overview of the Supabase database schema for **Echo - The Whisper Widget**. The database is designed for a social audio-messaging platform with a focus on real-time interactions, premium features, and robust privacy.

## Core Architecture

The database is built on **Supabase (PostgreSQL)**, utilizing:
- **UUIDs**: For all primary identifiers.
- **RLS (Row Level Security)**: To ensure users can only access their own messages, settings, and friend's data.
- **Custom ENUMs**: To maintain data integrity for statuses and types.
- **Triggers & Functions**: For automated profile creation and business logic enforcement.

---

## 1. Tables Overview

- **`public.users`**: Extends Supabase Auth users with public profile info.
  - `id`: UUID (Primary Key, references `auth.users`)
  - `username`: Unique display name.
  - `membership`: `free` or `premium`.
  - `status`: `online`, `offline`, `busy`, etc.
  - `streak`: Tracks consecutive days of use.

- **`public.user_settings`**: Private user preferences.
  - `app_theme`: Visual theme configuration.
  - `haptic_feedback`: Customizable haptic vibrations (`heartbeat`, `intense`, `gentle`).

- **`public.user_widget_configs`**: Configuration for the home screen widget.
  - `slot_1_id` to `slot_4_id`: References `soundboard_items`.

### 💬 Messaging
- **`public.messages`**: The core table for all audio communication.
  - `sender_id` / `receiver_id`: Linking users in 1-1 chats.
  - `group_id`: If populated, indicates a group message (mutually exclusive with `receiver_id`).
  - `audio_url`: URL to the hosted audio file.
  - `voice_effect`: Reference to applied vocal filters.
  - `created_at`: Timestamp of sending.

- **`public.message_read_states`**: Tracks per-user read/played status.
  - `message_id`: Reference to message.
  - `user_id`: Reference to user who read the message.
  - `read_at`: Timestamp when the message was read.

- **`public.groups`**: Metadata for group chats.
- **`public.group_members`**: Mapping users to groups.

### 🤝 Social Features
- **`public.friends`**: Bidirectional relationship tracking.
  - Uses a `user_id < friend_id` constraint to prevent redundant rows.
  - `status`: `pending`, `accepted`, `blocked`.
  - `initiator_id`: Tracks who sent the request.

- **`public.stories`**: 24-hour ephemeral audio snapshots.
  - `expires_at`: Automatic expiration timestamp.
  - Viewable only by accepted friends.

### 🎭 Assets & Effects
- **`public.voice_effects`**: Filters for audio manipulation (e.g., Robot, Chipmunk).
- **`public.soundboard_items`**: Pre-shipped sounds for the widget.
  - `is_premium`: Flag to restrict access to paid users.

---

## 2. Row Level Security (RLS) Policies

Privacy is a first-class citizen in Echo. Every table has RLS enabled:

| Table | Policy Summary |
| :--- | :--- |
| **Users** | Public profiles visible to everyone; only owner can update. |
| **Messages** | Only the sender, receiver, or group members can view a message. |
| **Read Status** | Users can only see read status for messages they are part of. |
| **Friends** | Only the two involved users can see their relationship status. |
| **Stories** | Only the owner and their accepted friends can view active stories. |
| **Settings** | Strictly private to the owning user. |

---

## 3. Automated Logic (Triggers & Functions)

- **`handle_new_user()`**: Automatically creates a `users` profile, default `user_settings`, and `user_widget_configs` when a new account is registered via Supabase Auth.
- **`check_premium_content_access()`**: A safeguard trigger that prevents non-premium users from sending messages with premium voice effects or using premium soundboard items in their widget.
- **`get_user_inbox()`**: A specialized Postgres function (RPC) that calculates the "Inbox View" by fetching the latest message from every unique conversation (direct or group) for a user.

---

## 4. Performance Optimizations

- **Composite Indexes**: Optimized for fetching conversation history (`sender_id, receiver_id, created_at DESC`).
- **Filtered Indexes**: Unread messages and active stories are indexed separately for lightning-fast notification badges and feed loading.
- **Constraint Enforcement**: Database-level checks ensure data consistency (e.g., `user_id < friend_id` for friendships).
