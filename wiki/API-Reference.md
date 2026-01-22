# API Reference

Complete reference for the Drive App REST API.

## Base URL

```
http://localhost:3000/api
```

## Authentication

All endpoints except registration and login require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

---

## Users

### Register User
Creates a new user account.

```http
POST /users
```

**Request Body:**
```json
{
  "username": "john",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "0501234567",
  "gender": "male",
  "birthDate": "1990-01-15",
  "image": "data:image/jpeg;base64,..."
}
```

**Response:** `201 Created`
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "username": "john",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

### Login
Authenticates user and returns token.

```http
POST /users/tokens
```

**Request Body:**
```json
{
  "username": "john",
  "password": "password123"
}
```

**Response:** `200 OK`
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "username": "john",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

### Get User by ID
Retrieves user information.

```http
GET /users/:id
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "username": "john",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "0501234567",
  "gender": "male"
}
```

### Get User by Username
Looks up user by username.

```http
GET /users/by-username/:username
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "username": "john",
  "firstName": "John",
  "lastName": "Doe"
}
```

---

## Files

### List Files
Retrieves files for the authenticated user.

```http
GET /files
Authorization: Bearer <token>
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| parentId | string | Filter by parent folder ID |
| view | string | View type: `my-drive`, `starred`, `recent`, `shared`, `trash` |
| folders | boolean | Only return folders |
| files | boolean | Only return files |

**Response:** `200 OK`
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Documents",
    "isFolder": true,
    "userId": "507f1f77bcf86cd799439012",
    "parentId": null,
    "isStarred": false,
    "isTrashed": false,
    "createdAt": "2024-01-15T10:30:00Z"
  },
  {
    "_id": "507f1f77bcf86cd799439013",
    "name": "notes.txt",
    "isFolder": false,
    "data": "File content here...",
    "userId": "507f1f77bcf86cd799439012",
    "parentId": null,
    "isStarred": true,
    "isTrashed": false,
    "createdAt": "2024-01-15T11:00:00Z"
  }
]
```

### Get File by ID
Retrieves a specific file.

```http
GET /files/:id
Authorization: Bearer <token>
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| contents | boolean | Include folder contents |

**Response:** `200 OK`
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "notes.txt",
  "isFolder": false,
  "data": "File content here...",
  "userId": "507f1f77bcf86cd799439012",
  "parentId": null,
  "isStarred": false,
  "isTrashed": false
}
```

### Create File/Folder
Creates a new file or folder.

```http
POST /files
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "New Document.txt",
  "isFolder": false,
  "data": "File content here...",
  "parentId": "507f1f77bcf86cd799439011"
}
```

**Response:** `201 Created`
```json
{
  "_id": "507f1f77bcf86cd799439014",
  "name": "New Document.txt",
  "isFolder": false,
  "data": "File content here...",
  "userId": "507f1f77bcf86cd799439012",
  "parentId": "507f1f77bcf86cd799439011"
}
```

### Update File
Updates file properties.

```http
PATCH /files/:id
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Renamed File.txt",
  "data": "Updated content...",
  "isStarred": true,
  "parentId": "new-parent-folder-id"
}
```

**Response:** `200 OK`

### Delete File
Moves file to trash or permanently deletes.

```http
DELETE /files/:id
Authorization: Bearer <token>
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| permanent | boolean | Permanently delete if true |

**Response:** `204 No Content`

### Search Files
Searches files by name and content.

```http
GET /search/:query
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "name": "matching-file.txt",
    "isFolder": false
  }
]
```

---

## Permissions

### Get Permissions
Retrieves all permissions for a file.

```http
GET /files/:id/permissions
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
[
  {
    "id": "507f1f77bcf86cd799439015",
    "userId": "507f1f77bcf86cd799439012",
    "username": "john",
    "role": "writer",
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

### Create Permission
Shares a file with another user.

```http
POST /files/:id/permissions
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "userId": "507f1f77bcf86cd799439012",
  "role": "reader"
}
```

**Roles:** `reader`, `writer`

**Response:** `201 Created`

### Update Permission
Changes permission level.

```http
PATCH /files/:id/permissions/:permissionId
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "role": "writer"
}
```

**Response:** `204 No Content`

### Delete Permission
Removes user access.

```http
DELETE /files/:id/permissions/:permissionId
Authorization: Bearer <token>
```

**Response:** `204 No Content`

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Name is required"
}
```

### 401 Unauthorized
```json
{
  "error": "Access token required"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden: Only owner can share"
}
```

### 404 Not Found
```json
{
  "error": "File not found"
}
```

### 409 Conflict
```json
{
  "error": "Permission already exists"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error message"
}
```

---

## CORS

The API allows cross-origin requests from any origin in development mode.

---

Next: [Project Structure](Project-Structure.md)
