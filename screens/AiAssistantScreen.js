import React, { useState } from 'react';
import { 
    View, Text, StyleSheet, TouchableOpacity, TextInput, 
    ActivityIndicator, KeyboardAvoidingView, Platform, Keyboard 
} from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { getUpcomingTasks } from '../services/Database';
import { getScheduleRecommendation } from '../services/AiServices';
import { Wand2, X, Sparkles, Calendar } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

const AiAssistantScreen = ({ navigation, route }) => {
    const { user } = route.params;
    const { colors } = useTheme();
    const db = useSQLiteContext();

    const [aiPrompt, setAiPrompt] = useState('');
    const [aiResult, setAiResult] = useState(null);
    const [isAiLoading, setIsAiLoading] = useState(false);

    const handleAiSubmit = async () => {
        Keyboard.dismiss();
        if (!aiPrompt.trim()) return;
        
        setIsAiLoading(true);
        try {
            const today = new Date().toISOString().split('T')[0]; 
            const allUpcomingTasks = await getUpcomingTasks(db, user.id, today);
            const contextTasks = allUpcomingTasks.slice(0, 50);
            const recommendation = await getScheduleRecommendation(contextTasks, aiPrompt);
            setAiResult(recommendation);
        } catch (error) {
            console.error("AI generation failed:", error);
            // Optionally handle error state here
        } finally {
            setIsAiLoading(false);
        }
    };

    const handleAddRecommendation = () => {
        navigation.replace('Add', { 
            user: user,
            prefilledData: aiResult 
        });
    };

    const handleClose = () => {
        navigation.goBack();
    };

    return (
        <View style={styles.modalOverlay}>
            <TouchableOpacity 
                style={styles.modalBackdrop} 
                activeOpacity={1} 
                onPress={handleClose} 
            />
            
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.aiKeyboardContainer}
                pointerEvents="box-none"
            >
                <View style={[styles.aiBottomSheet, { backgroundColor: colors.card }]}>
                    <View style={styles.dragHandleContainer}>
                        <View style={[styles.dragHandle, { backgroundColor: colors.border }]} />
                    </View>

                    {/* Header */}
                    <View style={styles.aiModalHeader}>
                        <View style={[styles.aiIconBadge, { backgroundColor: colors.accentOrange + '15' }]}>
                            <Wand2 size={24} color={colors.accentOrange} />
                        </View>
                        <View style={styles.aiTitleContainer}>
                            <Text style={[styles.aiModalTitle, { color: colors.textPrimary }]}>Smart Assistant</Text>
                            <Text style={[styles.aiModalSubtitle, { color: colors.textSecondary }]}>
                                {aiResult ? "Here is what I found" : "How can I help you schedule?"}
                            </Text>
                        </View>
                        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                            <X size={24} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    {/* Content Area */}
                    {!aiResult && (
                        <View style={styles.aiInputWrapper}>
                            <TextInput 
                                style={[styles.aiTextInput, { 
                                    backgroundColor: colors.inputBackground, 
                                    color: colors.textPrimary,
                                    borderColor: colors.border
                                }]}
                                placeholder="e.g., Schedule a dentist appointment for next Monday at 10 AM..."
                                placeholderTextColor={colors.textSecondary}
                                value={aiPrompt}
                                onChangeText={setAiPrompt}
                                multiline
                                textAlignVertical="top"
                                autoFocus={true}
                            />
                            <View style={styles.inputFooter}>
                                <Text style={[styles.inputHint, { color: colors.textSecondary }]}>
                                    Try mentioning dates, times, or durations.
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* Loading State */}
                    {isAiLoading && (
                        <View style={styles.aiLoadingContainer}>
                            <ActivityIndicator size="large" color={colors.accentOrange} />
                            <Text style={[styles.aiLoadingText, { color: colors.textSecondary }]}>Generating plan...</Text>
                        </View>
                    )}

                    {/* Result Card */}
                    {aiResult && !isAiLoading && (
                        <View style={styles.aiResultWrapper}>
                            <View style={[styles.recommendationCard, { backgroundColor: colors.background, borderColor: colors.accentOrange }]}>
                                <View style={styles.recommendationHeader}>
                                    <Text style={[styles.recommendationTitle, { color: colors.textPrimary }]}>{aiResult.title}</Text>
                                    <View style={[styles.timeBadge, { backgroundColor: colors.accentOrange }]}>
                                        <Text style={styles.timeBadgeText}>{aiResult.time}</Text>
                                    </View>
                                </View>
                                <View style={styles.recommendationMeta}>
                                    <Text style={[styles.recommendationDate, { color: colors.textSecondary }]}>
                                        <Calendar size={14} color={colors.textSecondary} /> {aiResult.date}
                                    </Text>
                                </View>
                                <View style={styles.divider} />
                                <Text style={[styles.recommendationReason, { color: colors.textSecondary }]}>
                                    "{aiResult.reason}"
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* Actions */}
                    <View style={styles.aiActions}>
                        {!aiResult && !isAiLoading && (
                            <TouchableOpacity 
                                onPress={handleAiSubmit}
                                activeOpacity={0.8}
                                style={styles.fullWidthButton}
                            >
                                <LinearGradient
                                    colors={[colors.accentOrange, colors.progressRed]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.gradientButton}
                                >
                                    <Sparkles size={20} color="#FFF" style={{ marginRight: 8 }} />
                                    <Text style={styles.gradientButtonText}>Generate Schedule</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        )}

                        {aiResult && (
                            <View style={styles.resultActions}>
                                <TouchableOpacity 
                                    style={[styles.actionButton, { borderColor: colors.border, borderWidth: 1 }]} 
                                    onPress={() => setAiResult(null)}
                                >
                                    <Text style={[styles.actionButtonText, { color: colors.textPrimary }]}>Try Again</Text>
                                </TouchableOpacity>
                                
                                <TouchableOpacity 
                                    style={[styles.actionButton, { backgroundColor: colors.accentOrange }]} 
                                    onPress={handleAddRecommendation}
                                >
                                    <Text style={[styles.actionButtonText, { color: '#FFF' }]}>Add to Planner</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
    },
    aiKeyboardContainer: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalBackdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    aiBottomSheet: {
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        padding: 25,
        paddingBottom: 40,
        minHeight: 350,
    },
    dragHandleContainer: {
        alignItems: 'center',
        marginBottom: 15,
    },
    dragHandle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        opacity: 0.5,
    },
    aiModalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    aiIconBadge: {
        padding: 10,
        borderRadius: 14,
        marginRight: 15,
    },
    aiTitleContainer: {
        flex: 1,
    },
    aiModalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    aiModalSubtitle: {
        fontSize: 14,
        marginTop: 2,
    },
    closeButton: {
        padding: 5,
    },
    aiInputWrapper: {
        marginBottom: 20,
    },
    aiTextInput: {
        borderRadius: 16,
        padding: 15,
        fontSize: 16,
        borderWidth: 1,
        minHeight: 100,
    },
    inputFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 8,
    },
    inputHint: {
        fontSize: 12,
    },
    aiLoadingContainer: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    aiLoadingText: {
        marginTop: 15,
        fontSize: 16,
        fontWeight: '500',
    },
    aiResultWrapper: {
        marginBottom: 25,
    },
    recommendationCard: {
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderLeftWidth: 6,
    },
    recommendationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    recommendationTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        flex: 1,
        marginRight: 10,
    },
    timeBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    timeBadgeText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    recommendationMeta: {
        marginBottom: 15,
    },
    recommendationDate: {
        fontSize: 14,
        fontWeight: '500',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(0,0,0,0.05)',
        marginBottom: 15,
    },
    recommendationReason: {
        fontSize: 14,
        fontStyle: 'italic',
        lineHeight: 20,
    },
    aiActions: {
        marginTop: 10,
    },
    fullWidthButton: {
        width: '100%',
        shadowColor: '#FF9500',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    gradientButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 16,
    },
    gradientButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    resultActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 15,
    },
    actionButton: {
        flex: 1,
        paddingVertical: 15,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default AiAssistantScreen;