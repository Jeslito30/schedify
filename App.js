import React, { useState, useEffect, Suspense } from 'react';
import SplashScreen from './screens/SplashScreen';
import LoginScreen from './screens/LoginScreen';
import SignUpScreen from './screens/SignUpScreen';
import { initDB } from './services/Database';
import { SQLiteProvider } from 'expo-sqlite';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import AppNavigator from './components/AppNavigator';
import { ThemeProvider, useTheme } from './context/ThemeContext'; 
import { registerForPushNotificationsAsync } from './services/NotificationService'; 

// Separate component to access useTheme
const ScreenManager = () => {
  const [appState, setAppState] = useState('login');
  const [loggedInUser, setLoggedInUser] = useState(null);
  const { theme, setNotificationsEnabled } = useTheme(); // Get setter

  useEffect(() => {
    registerForPushNotificationsAsync();
  }, []);

  // NEW: Sync Database Setting to App State on Login
  useEffect(() => {
    if (loggedInUser) {
      // If database has 1 (true) or 0 (false), update context
      // Default to true if undefined
      const isEnabled = loggedInUser.notifications_enabled !== 0; 
      setNotificationsEnabled(isEnabled);
    }
  }, [loggedInUser]);

  const navigationTheme = theme === 'dark' ? DarkTheme : DefaultTheme;

  if (appState === 'login') {
    return (
      <LoginScreen
        onLoginSuccess={(user) => {
          setLoggedInUser(user);
          setAppState('main');
        }}
        onSignUpPress={() => setAppState('signup')}
      />
    );
  }

  if (appState === 'signup') {
    return (
      <SignUpScreen
        onSignUp={(user) => {
          setLoggedInUser(user);
          setAppState('main');
        }}
        onBackToLogin={() => setAppState('login')}
      />
    );
  }

  if (appState === 'main') {
    return (
      <NavigationContainer theme={navigationTheme}>
        <AppNavigator
          user={loggedInUser}
          onLogout={() => {
            setLoggedInUser(null);
            setAppState('login');
          }}
          onUpdateUser={(updatedUser) => setLoggedInUser(updatedUser)}
        />
      </NavigationContainer>
    );
  }

  return null;
};

export default function App() {
  return (
    <SQLiteProvider
      databaseName="smartReminderDB.db"
      onInit={initDB}
      suspense
    >
      <Suspense fallback={<SplashScreen />}>
        <ThemeProvider>
          <ScreenManager />
        </ThemeProvider>
      </Suspense>
    </SQLiteProvider>
  );
}