# Project Structure

Overview of the codebase organization and key files.

## Directory Structure

```
part5/
├── docker-compose.mobile.yml    # Docker config for mobile dev
├── start-mobile-dev.bat         # Windows startup script
├── stop-mobile-dev.bat          # Windows stop script
├── wiki/                        # Documentation
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
│   │   ├── fileController.js    # File operations
│   │   ├── permissionController.js  # Sharing logic
│   │   └── userController.js    # Authentication
│   │
│   ├── middleware/
│   │   └── auth.js              # JWT authentication
│   │
│   ├── models/
│   │   ├── fileModel.js         # File/Folder schema
│   │   ├── permissionModel.js   # Permission schema
│   │   └── userModel.js         # User schema
│   │
│   └── routes/
│       ├── fileRoutes.js        # /api/files routes
│       ├── permissionRoutes.js  # /api/files/:id/permissions
│       └── userRoutes.js        # /api/users routes
│
└── MobileApp/                   # React Native App
    ├── App.tsx                  # App entry point
    ├── app.json                 # Expo configuration
    ├── babel.config.js          # Babel configuration
    ├── package.json             # Dependencies
    │
    └── src/
        ├── contexts/
        │   ├── AuthContext.js   # Authentication state
        │   └── FileContext.js   # File operations state
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

## Backend (express-server)

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

### Configuration

**config/database.js** - Database connection

```javascript
// Connects to MongoDB using:
// - MONGO_URI environment variable (Docker)
// - Or default: mongodb://127.0.0.1:27017/driveDB
```

### Models

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

**models/fileModel.js**
```javascript
{
  userId: ObjectId (owner),
  name: String,
  isFolder: Boolean,
  data: String (file content),
  parentId: ObjectId (parent folder),
  isStarred: Boolean,
  isTrashed: Boolean,
  trashedAt: Date
}
```

**models/permissionModel.js**
```javascript
{
  fileId: ObjectId,
  userId: ObjectId,
  role: String (owner|writer|reader)
}
```

### Controllers

**controllers/userController.js**
- `registerUser` - Create new user
- `login` - Authenticate user, return JWT
- `getUser` - Get user by ID
- `getUserByUsername` - Lookup user

**controllers/fileController.js**
- `getFiles` - List files with filters
- `getFileById` - Get single file
- `createFile` - Create file/folder
- `updateFile` - Update properties
- `deleteFile` - Trash or delete
- `searchFiles` - Search by name/content

**controllers/permissionController.js**
- `getPermissions` - List file permissions
- `createPermission` - Share with user
- `updatePermission` - Change role
- `deletePermission` - Remove access
- `getEffectiveRole` - Calculate inherited permissions

### Middleware

**middleware/auth.js**
```javascript
// JWT authentication middleware
// Extracts userId from token
// Attaches to req.userId
```

## Mobile App (MobileApp)

### Entry Point

**App.tsx** - Root component with providers

```jsx
<AuthProvider>
  <FileProvider>
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  </FileProvider>
</AuthProvider>
```

### Contexts (State Management)

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
- Navigation to Signup

**screens/SignupScreen.js**
- Full registration form
- Profile picture picker
- Form validation

**screens/HomeScreen.js**
- File/folder list
- Navigation drawer
- Create modal
- Action modal
- Search functionality
- Dark mode toggle
- Block/list view toggle
- Drag-and-drop (select & tap)

**screens/ShareScreen.js**
- Add user by username
- Role selection
- Permission list
- Remove access

### Utilities

**utils/api.js**
```javascript
// API client configuration
const API_URL = 'http://YOUR_IP:3000/api';

// Functions:
- apiFetch(endpoint, options) - Fetch with auth
- getToken() / setToken() - Token management
- getUser() / setUser() - User storage
```

**utils/validation.js**
```javascript
// Form validation functions
- validateLoginForm(username, password)
- validateRegistrationForm(formData)
```

## Docker Configuration

**docker-compose.mobile.yml**
```yaml
services:
  backend:
    build: ./express-server
    ports: "3000:3000"
    environment:
      MONGO_URI: mongodb://host.docker.internal:27017/driveDB
```

Uses `host.docker.internal` to connect to local MongoDB.

## Key Files Summary

| File | Purpose |
|------|---------|
| `docker-compose.mobile.yml` | Docker orchestration |
| `express-server/app.js` | Backend entry point |
| `express-server/config/database.js` | MongoDB connection |
| `MobileApp/App.tsx` | Mobile app entry point |
| `MobileApp/src/utils/api.js` | API configuration |
| `MobileApp/src/contexts/AuthContext.js` | Auth state |
| `MobileApp/src/contexts/FileContext.js` | File state |
| `MobileApp/src/screens/HomeScreen.js` | Main UI |

---

Back to [Home](Home.md)
