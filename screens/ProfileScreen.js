import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Image, Alert, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useSQLiteContext } from 'expo-sqlite';
import { updateProfilePicture } from '../services/Database';
import { User, Edit, ChevronDown, LogOut, Moon, Sun } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
// 1. Import CustomAlert
import CustomAlert from '../components/CustomAlert';

const ProfileScreen = ({ user, onLogout }) => {
    const db = useSQLiteContext();
    const { theme, toggleTheme, colors, isNotificationsEnabled, toggleNotifications } = useTheme(); // Use global state
    
    const [profilePicture, setProfilePicture] = useState(user?.profile_picture);
    
    // --- Custom Alert State (For Logout) ---
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

    // --- Toast Notification State (For Switches) ---
    const [toastMessage, setToastMessage] = useState(null);
    const [fadeAnim] = useState(new Animated.Value(0)); // For fade animation

    const showToast = (message) => {
        setToastMessage(message);
        // Fade In
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }).start();

        // Wait and Fade Out
        setTimeout(() => {
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start(() => setToastMessage(null));
        }, 2000);
    };

    const handleThemeSwitch = () => {
        toggleTheme();
        const newMode = theme === 'light' ? 'Dark Mode' : 'Light Mode';
        showToast(`${newMode} Enabled`);
    };

    const handleNotificationSwitch = (value) => {
        toggleNotifications(); // Use global toggle
        showToast(`Notifications turned ${value ? 'On' : 'Off'}`);
    };

    const handleLogoutPress = () => {
        showAlert(
            'Logout',
            'Are you sure you want to log out?',
            'info', // Using info icon, or could use 'error' for red alert
            [
                { text: 'Cancel', style: 'cancel', onPress: closeAlert },
                { 
                    text: 'Logout', 
                    onPress: () => {
                        closeAlert();
                        onLogout();
                    } 
                }
            ]
        );
    };
    
    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });
    
        if (!result.canceled) {
            const newUri = result.assets[0].uri;
            setProfilePicture(newUri);
            try {
                await updateProfilePicture(db, user.id, newUri);
            } catch (error) {
                console.error("Failed to update profile picture in DB:", error);
                // Use Custom Alert for error
                showAlert('Error', 'Could not save profile picture.', 'error');
            }
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
            <View style={styles.header}>
                <Text style={[styles.titleText, { color: colors.textPrimary }]}>Profile</Text>
            </View>

            <View style={[styles.profileCard, { backgroundColor: colors.card, shadowColor: colors.textPrimary, }]}>
                <TouchableOpacity onPress={pickImage}>
                    <View style={[styles.avatarContainer, { backgroundColor: colors.background }]}>
                        {profilePicture ? (
                            <Image source={{ uri: profilePicture }} style={styles.avatar} />
                        ) : (
                            <User size={50} color={colors.textPrimary} />
                        )}
                    </View>
                </TouchableOpacity>

                <Text style={[styles.userNameText, { color: colors.textPrimary }]}>{user.name}</Text>
            </View>

            {/* --- Dark Mode Switch --- */}
            <View style={[styles.settingInputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.settingRow}>
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                        {theme === 'dark' ? <Moon size={20} color={colors.textPrimary} style={{marginRight: 10}}/> : <Sun size={20} color={colors.textPrimary} style={{marginRight: 10}}/>}
                        <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Dark Mode</Text>
                    </View>
                    <Switch
                        trackColor={{ false: colors.textSecondary, true: colors.accentOrange }}
                        thumbColor={colors.card}
                        onValueChange={handleThemeSwitch}
                        value={theme === 'dark'}
                    />
                </View>
            </View>

            <View style={styles.settingsSection}>
                {/* Notification Switch */}
                <View style={[styles.settingInputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.settingRow}>
                        <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Notifications</Text>
                        <Switch
                            trackColor={{ false: colors.textSecondary, true: colors.accentOrange }}
                            thumbColor={colors.card}
                            onValueChange={handleNotificationSwitch}
                            value={isNotificationsEnabled} // Use global state
                        />
                    </View>
                </View>
            </View>

            {/* --- Inline Toast Message --- */}
            {toastMessage && (
                <Animated.View style={[
                    styles.toastContainer, 
                    { opacity: fadeAnim, backgroundColor: colors.card, borderColor: colors.accentOrange }
                ]}>
                    <Text style={[styles.toastText, { color: colors.accentOrange }]}>{toastMessage}</Text>
                </Animated.View>
            )}

            <View style={styles.logoutWrapper}>
                <TouchableOpacity style={[styles.logoutButton, { backgroundColor: colors.progressRed }]} onPress={handleLogoutPress}>
                    <LogOut size={20} color={'white'} style={{ marginRight: 8 }} />
                    <Text style={styles.logoutButtonText}>Logout</Text>
                </TouchableOpacity>
            </View>

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
    container: { flex: 1, paddingHorizontal: 15 },
    header: { flexDirection: 'row', justifyContent: 'center', paddingTop: 10, marginBottom: 20 },
    titleText: { fontSize: 28, fontWeight: 'bold' },
    profileCard: { 
        borderRadius: 20, 
        padding: 20, 
        alignItems: 'center', 
        marginBottom: 30, 
        position: 'relative',
        // Shadow props for iOS
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        // Elevation for Android
        elevation: 5,
    },
    avatarContainer: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    avatar: { width: 80, height: 80, borderRadius: 40 },
    userNameText: { fontSize: 22, fontWeight: 'bold', marginTop: 5 },
    settingsSection: { flex: 1 },
    settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
    settingLabel: { fontSize: 16 },
    settingInputContainer: { borderRadius: 8, padding: 15, marginBottom: 15, borderWidth: 1 },
    logoutButton: { borderRadius: 10, padding: 15, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
    logoutButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    // Toast Styles
    toastContainer: {
        marginBottom: 15,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        borderWidth: 1,
    },
    toastText: {
        fontSize: 14,
        fontWeight: '600',
    }
});

export default ProfileScreen;