import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
// Ensure lucide-react-native is installed, or replace these with Ionicons if needed
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react-native';

const CustomAlert = ({ visible, title, message, type = 'info', buttons, onClose }) => {
    // Hook to access the current theme colors
    const { colors } = useTheme();

    if (!visible) return null;

    // Helper to select the icon based on alert type
    const getIcon = () => {
        switch (type) {
            case 'success': return <CheckCircle size={48} color={colors.greenAccent} />;
            case 'error': return <AlertCircle size={48} color={colors.cancelRed} />;
            default: return <Info size={48} color={colors.accentOrange} />;
        }
    };

    return (
        <Modal
            transparent={true}
            visible={visible}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={[
                    styles.alertContainer, 
                    { 
                        backgroundColor: colors.card, 
                        borderColor: colors.border,
                        shadowColor: colors.textPrimary 
                    }
                ]}>
                    <View style={styles.iconContainer}>
                        {getIcon()}
                    </View>
                    <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
                    <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
                    
                    <View style={styles.buttonContainer}>
                        {buttons && buttons.length > 0 ? (
                            buttons.map((btn, index) => (
                                <TouchableOpacity 
                                    key={index} 
                                    style={[
                                        styles.button, 
                                        { backgroundColor: btn.style === 'cancel' ? colors.cancelRed : colors.accentOrange }
                                    ]}
                                    onPress={() => {
                                        if (btn.onPress) {
                                            btn.onPress();
                                        } else {
                                            onClose();
                                        }
                                    }}
                                >
                                    <Text style={[styles.buttonText, { color: '#fff' }]}>{btn.text}</Text>
                                </TouchableOpacity>
                            ))
                        ) : (
                            // Default OK button if no buttons provided
                            <TouchableOpacity 
                                style={[styles.button, { backgroundColor: colors.accentOrange }]}
                                onPress={onClose}
                            >
                                <Text style={[styles.buttonText, { color: '#fff' }]}>OK</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    alertContainer: {
        width: '80%',
        borderRadius: 20,
        padding: 25,
        alignItems: 'center',
        elevation: 10,
        // iOS Shadow
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        borderWidth: 1,
    },
    iconContainer: {
        marginBottom: 15,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        marginBottom: 25,
        textAlign: 'center',
        lineHeight: 22,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        width: '100%',
        gap: 15, // Flex gap
        flexWrap: 'wrap'
    },
    button: {
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 25,
        minWidth: 100,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: 'bold',
    }
});

export default CustomAlert;