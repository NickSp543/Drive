# Screenshot Placeholders

This folder should contain screenshots for the wiki documentation.

## Required Screenshots

### Environment Setup
- [ ] `android-studio-device-manager.png` - Android Studio Device Manager window
- [ ] `network-config.png` - ipconfig/ifconfig output showing IP address
- [ ] `adb-devices.png` - Terminal showing `adb devices` output

### Running the System
- [ ] `startup-script.png` - start-mobile-dev.bat running
- [ ] `docker-compose-up.png` - Docker Compose starting services
- [ ] `mongodb-running.png` - netstat showing MongoDB on 27017
- [ ] `backend-running.png` - curl response from backend
- [ ] `docker-ps.png` - Docker ps output
- [ ] `docker-logs.png` - Backend server logs
- [ ] `expo-start.png` - Expo Metro bundler starting
- [ ] `bundling-complete.png` - Metro bundler done
- [ ] `app-running-emulator.png` - App on Android emulator
- [ ] `all-ports-listening.png` - netstat showing all ports

### Authentication
- [ ] `login-screen.png` - Initial login screen
- [ ] `create-account-link.png` - Create account link highlighted
- [ ] `registration-form.png` - Registration form filled
- [ ] `profile-picture-options.png` - Camera/Gallery selection
- [ ] `create-account-button.png` - Create account button
- [ ] `registration-success.png` - Success, showing home screen
- [ ] `login-form.png` - Login form with credentials
- [ ] `sign-in-button.png` - Sign in button
- [ ] `login-success-home.png` - Home screen after login
- [ ] `menu-icon.png` - Hamburger menu icon
- [ ] `logout-option.png` - Logout in drawer menu
- [ ] `logout-confirmation.png` - Logout confirmation dialog
- [ ] `registration-error.png` - Validation error example
- [ ] `login-error.png` - Login error message

### File Operations
- [ ] `home-screen-layout.png` - Home screen with labels
- [ ] `create-button.png` - Floating + button
- [ ] `create-menu.png` - Create modal options
- [ ] `create-folder.png` - Creating folder dialog
- [ ] `create-file.png` - Creating file dialog
- [ ] `upload-from-files.png` - Upload button
- [ ] `file-picker.png` - Device file picker
- [ ] `upload-success.png` - Upload success message
- [ ] `open-folder.png` - Tapping folder
- [ ] `inside-folder.png` - Folder contents view
- [ ] `back-navigation.png` - Back arrow/breadcrumb
- [ ] `long-press-item.png` - Long pressing an item
- [ ] `action-menu.png` - Action menu with options
- [ ] `edit-option.png` - Edit option highlighted
- [ ] `edit-content.png` - Editing file content
- [ ] `save-changes.png` - Save button
- [ ] `rename-option.png` - Rename option
- [ ] `rename-dialog.png` - Rename dialog
- [ ] `renamed-item.png` - Item with new name
- [ ] `move-dialog.png` - Move destination selection
- [ ] `drag-mode-selected.png` - Item selected for moving
- [ ] `drop-target-folder.png` - Folder as drop target
- [ ] `star-option.png` - Star option in menu
- [ ] `starred-view.png` - Starred items view
- [ ] `delete-option.png` - Delete option
- [ ] `delete-confirmation.png` - Delete confirmation
- [ ] `trash-view.png` - Trash view
- [ ] `permanent-delete.png` - Permanent delete option
- [ ] `list-view.png` - List view mode
- [ ] `block-view.png` - Block/grid view mode
- [ ] `light-mode.png` - Light theme
- [ ] `dark-mode.png` - Dark theme
- [ ] `search-files.png` - Search input
- [ ] `search-results.png` - Search results
- [ ] `navigation-drawer.png` - Full drawer menu

### Sharing & Permissions
- [ ] `share-long-press.png` - Long press to share
- [ ] `share-option-menu.png` - Share in action menu
- [ ] `share-screen.png` - Share screen layout
- [ ] `share-enter-username.png` - Entering username
- [ ] `share-select-role.png` - Role selection
- [ ] `share-add-button.png` - Add button
- [ ] `share-user-added.png` - User in list
- [ ] `people-with-access.png` - Permissions list
- [ ] `change-role-dropdown.png` - Role dropdown
- [ ] `role-changed.png` - Role changed
- [ ] `remove-access-button.png` - X button
- [ ] `remove-access-confirmation.png` - Remove confirmation
- [ ] `open-menu-drawer.png` - Opening menu
- [ ] `shared-with-me-option.png` - Shared option
- [ ] `shared-files-list.png` - Shared files
- [ ] `folder-sharing-inheritance.png` - Folder sharing
- [ ] `share-screen-components.png` - Labeled components
- [ ] `share-user-not-found.png` - User not found error
- [ ] `share-already-has-access.png` - Already shared error
- [ ] `share-permission-denied.png` - Permission denied error

## How to Take Screenshots

### Android Emulator
1. Use the camera icon in emulator sidebar, or
2. Press `Ctrl+S` in the emulator, or
3. Use `adb exec-out screencap -p > screenshot.png`

### Recommended Settings
- Emulator resolution: 1080x2340 (Pixel 6)
- Use PNG format
- Crop to show relevant UI area
- Keep file sizes reasonable (< 500KB)

## Naming Convention

Use lowercase with hyphens:
- `login-screen.png` ✓
- `LoginScreen.png` ✗
- `login_screen.png` ✗
