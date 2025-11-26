import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useSQLiteContext } from 'expo-sqlite';
import { updateProfilePicture } from '../services/Database';
import { User, Edit, ChevronDown, LogOut, Moon, Sun } from 'lucide-react-native';
// 1. Import the hook
import { useTheme } from '../context/ThemeContext';

const ProfileScreen = ({ user, onLogout }) => {
    const db = useSQLiteContext();
    // 2. Consume colors and toggle function
    const { theme, toggleTheme, colors } = useTheme();
    
    const [isAlarmEnabled, setIsAlarmEnabled] = useState(true);
    const toggleAlarmSwitch = () => setIsAlarmEnabled(previousState => !previousState);
    const [profilePicture, setProfilePicture] = useState(user?.profile_picture);
    
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
                Alert.alert("Error", "Could not save profile picture.");
            }
        }
    };

    return (
        // 3. Replace static styles with dynamic 'colors' object
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
                        onValueChange={toggleTheme}
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
                            onValueChange={toggleAlarmSwitch}
                            value={isAlarmEnabled}
                        />
                    </View>
                </View>
            </View>

            <View style={styles.logoutWrapper}>
                <TouchableOpacity style={[styles.logoutButton, { backgroundColor: colors.progressRed }]} onPress={onLogout}>
                    <LogOut size={20} color={'white'} style={{ marginRight: 8 }} />
                    <Text style={styles.logoutButtonText}>Logout</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

// Update styles to remove hardcoded colors where dynamic ones are used inline
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
});

export default ProfileScreen;