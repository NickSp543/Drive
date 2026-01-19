import React, { createContext, useContext, useState } from 'react';
import { useColorScheme } from 'react-native';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const colorScheme = useColorScheme();
  const [darkMode, setDarkMode] = useState(colorScheme === 'dark');

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const theme = {
    darkMode,
    bg: darkMode ? '#1a1a1a' : '#fff',
    headerBg: darkMode ? '#252525' : '#fff',
    cardBg: darkMode ? '#252525' : '#fff',
    text: darkMode ? '#e8eaed' : '#202124',
    textSecondary: darkMode ? '#9aa0a6' : '#5f6368',
    border: darkMode ? '#3c4043' : '#e0e0e0',
    inputBg: darkMode ? '#3c4043' : '#fff',
    inputBorder: darkMode ? '#5f6368' : '#dadce0',
    placeholder: '#9aa0a6',
    itemBg: darkMode ? '#252525' : '#fff',
    itemBorder: darkMode ? '#3c4043' : '#f1f3f4',
    searchBg: darkMode ? '#303134' : '#f1f3f4',
    drawerBg: darkMode ? '#252525' : '#fff',
    modalBg: darkMode ? '#303134' : '#fff',
    roleButtonActiveBg: darkMode ? '#3c4043' : '#e8f0fe',
    roleButtonActiveBorder: darkMode ? '#8ab4f8' : '#1a73e8',
    roleButtonActiveText: darkMode ? '#8ab4f8' : '#1a73e8',
  };

  return (
    <ThemeContext.Provider value={{ theme, darkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
