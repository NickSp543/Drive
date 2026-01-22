# Drive App - System Documentation

Welcome to the Drive App documentation. This wiki contains comprehensive guides for setting up, running, and using the complete system.

## System Overview

The Drive App is a Google Drive-like file management system consisting of:

- **C++ Storage Server** - File storage with RLE compression
- **Backend Server** - Node.js/Express REST API
- **MongoDB Database** - Metadata storage
- **Mobile App** - React Native (Expo) application for Android

## Architecture

```
┌─────────────────┐     ┌─────────────────┐      ┌─────────────────┐
│   Mobile App    │────▶│  Express API    │────▶│    MongoDB      │
│  (React Native) │     │   (Port 3000)   │      │  (Port 27017)   │
└─────────────────┘     └────────┬────────┘      └─────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │   C++ Server    │
                        │   (Port 8080)   │
                        │  File Storage   │
                        │ RLE Compression │
                        └─────────────────┘
```

## Key Features

- User authentication (JWT-based)
- File and folder management
- File sharing with permissions (Owner/Writer/Reader)
- Dark mode support across all screens
- List and grid view options
- Drag-and-drop file organization
- Search functionality
- Starred items and trash management
- RLE-compressed file storage

## Wiki Pages

### Getting Started
- [Environment Setup](Environment-Setup.md) - Prerequisites and installation
- [Running the System](Running-the-System.md) - How to start all services

### User Guides
- [Authentication](Authentication.md) - Login and registration
- [File Operations](File-Operations.md) - Create, edit, delete files and folders
- [Sharing & Permissions](Sharing-Permissions.md) - Share files with other users
- [Dark Mode](Dark-Mode.md) - Theme customization

### Technical Documentation
- [API Reference](API-Reference.md) - Backend API endpoints
- [Project Structure](Project-Structure.md) - Codebase organization
- [C++ Server](Cpp-Server.md) - File storage engine

---

## Quick Start

```bash
# 1. Start all services (MongoDB, Backend, C++ Server)
docker-compose -f docker-compose.mobile.yml up -d

# 2. Start Mobile App (in separate terminal)
cd MobileApp
npx expo start --android
```

For detailed instructions, see [Running the System](Running-the-System.md).