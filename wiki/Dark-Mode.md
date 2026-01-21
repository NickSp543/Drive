# Dark Mode

This guide covers the dark mode feature and theme customization in the Drive App.

## Overview

The Drive App supports a system-wide dark mode that applies to all screens:
- Login Screen
- Signup Screen
- Home Screen (including all modals)
- Share Screen
- Navigation Drawer

Dark mode state is shared across all screens using React Context.

## How It Works

### ThemeContext

The app uses a centralized `ThemeContext` to manage dark mode state:

```javascript
// MobileApp/src/contexts/ThemeContext.js

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const theme = {
    bg: darkMode ? '#1a1a1a' : '#fff',
    text: darkMode ? '#e8eaed' : '#202124',
    // ... more colors
  };

  return (
    <ThemeContext.Provider value={{ theme, darkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};
```

### Using Theme in Screens

Each screen accesses the theme via the `useTheme` hook:

```javascript
import { useTheme } from '../contexts/ThemeContext';

const MyScreen = () => {
  const { theme, darkMode, toggleDarkMode } = useTheme();

  return (
    <View style={{ backgroundColor: theme.bg }}>
      <Text style={{ color: theme.text }}>Hello</Text>
    </View>
  );
};
```

## Toggling Dark Mode

### From Any Screen

Tap the sun/moon icon in the header to toggle dark mode.

![Dark Mode Toggle Button](images/dark-mode-toggle-button.png)
*Screenshot: Dark mode toggle button location*

### Toggle Icon

| Mode | Icon |
|------|------|
| Light Mode | 🌙 (Moon) |
| Dark Mode | ☀️ (Sun) |

## Theme Colors

### Light Mode Colors

| Property | Color | Usage |
|----------|-------|-------|
| bg | `#fff` | Main background |
| headerBg | `#fff` | Header background |
| text | `#202124` | Primary text |
| textSecondary | `#5f6368` | Secondary text |
| border | `#e0e0e0` | Borders and dividers |
| inputBg | `#fff` | Input field background |
| inputBorder | `#dadce0` | Input field border |
| modalBg | `#fff` | Modal background |
| drawerBg | `#fff` | Drawer background |

### Dark Mode Colors

| Property | Color | Usage |
|----------|-------|-------|
| bg | `#1a1a1a` | Main background |
| headerBg | `#252525` | Header background |
| text | `#e8eaed` | Primary text |
| textSecondary | `#9aa0a6` | Secondary text |
| border | `#3c4043` | Borders and dividers |
| inputBg | `#3c4043` | Input field background |
| inputBorder | `#5f6368` | Input field border |
| modalBg | `#303134` | Modal background |
| drawerBg | `#252525` | Drawer background |

## Screens with Dark Mode

### Login Screen

![Login Screen Light](images/login-light.png)
*Screenshot: Login screen in light mode*

![Login Screen Dark](images/login-dark.png)
*Screenshot: Login screen in dark mode*

### Signup Screen

![Signup Screen Light](images/signup-light.png)
*Screenshot: Signup screen in light mode*

![Signup Screen Dark](images/signup-dark.png)
*Screenshot: Signup screen in dark mode*

### Home Screen

![Home Screen Light](images/home-light.png)
*Screenshot: Home screen in light mode*

![Home Screen Dark](images/home-dark.png)
*Screenshot: Home screen in dark mode*

### Navigation Drawer

![Drawer Light](images/drawer-light.png)
*Screenshot: Navigation drawer in light mode*

![Drawer Dark](images/drawer-dark.png)
*Screenshot: Navigation drawer in dark mode*

### Modals

All modals support dark mode:

#### Create Modal
![Create Modal Dark](images/create-modal-dark.png)
*Screenshot: Create file/folder modal in dark mode*

#### Action Modal (3-dots menu)
![Action Modal Dark](images/action-modal-dark.png)
*Screenshot: Action modal in dark mode*

#### Rename Modal
![Rename Modal Dark](images/rename-modal-dark.png)
*Screenshot: Rename modal in dark mode*

#### Edit Modal
![Edit Modal Dark](images/edit-modal-dark.png)
*Screenshot: Edit file modal in dark mode*

#### Move Modal
![Move Modal Dark](images/move-modal-dark.png)
*Screenshot: Move to folder modal in dark mode*

### Share Screen

![Share Screen Light](images/share-light.png)
*Screenshot: Share screen in light mode*

![Share Screen Dark](images/share-dark.png)
*Screenshot: Share screen in dark mode*

## State Persistence

Currently, dark mode preference is:
- **Session-based** - Resets when app is restarted
- **System-aware** - Initializes based on device system theme

### Initial State

The app detects the system color scheme on startup:

```javascript
import { useColorScheme } from 'react-native';

const colorScheme = useColorScheme();
const [darkMode, setDarkMode] = useState(colorScheme === 'dark');
```

## Best Practices

1. **Always use theme colors** - Never hardcode colors in components
2. **Test both modes** - Verify UI looks good in both light and dark mode
3. **Contrast ratios** - Ensure text is readable against backgrounds
4. **Consistent toggling** - Toggle button available on all screens

## Adding Dark Mode to New Components

When creating new components:

```javascript
import { useTheme } from '../contexts/ThemeContext';

const NewComponent = () => {
  const { theme, darkMode } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <Text style={[styles.title, { color: theme.text }]}>
        Title
      </Text>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: theme.inputBg,
            borderColor: theme.inputBorder,
            color: theme.text
          }
        ]}
        placeholderTextColor={theme.textSecondary}
      />
    </View>
  );
};
```

---

Back to [Home](Home.md)
