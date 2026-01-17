# Drive App - System Documentation

Welcome to the Drive App documentation. This wiki contains comprehensive guides for setting up, running, and using the complete system.

## System Overview

The Drive App is a Google Drive-like file management system consisting of:

- **Backend Server** - Node.js/Express REST API
- **MongoDB Database** - Data storage
- **Mobile App** - React Native (Expo) application for Android

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Mobile App    │────▶│  Express API    │────▶│    MongoDB      │
│  (React Native) │     │   (Port 3000)   │     │  (Port 27017)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Wiki Pages

### Getting Started
- [Environment Setup](Environment-Setup.md) - Prerequisites and installation
- [Running the System](Running-the-System.md) - How to start all services

### User Guides
- [Authentication](Authentication.md) - Login and registration
- [File Operations](File-Operations.md) - Create, edit, delete files and folders
- [Sharing & Permissions](Sharing-Permissions.md) - Share files with other users

### Technical Documentation
- [API Reference](API-Reference.md) - Backend API endpoints
- [Project Structure](Project-Structure.md) - Codebase organization

---

## Quick Start

```bash
# 1. Start MongoDB and Backend
docker-compose -f docker-compose.mobile.yml up -d

# 2. Start Mobile App (in separate terminal)
cd MobileApp
npx expo start --android
```

For detailed instructions, see [Running the System](Running-the-System.md).
