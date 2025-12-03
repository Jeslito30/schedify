import React, { createContext, useState, useContext } from 'react';
import { Colors } from '../constants/Colors';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(true);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const toggleNotifications = () => {
    setIsNotificationsEnabled(prev => !prev);
  };

  // NEW: Helper to set specific state (used when logging in)
  const setNotificationsEnabled = (enabled) => {
    setIsNotificationsEnabled(enabled);
  };

  const themeColors = Colors[theme];

  return (
    <ThemeContext.Provider value={{ 
        theme, 
        toggleTheme, 
        colors: themeColors,
        isNotificationsEnabled,
        toggleNotifications,
        setNotificationsEnabled // Export this new function
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);