import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  StatusBar,
  Image,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Eye, EyeOff } from 'lucide-react-native';
import { useSQLiteContext } from 'expo-sqlite'; 
import { insertUser } from '../services/Database'; 
import { useTheme } from '../context/ThemeContext';
import CustomAlert from '../components/CustomAlert';

const { width, height } = Dimensions.get('window');

const SignUpScreen = ({ onSignUp, onBackToLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  
  const [passwordError, setPasswordError] = useState(''); 
  const [confirmPasswordError, setConfirmPasswordError] = useState(''); 

  const [isNameFocused, setIsNameFocused] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isConfirmPasswordFocused, setIsConfirmPasswordFocused] = useState(false);

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

  const validatePasswordStrength = (pwd) => {
    if (pwd.length < 8) return 'Password must be at least 8 characters.';
    if (!/[A-Z]/.test(pwd)) return 'Password must contain an uppercase letter.';
    if (!/[0-9]/.test(pwd)) return 'Password must contain a number.';
    if (!/[^a-zA-Z0-9]/.test(pwd)) return 'Password must contain a symbol.';
    return '';
  };

  const validateMatch = (pwd1, pwd2) => pwd1 !== pwd2 ? 'Passwords do not match.' : '';

  const handlePasswordChange = (text) => {
    setPassword(text);
    setPasswordError(text.length ? validatePasswordStrength(text) : '');
    setConfirmPasswordError(confirmPassword.length ? validateMatch(text, confirmPassword) : '');
  };

  const handleConfirmPasswordChange = (text) => {
    setConfirmPassword(text);
    setConfirmPasswordError(text.length ? validateMatch(password, text) : '');
  };

  const handleSignUp = async () => { 
    const strengthError = validatePasswordStrength(password);
    const matchError = validateMatch(password, confirmPassword);

    setPasswordError(strengthError);
    setConfirmPasswordError(matchError);
    
    if (!name || !email || !password || !confirmPassword) {
      showAlert('Error', 'Please fill in all fields.', 'error');
      return;
    }
    
    if (strengthError || matchError) {
      showAlert('Error', 'Please correct the highlighted errors.', 'error');
      return;
    }

    try {
      const newUser = await insertUser(db, name, email, password); 
      // Show success alert then trigger callback
      showAlert('Success', 'Account created successfully!', 'success', [{
          text: 'OK',
          onPress: () => { if (onSignUp) onSignUp(newUser); }
      }]);
    } catch (error) {
      if (error.message.includes('already registered')) {
        showAlert('Signup Failed', error.message, 'error');
      } else {
        console.error('Signup database error:', error); 
        showAlert('Signup Error', 'An error occurred during signup. Please try again.', 'error');
      }
    }
  };

  const isButtonDisabled = !!passwordError || !!confirmPasswordError || !name || !email || !password || !confirmPassword;
  const buttonColors = isButtonDisabled ? [colors.textSecondary, '#999999'] : [colors.accentOrange, colors.progressRed];
  
  const getInputContainerStyle = (isFocused, isError) => [
    styles.inputContainer,
    { backgroundColor: colors.inputBackground },
    isFocused && [styles.inputFocused, { borderColor: colors.border, backgroundColor: colors.background }],
    isError && [styles.inputError, { borderColor: colors.cancelRed }]
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <LinearGradient
        colors={[colors.accentOrange + '4D', colors.progressRed + '4D']}
        style={styles.diagonalWave}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <KeyboardAvoidingView
        style={styles.wrapper}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          <Animated.View style={{ transform: [{ scale: logoScale }], marginBottom: 36 }}>
            <Image 
              source={require('../assets/logo.gif')} 
              style={styles.logoImage} 
              resizeMode="cover" 
            />
          </Animated.View>

          <Text style={[styles.title, { color: colors.textPrimary }]}>CREATE ACCOUNT</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Join Smart Reminder today</Text>

          <View style={getInputContainerStyle(isNameFocused, false)}>
            <TextInput
              style={[styles.textInput, { color: colors.textPrimary }]}
              placeholder="Full Name"
              placeholderTextColor={colors.textSecondary}
              value={name}
              onChangeText={setName}
              onFocus={() => setIsNameFocused(true)}
              onBlur={() => setIsNameFocused(false)}
            />
          </View>
          <View style={styles.errorPlaceholder} />

          <View style={getInputContainerStyle(isEmailFocused, false)}>
            <TextInput
              style={[styles.textInput, { color: colors.textPrimary }]}
              placeholder="Email"
              placeholderTextColor={colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              onFocus={() => setIsEmailFocused(true)}
              onBlur={() => setIsEmailFocused(false)}
            />
          </View>
          <View style={styles.errorPlaceholder} />

          <View style={getInputContainerStyle(isPasswordFocused, !!passwordError)}>
            <TextInput
              style={[styles.passwordInput, { color: colors.textPrimary }]}
              placeholder="Password"
              placeholderTextColor={colors.textSecondary}
              value={password}
              onChangeText={handlePasswordChange}
              secureTextEntry={!isPasswordVisible}
              onFocus={() => setIsPasswordFocused(true)}
              onBlur={() => setIsPasswordFocused(false)}
            />
            <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)} style={styles.iconButton}>
              {isPasswordVisible 
                ? <EyeOff size={22} color={colors.textSecondary} /> 
                : <Eye size={22} color={colors.textSecondary} />
              }
            </TouchableOpacity>
          </View>
          {passwordError ? <Text style={[styles.errorText, { color: colors.cancelRed }]}>{passwordError}</Text> : <View style={styles.errorPlaceholder} />}

          <View style={getInputContainerStyle(isConfirmPasswordFocused, !!confirmPasswordError)}>
            <TextInput
              style={[styles.passwordInput, { color: colors.textPrimary }]}
              placeholder="Confirm Password"
              placeholderTextColor={colors.textSecondary}
              value={confirmPassword}
              onChangeText={handleConfirmPasswordChange}
              secureTextEntry={!isConfirmPasswordVisible}
              onFocus={() => setIsConfirmPasswordFocused(true)}
              onBlur={() => setIsConfirmPasswordFocused(false)}
            />
            <TouchableOpacity onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)} style={styles.iconButton}>
              {isConfirmPasswordVisible 
                ? <EyeOff size={22} color={colors.textSecondary} /> 
                : <Eye size={22} color={colors.textSecondary} />
              }
            </TouchableOpacity>
          </View>
          {confirmPasswordError ? <Text style={[styles.errorText, { color: colors.cancelRed }]}>{confirmPasswordError}</Text> : <View style={styles.errorPlaceholder} />}

          <TouchableOpacity 
            onPress={handleSignUp} 
            style={[styles.buttonWrapper, isButtonDisabled && styles.disabledButtonWrapper]}
            disabled={isButtonDisabled}
          >
            <LinearGradient
              colors={buttonColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.button}
            >
              <Text style={styles.buttonText}>Sign Up</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={[styles.loginText, { color: colors.textSecondary }]}>Already have an account? </Text>
            <TouchableOpacity onPress={onBackToLogin}>
              <Text style={[styles.loginLink, { color: colors.accentOrange }]}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>Developed by Mawii</Text>
        </View>
      </KeyboardAvoidingView>

      {/* Custom Alert */}
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
  diagonalWave: {
    position: 'absolute',
    width: width * 2,
    height: height * 0.4,
    bottom: -height * 0.1,
    left: -width * 0.5,
    borderRadius: width,
    transform: [{ rotate: '-10deg' }],
    opacity: 0.5,
  },
  wrapper: { flex: 1, justifyContent: 'space-between', alignItems: 'center', paddingVertical: 20 },
  content: { width: '85%', alignItems: 'center', marginTop: 20 },
  logoImage: { width: 140, height: 140, borderRadius: 70 },
  title: { fontSize: 30, fontWeight: '800', letterSpacing: 0.5, marginBottom: 4, textAlign: 'center' },
  subtitle: { fontSize: 16, marginBottom: 30, textAlign: 'center' },
  inputContainer: { width: '100%', flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, borderColor: 'transparent', paddingHorizontal: 8 },
  inputFocused: { },
  inputError: { },
  textInput: { flex: 1, paddingHorizontal: 18, paddingVertical: 14, fontSize: 16, height: 50 },
  passwordInput: { flex: 1, paddingHorizontal: 18, paddingVertical: 14, fontSize: 16, height: 50 },
  iconButton: { padding: 10, marginRight: 8 },
  errorText: { fontSize: 12, marginBottom: 2, alignSelf: 'flex-start', width: '100%', paddingHorizontal: 5, height: 18 },
  errorPlaceholder: { marginBottom: 2, height: 18 },
  buttonWrapper: { width: '100%', borderRadius: 14, overflow: 'hidden', marginBottom: 20, marginTop: 5 },
  disabledButtonWrapper: { opacity: 0.6 },
  button: { paddingVertical: 16, alignItems: 'center', borderRadius: 14 },
  buttonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  loginContainer: { flexDirection: 'row', alignItems: 'center' },
  loginText: { fontSize: 14 },
  loginLink: { fontSize: 14, fontWeight: '600' },
  footer: { paddingBottom: 10 },
  footerText: { fontSize: 12, textAlign: 'center' }
});

export default SignUpScreen;