import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, StatusBar, Image, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient'; 
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors'; // Direct import since Context might not be ready

const { width } = Dimensions.get('window');

// Use Light theme defaults for Splash to ensure visibility
const themeColors = Colors.light;

const SplashScreen = () => {
  // Animation Values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Background Decor (Subtle Gradient) */}
      <LinearGradient
        colors={[themeColors.background, '#FFF0E0']} // Subtle orange tint at bottom
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Decorative Circles (Consistent with Login) */}
      <View style={[styles.circleOne, { backgroundColor: themeColors.accentOrange + '10' }]} />
      <View style={[styles.circleTwo, { backgroundColor: themeColors.purpleAccent + '10' }]} />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.contentContainer}>
          
          {/* Logo Section */}
          <Animated.View style={[styles.logoWrapper, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
            <View style={[styles.logoShadow, { shadowColor: themeColors.accentOrange }]}>
                <Image 
                    source={require('../assets/logo.gif')} 
                    style={styles.logoImage}
                    resizeMode="cover" 
                />
            </View>
          </Animated.View>
          
          {/* Text Section */}
          <Animated.View style={[styles.textWrapper, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Text style={[styles.title, { color: themeColors.textPrimary }]}>SMART SCHEDULER</Text>
            <Text style={[styles.tagline, { color: themeColors.textSecondary }]}>
              Plan smarter, achieve more.
            </Text>
          </Animated.View>

        </View>
        
        {/* Footer / Loading */}
        <View style={styles.footer}>
            <Text style={[styles.loadingText, { color: themeColors.accentOrange }]}>Loading...</Text>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  // Background Shapes
  circleOne: {
    position: 'absolute',
    top: -width * 0.2,
    right: -width * 0.2,
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
  },
  circleTwo: {
    position: 'absolute',
    bottom: -width * 0.2,
    left: -width * 0.2,
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: width * 0.45,
  },
  
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  logoWrapper: {
    marginBottom: 30,
  },
  logoShadow: {
    width: 160, 
    height: 160, 
    borderRadius: 80, 
    // Shadow
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
    backgroundColor: '#fff',
    padding: 4, // Border effect
  },
  logoImage: { 
    width: '100%', 
    height: '100%', 
    borderRadius: 80,
  },
  textWrapper: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 16,
    fontWeight: '500',
    opacity: 0.8,
    textAlign: 'center',
  },
  footer: {
    paddingBottom: 40,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  }
});

export default SplashScreen;