# Echo API Documentation

This document describes the FastAPI backend for **Echo - The Whisper Widget**. The API acts as a gateway to Supabase, handling authentication, validation, and specialized business logic.

## Technical Stack
- **Framework**: FastAPI (Python 3.10+)
- **ORM/Client**: Supabase Python SDK
- **Authentication**: JWT-based (Integrated with Supabase Auth)
- **Architecture**: Modular router-based pattern (`app/routers`)

---

## 🔐 Authentication

All endpoints (except `/` and `/health`) require a valid Supabase Access Token in the Authorization header:
`Authorization: Bearer <your_jwt_token>`

The backend provides a `CurrentUser` dependency that extracts and verifies the `user_id` from the token.

---

## 📡 API Endpoints Summary

### 👤 User Profile (`/users`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **GET** | `/users/me` | Fetch the current user's profile info. |
| **PUT** | `/users/me` | Update display name, avatar, or status. |
| **POST** | `/users/upgrade` | Upgrade account to Premium status. |
| **GET** | `/users/{id}` | Public profile lookup for another user. |

### 💬 Messaging (`/messages`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **POST** | `/messages/` | Send a direct or group audio message. |
| **GET** | `/messages/inbox` | Get latest messages from all active conversations. |
| **GET** | `/messages/{other_id}` | Fetch chat history with a specific friend. |
| **GET** | `/messages/group/{group_id}` | Fetch chat history for a group. |
| **POST** | `/messages/{id}/played` | Mark a message as played/read by the current user. |
| **GET** | `/messages/{id}/reads` | See a list of user IDs who have read this message. |

### 🤝 Social (`/friends`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **POST** | `/friends/` | Send a new friend request. |
| **GET** | `/friends/` | List all friendships (pending and accepted). |
| **PATCH** | `/friends/{id}` | Accept, decline, or block a friend request. |
| **DELETE** | `/friends/{id}`| Remove a friend. |

### 👥 Groups (`/groups`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **POST** | `/groups/` | Create a new messaging group. |
| **GET** | `/groups/{id}` | Get group details. |
| **POST** | `/groups/{id}/members` | Add a user to a group. |
| **DELETE** | `/groups/{id}/members/{user_id}` | Remove a member or leave a group. |

### 📖 Stories (`/stories`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **POST** | `/stories/` | Post a new 24-hour audio story. |
| **GET** | `/stories/` | List current active stories from friends. |
| **GET** | `/stories/my` | View your own active stories. |
| **DELETE** | `/stories/{id}` | Delete a story before it expires. |

### 🎭 Assets (`/soundboard` & `/voice_effects`)
- **`GET /soundboard/`**: List all available soundboard items.
- **`GET /voice_effects/`**: List all available voice manipulation filters.

---

## 🛠 Features & Patterns

### 1. Premium Content Validation
The API checks the user's `membership` status before allowing:
- Use of premium voice effects in messages or stories.
- Assigning premium sounds to the widget soundboard.

### 2. Notifications & Cleanup
When a message is sent, the `/messages/notify` endpoint is called to dispatch push notifications. This also schedules a background task for future resource cleanup if needed.

### 3. Error Handling
The backend includes a customized exception handler for `PostgrestError`, translating deep database errors into clean, readable JSON responses for the frontend.

### 4. Shared Pydantic Models
Located in `app/models/`, these models ensure consistent data validation across all routers for both requests and responses.
