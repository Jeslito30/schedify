import React, { useState, useEffect, Suspense } from 'react';
import SplashScreen from './screens/SplashScreen';
import LoginScreen from './screens/LoginScreen';
import SignUpScreen from './screens/SignUpScreen';
import { initDB } from './services/Database';
import { SQLiteProvider } from 'expo-sqlite';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import AppNavigator from './components/AppNavigator';
import { ThemeProvider, useTheme } from './context/ThemeContext'; // Import ThemeProvider
import { registerForPushNotificationsAsync } from './services/NotificationService'; // Import Notification Service

const ScreenManager = () => {
  const [appState, setAppState] = useState('login');
  const [loggedInUser, setLoggedInUser] = useState(null);
  const { theme } = useTheme(); // Access theme string ('light' or 'dark')

  // Initialize Notifications on app start
  useEffect(() => {
    registerForPushNotificationsAsync();
  }, []);

  // Create Navigation Themes based on your context
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
        {/* Wrap everything in ThemeProvider */}
        <ThemeProvider>
          <ScreenManager />
        </ThemeProvider>
      </Suspense>
    </SQLiteProvider>
  );
}