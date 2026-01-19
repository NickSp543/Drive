# Part 5 – Drive App (React Native)

This part of the project includes a React Native Drive-like application using the backend Express API.

In addition, the backend API now stores data persistently in MongoDB using Mongoose instead of locally on RAM.

## MobileApp Overview

A React Native (Expo) client that connects to the Drive backend and supports:

- **Auth**: signup + login + persistent session (token stored in AsyncStorage)
- **File browser**:
  - My Drive / Shared / Recent / Starred / Trash
  - Folder navigation (breadcrumb/back stack)
  - List view + grid view
  - Search + pull-to-refresh
  - Dark mode toggle
- **File actions**:
  - Create folder / create file
  - Rename, delete (trash), restore
  - Star / unstar
  - Move items into folders
  - Upload from device (Document Picker; reads text when possible)
- **Sharing**:
  - Share by username
  - Manage role (reader/writer) + revoke access

## Tech Stack (Mobile)

- Expo + React Native
- React Navigation
- Context-based state management:
  - `src/contexts/AuthContext.js`
  - `src/contexts/FileContext.js`
- AsyncStorage for session persistence
- Expo device integrations:
  - Document Picker (upload)
  - Image Picker (profile image during signup)

## Running the Mobile App

### Prerequisites
- Node.js >= 20
- Expo (use `npx expo ...`)
- Backend running on port **3000**
- MongoDB running on the `localhost:27017` connection.

### 1) Start the backend for mobile development (Docker)
From the repo root:

```bash
docker-compose -f docker-compose.mobile.yml up -d
```

### 2) Start the Expo app
```bash
cd MobileApp
npm install
npx expo start
```

Run it using:
- Expo Go on a device, or
- Android emulator / iOS simulator from the Expo UI.