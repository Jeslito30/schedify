import React from 'react';
import { StyleSheet, Platform, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Home, Calendar, User, XCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { useTheme } from '../context/ThemeContext';

// Screens
import HomeScreen from '../screens/HomeScreen';
import PlannerScreen from '../screens/PlannerScreen';
import MissedScreen from '../screens/MissedScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AddScreen from '../screens/AddScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Helper Component for Gradient Icons
const GradientIcon = ({ IconComponent, size = 24, colors }) => (
  <MaskedView
    maskElement={<IconComponent size={size} color="black" />}
  >
    <LinearGradient
      colors={[colors.accentOrange, colors.progressRed]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ width: size, height: size }}
    />
  </MaskedView>
);

const TabNavigator = ({ user, onLogout }) => {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: styles.tabBar(colors),
        tabBarLabelStyle: styles.tabLabel,
        tabBarActiveTintColor: colors.accentOrange,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarHideOnKeyboard: true, // Hide tab bar when keyboard opens
      }}
    >
      <Tab.Screen
        name="HomeTab"
        children={(props) => <HomeScreen {...props} user={user} />}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused, color }) => (
            focused 
              ? <GradientIcon IconComponent={Home} size={26} colors={colors} /> 
              : <Home size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="PlannerTab"
        children={(props) => <PlannerScreen {...props} user={user} />}
        options={{
          tabBarLabel: 'Planner',
          tabBarIcon: ({ focused, color }) => (
            focused 
              ? <GradientIcon IconComponent={Calendar} size={26} colors={colors} /> 
              : <Calendar size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="MissedTab"
        children={(props) => <MissedScreen {...props} user={user} />}
        options={{
          tabBarLabel: 'Missed',
          tabBarIcon: ({ focused, color }) => (
            focused 
              ? <GradientIcon IconComponent={XCircle} size={26} colors={colors} /> 
              : <XCircle size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        children={(props) => <ProfileScreen {...props} user={user} onLogout={onLogout} />}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused, color }) => (
            focused 
              ? <GradientIcon IconComponent={User} size={26} colors={colors} /> 
              : <User size={24} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const AppNavigator = ({ user, onLogout }) => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main">
        {() => <TabNavigator user={user} onLogout={onLogout} />}
      </Stack.Screen>
      <Stack.Screen 
        name="Add" 
        component={AddScreen}
        options={{ 
          presentation: 'modal',
          animationEnabled: true,
          gestureEnabled: true,
        }} 
      />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: (colors) => ({
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 25 : 20,
    left: 20,
    right: 20,
    elevation: 10, // Android Shadow
    backgroundColor: colors.card,
    borderRadius: 25,
    height: 70,
    borderTopWidth: 0,
    // iOS Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    paddingBottom: Platform.OS === 'ios' ? 0 : 10,
    paddingTop: 10,
  }),
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 5,
  }
});

export default AppNavigator;