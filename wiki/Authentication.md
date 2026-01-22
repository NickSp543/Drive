# Authentication

This guide covers the user registration and login processes in the Drive App.

## Overview

The Drive App uses JWT (JSON Web Token) authentication:
- Users register with username, password, and profile information
- Users login with username and password
- A JWT token is issued and stored for authenticated requests

## Registration Process

### Step 1: Open the App

When you first open the app, you'll see the Login screen.

<img src="images/login-screen.png" alt="Login Screen" width="33%"><br>
*Screenshot: Initial login screen*

### Step 2: Navigate to Registration

Tap **"Create account"** at the bottom of the login screen.

<img src="images/create-account-link.png" alt="Create Account Link" width="33%"><br>
*Screenshot: Create account link*

### Step 3: Fill Registration Form

Complete all required fields:

| Field | Requirements |
|-------|--------------|
| Profile Picture | Optional - tap to select from camera or gallery |
| Username | Minimum 3 characters, unique |
| First Name | Required |
| Last Name | Required |
| Password | Minimum 8 characters |
| Confirm Password | Must match password |
| Phone Number | 10 digits (e.g., 0501234567) |
| Gender | Select: Male, Female, or Other |
| Birth Date | Format: YYYY-MM-DD |

### Step 4: Add Profile Picture (Optional)

Tap the profile picture placeholder to add a photo:

1. Select **Camera** to take a new photo
2. Select **Gallery** to choose existing photo

### Step 5: Submit Registration

Tap **"Create account"** button.

### Step 6: Registration Success

On successful registration, you'll be automatically logged in and redirected to the Home screen.

<img src="images/registration-success.png" alt="Registration Success" width="33%"><br>
*Screenshot: Successful registration - Home screen*

## Login Process

### Step 1: Enter Credentials

On the login screen, enter:
- **Username** - Your registered username
- **Password** - Your password

<img src="images/login-form.png" alt="Login Form" width="33%"><br>
*Screenshot: Login form with credentials*

### Step 2: Tap Sign In

Tap the **"Sign in"** button.

### Step 3: Login Success

On successful login, you'll be redirected to the Home screen showing your files.

## Logout Process

### Step 1: Open Menu

Tap the **hamburger menu** (☰) icon in the top-left corner.

### Step 2: Select Logout

Scroll down in the drawer menu and tap **"Logout"**.

<img src="images/logout-option.png" alt="Logout Option" width="33%"><br>
*Screenshot: Logout option in menu*

### Step 3: Confirm Logout

A confirmation dialog will appear. Tap **"Logout"** to confirm.

<img src="images/logout-confirmation.png" alt="Logout Confirmation" width="33%"><br>
*Screenshot: Logout confirmation dialog*

### Step 4: Return to Login

You'll be redirected to the Login screen.

### Logout Alternative

Alternatively, you can log out by clicking the user icon in the topleft corner of the screen in the Home screen.

## Error Handling

### Registration Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Username already exists" | Username taken | Choose a different username |
| "Password too short" | Less than 8 characters | Use longer password |
| "Passwords don't match" | Confirm password different | Re-enter matching password |
| "Invalid phone number" | Wrong format | Use 10 digits |

<img src="images/registration-error.png" alt="Registration Error" width="33%"><br>
*Screenshot: Registration validation error*

### Login Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Invalid credentials" | Wrong username/password | Check your credentials |
| "Network error" | Backend not reachable | Verify backend is running |

<img src="images/login-error.png" alt="Login Error" width="33%"><br>
*Screenshot: Login error message*

## Session Management

- Sessions are stored locally using AsyncStorage
- Sessions persist across app restarts
- Tokens expire after extended inactivity

## API Endpoints

### Register
```
POST /api/users
Content-Type: application/json

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

### Login
```
POST /api/users/tokens
Content-Type: application/json

{
  "username": "john",
  "password": "password123"
}
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "...",
    "username": "john",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

---

Next: [File Operations](File-Operations.md)
