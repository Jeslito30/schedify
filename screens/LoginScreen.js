import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  StatusBar, Image, KeyboardAvoidingView, Platform, Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSQLiteContext } from 'expo-sqlite';
import { getUser } from '../services/Database';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import CustomAlert from '../components/CustomAlert';

const LoginScreen = ({ onLoginSuccess, onSignUpPress }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const db = useSQLiteContext();
  const { colors } = useTheme();

  // --- Custom Alert State ---
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info',
    buttons: []
  });

  const showAlert = (title, message, type = 'info', buttons = []) => {
    setAlertConfig({ visible: true, title, message, type, buttons });
  };

  const closeAlert = () => {
    setAlertConfig(prev => ({ ...prev, visible: false }));
  };

  const logoScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.spring(logoScale, {
      toValue: 1,
      friction: 6,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleLogin = async () => {
    try {
      if (!email || !password) {
         showAlert('Login Failed', 'Please enter email and password.', 'error');
         return;
      }

      const users = await getUser(db, email, password);

      if (users.length > 0) {
        // Show success alert, then login on button press
        showAlert('Success', 'Login successful!', 'success', [{
            text: 'OK', 
            onPress: () => onLoginSuccess(users[0]) 
        }]);
      } else {
        showAlert('Login Failed', 'Invalid email or password.', 'error');
      }
    } catch (err) {
      console.error('Login database error:', err);
      showAlert('Error', 'An unexpected error occurred while logging in.', 'error');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <KeyboardAvoidingView
        style={styles.wrapper}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          <Animated.View style={{ transform: [{ scale: logoScale }], marginBottom: 32 }}>
            <Image
              source={require('../assets/logo.gif')}
              style={styles.logoImage}
              resizeMode="cover"
            />
          </Animated.View>

          <Text style={[styles.title, { color: colors.textPrimary }]}>SMART REMINDER</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Your daily productivity companion</Text>

          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.textPrimary }]}
            placeholder="Email"
            placeholderTextColor={colors.textSecondary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {/* Password Input with Toggle */}
          <View style={[styles.passwordInputContainer, { backgroundColor: colors.inputBackground }]}>
            <TextInput
              style={[styles.inputPassword, { color: colors.textPrimary }]} 
              placeholder="Password"
              placeholderTextColor={colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword} 
            />
            <TouchableOpacity
              style={styles.passwordToggle}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={24}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={handleLogin} style={styles.buttonWrapper}>
            <LinearGradient
              colors={[colors.accentOrange, colors.progressRed]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.button}
            >
              <Text style={styles.buttonText}>Login</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.signupContainer}>
            <Text style={[styles.signupText, { color: colors.textSecondary }]}>Don't have an account? </Text>
            <TouchableOpacity onPress={onSignUpPress}>
              <Text style={[styles.signupLink, { color: colors.accentOrange }]}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>Developed by Mawii</Text>
        </View>
      </KeyboardAvoidingView>

      {/* Custom Alert Component */}
      <CustomAlert 
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        buttons={alertConfig.buttons}
        onClose={closeAlert}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  wrapper: { flex: 1, justifyContent: 'space-between', alignItems: 'center', paddingVertical: 20 },
  content: { width: '85%', alignItems: 'center', marginTop: 20 },
  logoImage: { width: 140, height: 140, borderRadius: 70 },
  title: { fontSize: 32, fontWeight: '700', letterSpacing: 1, marginBottom: 6, textAlign: 'center' },
  subtitle: { fontSize: 16, marginBottom: 32, textAlign: 'center' },
  input: { width: '100%', borderRadius: 14, paddingHorizontal: 18, paddingVertical: 16, fontSize: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4, elevation: 2 },
  passwordInputContainer: { flexDirection: 'row', alignItems: 'center', width: '100%', borderRadius: 14, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4, elevation: 2 },
  inputPassword: { flex: 1, paddingHorizontal: 18, paddingVertical: 16, fontSize: 16 },
  passwordToggle: { paddingRight: 18, paddingLeft: 10, paddingVertical: 16 },
  buttonWrapper: { width: '100%', borderRadius: 14, overflow: 'hidden', marginBottom: 20 },
  button: { paddingVertical: 16, alignItems: 'center', borderRadius: 14 },
  buttonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  signupContainer: { flexDirection: 'row', alignItems: 'center' },
  signupText: { fontSize: 14 },
  signupLink: { fontSize: 14, fontWeight: '600' },
  footer: { paddingBottom: 10 },
  footerText: { fontSize: 12, textAlign: 'center' }
});

export default LoginScreen;