# Firebase Chat Service Setup Guide

## 📋 Current App Structure Overview

### Architecture
Your app uses a **hybrid authentication system**:
- **MongoDB + JWT**: User accounts, authentication, and business logic
- **Firebase**: Real-time chat functionality (Firestore + Auth)

### Why This Architecture?
- MongoDB stores user accounts, offers, and business data
- Firebase provides real-time messaging capabilities
- Custom tokens bridge the two systems (MongoDB user ID → Firebase Auth)

---

## 🏗️ Current Implementation Status

### ✅ What's Already Working

1. **Authentication Flow** (`frontend/src/Login.jsx`):
   - User logs in with email/password → gets JWT token
   - JWT token is sent to backend → backend creates Firebase custom token
   - Frontend signs in to Firebase with custom token
   - User is authenticated in both systems

2. **Backend Firebase Admin** (`backend/config/firebaseAdmin.js`):
   - Firebase Admin SDK initialized
   - Custom token generation endpoint (`/chat/firebase-token`)

3. **Frontend Firebase Config** (`frontend/src/firebase.js`):
   - Firebase app initialized
   - Firestore database ready
   - Auth configured

4. **UI Components** (All built, but using mock data):
   - `ChatPage.jsx` - Main chat page layout
   - `Sidebar.jsx` - Chat list sidebar
   - `ChatList.jsx` - List of conversations (currently hardcoded)
   - `ChatWindow.jsx` - Chat messages display (currently hardcoded)
   - `Message.jsx` - Individual message component
   - `Input.jsx` - Message input field

### ❌ What Needs to Be Completed

1. **`chatService.js`** - Incomplete! Has partial code but not functional
2. **Connect UI to Firebase** - Replace mock data with real Firestore data
3. **Real-time message listening** - Set up Firestore listeners
4. **Send messages** - Implement message sending functionality
5. **Chat list from Firestore** - Fetch and display real conversations

---

## 📁 File Structure Explained

```
Swap/
├── backend/
│   ├── config/
│   │   ├── firebaseAdmin.js      ✅ Firebase Admin initialized
│   │   └── db.js                  ✅ MongoDB connection
│   ├── routes/
│   │   └── chat.js                ✅ Custom token endpoint
│   └── controllers/
│       └── authController.js      ✅ Login/Register
│
└── frontend/
    ├── src/
    │   ├── firebase.js            ✅ Firebase config
    │   ├── services/
    │   │   └── chatService.js     ❌ INCOMPLETE - needs functions
    │   ├── pages/
    │   │   └── ChatPage.jsx       ✅ Layout ready
    │   └── chat_components/
    │       ├── ChatList.jsx       ⚠️  Has UI, needs Firebase data
    │       ├── ChatWindow.jsx    ⚠️  Has UI, needs Firebase data
    │       ├── Input.jsx          ⚠️  Has UI, needs send function
    │       └── Message.jsx        ✅ Ready to use
```

---

## 🔥 Firebase Firestore Data Structure

Your chat system will use this structure:

### Collection: `chats`
Each document represents a conversation between two users.

**Document ID**: `{userId1}_{userId2}` (sorted alphabetically)

**Document Structure**:
```javascript
{
  participants: ["userId1", "userId2"],  // Array of user IDs
  createdAt: Timestamp,
  updatedAt: Timestamp,
  lastMessage: "Hello!",
  lastMessageAt: Timestamp,
  unreadCounts: {
    "userId1": 0,
    "userId2": 3
  }
}
```

### Subcollection: `chats/{chatId}/messages`
Each message in a conversation.

**Document Structure**:
```javascript
{
  senderId: "userId1",
  text: "Hello!",
  timestamp: Timestamp,
  read: false
}
```

---

## 🚀 Step-by-Step Setup Guide

### Step 1: Complete `chatService.js`

This file needs these functions:

1. **`getOrCreateChat(userId1, userId2)`** - Get existing chat or create new one
2. **`sendMessage(chatId, senderId, text)`** - Send a message
3. **`subscribeToMessages(chatId, callback)`** - Listen to messages in real-time
4. **`subscribeToChats(userId, callback)`** - Listen to user's conversations
5. **`markAsRead(chatId, userId)`** - Mark messages as read

### Step 2: Update `ChatList.jsx`

Replace hardcoded conversations with:
- Fetch user's chats from Firestore
- Use `subscribeToChats()` for real-time updates
- Display actual conversation data

### Step 3: Update `ChatWindow.jsx`

- Accept `chatId` and `otherUserId` as props
- Use `subscribeToMessages()` to listen to messages
- Display real messages from Firestore
- Show other user's info (name, avatar)

### Step 4: Update `Input.jsx`

- Add `onSend` handler
- Call `sendMessage()` from chatService
- Clear input after sending

### Step 5: Update `ChatPage.jsx`

- Manage selected chat state
- Pass chat data to ChatWindow
- Handle chat selection from ChatList

### Step 6: Get Current User

- Use `auth.currentUser` from Firebase to get current user ID
- Store user info in context or pass as props

---

## 📝 Implementation Details

### Getting Current User ID
```javascript
import { auth } from '../firebase';

const currentUserId = auth.currentUser?.uid;
```

### Firestore Security Rules (Important!)
You'll need to set up Firestore security rules in Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write chats they're part of
    match /chats/{chatId} {
      allow read, write: if request.auth != null && 
        request.auth.uid in resource.data.participants;
      
      // Messages subcollection
      match /messages/{messageId} {
        allow read: if request.auth != null && 
          request.auth.uid in get(/databases/$(database)/documents/chats/$(chatId)).data.participants;
        allow create: if request.auth != null && 
          request.auth.uid == request.resource.data.senderId;
      }
    }
  }
}
```

---

## 🎯 Next Steps

1. Start with completing `chatService.js` - this is the foundation
2. Test each function individually
3. Connect UI components one by one
4. Test real-time updates
5. Add error handling and loading states

Good luck! 🚀

