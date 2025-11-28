import React, { createContext, useState, useContext } from 'react';
import { Colors } from '../constants/Colors';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light'); // Default to light
  // Global Notification State
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(true);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const toggleNotifications = () => {
    setIsNotificationsEnabled(prev => !prev);
  };

  const themeColors = Colors[theme];

  return (
    <ThemeContext.Provider value={{ 
        theme, 
        toggleTheme, 
        colors: themeColors,
        isNotificationsEnabled,
        toggleNotifications
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);