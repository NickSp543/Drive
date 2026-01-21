# Project Structure

Overview of the codebase organization and key files.

## Directory Structure

```
part5/
├── docker-compose.mobile.yml    # Docker config for mobile dev
├── start-mobile-dev.bat         # Windows startup script
├── stop-mobile-dev.bat          # Windows stop script
├── wiki/                        # Documentation
├── data/                        # C++ server file storage
│
├── src/                         # C++ Server Source
│   ├── Server.cpp               # TCP server main
│   ├── Compressor.cpp           # RLE compression
│   ├── AddCommand.cpp           # POST file handler
│   ├── GetCommand.cpp           # GET file handler
│   └── SearchCommand.cpp        # SEARCH handler
│
├── express-server/              # Backend API
│   ├── app.js                   # Express app entry point
│   ├── Dockerfile.node          # Docker configuration
│   ├── package.json             # Node.js dependencies
│   │
│   ├── config/
│   │   └── database.js          # MongoDB connection
│   │
│   ├── controllers/
│   │   ├── fileController.js    # File operations + C++ integration
│   │   ├── permissionController.js  # Sharing logic
│   │   └── userController.js    # Authentication
│   │
│   ├── middleware/
│   │   └── auth.js              # JWT authentication
│   │
│   ├── models/
│   │   ├── fileModel.js         # File/Folder schema (metadata)
│   │   ├── permissionModel.js   # Permission schema
│   │   └── userModel.js         # User schema
│   │
│   ├── services/
│   │   └── socketService.js     # TCP client for C++ server
│   │
│   └── routes/
│       ├── fileRoutes.js        # /api/files routes
│       ├── permissionRoutes.js  # /api/files/:id/permissions
│       └── userRoutes.js        # /api/users routes
│
└── MobileApp/                   # React Native App
    ├── App.tsx                  # App entry point with providers
    ├── app.json                 # Expo configuration
    ├── babel.config.js          # Babel configuration
    ├── package.json             # Dependencies
    │
    └── src/
        ├── contexts/
        │   ├── AuthContext.js   # Authentication state
        │   ├── FileContext.js   # File operations state
        │   └── ThemeContext.js  # Dark mode state (shared)
        │
        ├── navigation/
        │   └── AppNavigator.js  # Navigation setup
        │
        ├── screens/
        │   ├── HomeScreen.js    # Main file browser
        │   ├── LoginScreen.js   # Login form
        │   ├── ShareScreen.js   # Sharing UI
        │   └── SignupScreen.js  # Registration form
        │
        └── utils/
            ├── api.js           # API client
            └── validation.js    # Form validation
```

## C++ Server (src/)

The C++ server handles file storage with RLE compression.

### Key Files

**Server.cpp** - TCP server listening on port 8080
```cpp
// Handles commands:
// - post <key> <data>  - Store file
// - get <key>          - Retrieve file
// - delete <key>       - Delete file
// - search <query>     - Search content
```

**Compressor.cpp** - Run-Length Encoding
```cpp
// Compresses file data before storage
// Decompresses when retrieving
// Format: character followed by count
```

**AddCommand.cpp** - File storage handler
```cpp
// Receives: post <storageKey> <base64Data>
// Compresses data with RLE
// Stores in /data/<storageKey>
// Returns: 200 OK
```

**GetCommand.cpp** - File retrieval handler
```cpp
// Receives: get <storageKey>
// Reads from /data/<storageKey>
// Decompresses with RLE
// Returns: 200 <content>
```

## Backend (express-server/)

### Entry Point

**app.js** - Main Express application setup

```javascript
// Key components:
- Express server initialization
- MongoDB connection
- Route registration
- CORS configuration
- Error handling
```

### Services

**services/socketService.js** - TCP client for C++ server
```javascript
// sendToCppEngine(command)
// Connects to C++ server via TCP
// Sends commands and receives responses
// Used by fileController for file storage
```

### Controllers

**controllers/fileController.js** - Updated for C++ integration
```javascript
// createFile:
//   1. Save metadata to MongoDB
//   2. Send file content to C++ server via TCP
//   3. Store with storageKey (UUID)

// getFileById:
//   1. Get metadata from MongoDB
//   2. Retrieve content from C++ server
//   3. Return combined response

// updateFile:
//   1. Update metadata in MongoDB
//   2. If content changed, update C++ server

// deleteFile:
//   1. Delete from MongoDB
//   2. Send delete command to C++ server
```

### Models

**models/fileModel.js**
```javascript
{
  userId: ObjectId (owner),
  name: String,
  isFolder: Boolean,
  storageKey: String (UUID - links to C++ storage),
  parentId: ObjectId (parent folder),
  isStarred: Boolean,
  isTrashed: Boolean,
  trashedAt: Date
}
```

Note: `data` field removed - content now stored in C++ server

**models/permissionModel.js**
```javascript
{
  fileId: ObjectId,
  userId: ObjectId,
  role: String (owner|writer|reader)
}
```

**models/userModel.js**
```javascript
{
  username: String (unique, required),
  password: String (hashed),
  firstName: String,
  lastName: String,
  phoneNumber: String,
  gender: String,
  birthDate: Date,
  image: String (base64)
}
```

## Mobile App (MobileApp/)

### Entry Point

**App.tsx** - Root component with providers

```jsx
<ThemeProvider>      {/* Dark mode state */}
  <AuthProvider>     {/* Authentication state */}
    <FileProvider>   {/* File operations state */}
      <AppNavigator />
    </FileProvider>
  </AuthProvider>
</ThemeProvider>
```

### Contexts (State Management)

**contexts/ThemeContext.js** (NEW)
```javascript
// Provides:
- theme (color values object)
- darkMode (boolean)
- toggleDarkMode()

// Theme includes:
- bg, headerBg, cardBg
- text, textSecondary
- border, inputBg, inputBorder
- modalBg, drawerBg
- And more...
```

**contexts/AuthContext.js**
```javascript
// Provides:
- user (current user object)
- token (JWT token)
- login(username, password)
- register(userData)
- logout()
- loading (auth loading state)
```

**contexts/FileContext.js**
```javascript
// Provides:
- files (current file list)
- currentFolder (active folder ID)
- currentView (my-drive|starred|etc)
- loading (file loading state)
- fetchFiles(parentId, options)
- createFile(fileData)
- updateFile(id, updates)
- deleteFile(id)
- searchFiles(query)
- getPermissions(fileId)
- grantPermission(fileId, userId, role)
- updatePermission(fileId, permId, role)
- revokePermission(fileId, permId)
- toggleStar(fileId, isStarred)
```

### Screens

**screens/LoginScreen.js**
- Username/password form
- Login validation
- Dark mode toggle
- Navigation to Signup

**screens/SignupScreen.js**
- Full registration form
- Profile picture picker
- Form validation
- Dark mode toggle

**screens/HomeScreen.js**
- File/folder list
- Navigation drawer (dark mode support)
- Create modal (dark mode support)
- Action modal (dark mode support)
- Rename modal (dark mode support)
- Edit modal (dark mode support)
- Move modal (dark mode support)
- Search functionality
- Dark mode toggle (shared via ThemeContext)
- Block/list view toggle
- Drag-and-drop (select & tap)

**screens/ShareScreen.js**
- Add user by username
- Role selection
- Permission list
- Remove access
- Dark mode support (shared via ThemeContext)

## Docker Configuration

**docker-compose.mobile.yml**
```yaml
services:
  cpp-server:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: drive-cpp-server
    ports:
      - "8080:8080"
    volumes:
      - ./data:/data
    environment:
      - DATA_DIR=/data

  backend:
    build:
      context: ./express-server
      dockerfile: Dockerfile.node
    container_name: drive-backend
    ports:
      - "3000:3000"
    environment:
      - MONGO_URI=mongodb://host.docker.internal:27017/driveDB
      - CPP_SERVER_HOST=cpp-server
      - CPP_SERVER_PORT=8080
    depends_on:
      - cpp-server
```

## Key Files Summary

| File | Purpose |
|------|---------|
| `docker-compose.mobile.yml` | Docker orchestration |
| `src/Server.cpp` | C++ file storage server |
| `express-server/app.js` | Backend entry point |
| `express-server/services/socketService.js` | TCP client for C++ |
| `express-server/controllers/fileController.js` | File ops + C++ integration |
| `MobileApp/App.tsx` | Mobile app entry point |
| `MobileApp/src/contexts/ThemeContext.js` | Shared dark mode state |
| `MobileApp/src/screens/HomeScreen.js` | Main UI |

---

## Screenshots

### Project Structure Overview
![Project Structure](images/project-structure.png)
*Screenshot: Visual overview of project folders*

### Docker Containers
![Docker Containers](images/docker-containers.png)
*Screenshot: Running Docker containers*

---

Back to [Home](Home.md)
