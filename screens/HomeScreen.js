import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Modal, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TaskCard } from '../components/TaskCard';
import { useSQLiteContext } from 'expo-sqlite';
import { getAllTasks, getTasksByDate, getUpcomingTasks, getCompletedTasks, updateTaskStatus } from '../services/Database';
import { useIsFocused } from '@react-navigation/native';
// Importing specific Lucide icons
import { getScheduleRecommendation } from '../services/AiServices';
import { Bell, Sparkles, Mic, X, MessageSquare } from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import EditScreen from './EditScreen';

// --- Constants ---
const LightColors = {
  background: '#F2F2F7',
  card: '#FFFFFF',
  textPrimary: '#1F1F1F',
  textSecondary: '#6B7280',
  accentOrange: '#FF9500',
  progressRed: '#FF4500',
  tabInactive: '#E5E5E5',
  inputBackground: '#F0F0F0',
};

// --- Utility Function to get Current Date in YYYY-MM-DD format ---
const getCurrentDate = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const pad = (num) => (num < 10 ? '0' + num : num);
  return `${year}-${pad(month)}-${pad(day)}`;
};

// --- Utility Function to get formatted date (e.g., October 26, 2023) ---
const getFormattedDate = () => {
  const date = new Date();
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
};

// --- Utility Function to get Current Day Name (e.g., Wednesday) ---
const getDayName = () => {
  const date = new Date();
  const options = { weekday: 'long' };
  return date.toLocaleDateString('en-US', options);
};

// --- Utility Function to convert 12-hour time to 24-hour time ---
const convertTo24HourFormat = (time12h) => {
  const [time, modifier] = time12h.split(' ');
  let [hours, minutes] = time.split(':');

  if (hours === '12') {
    hours = '00';
  }

  if (modifier === 'PM') {
    hours = parseInt(hours, 10) + 12;
  }
  return `${hours}:${minutes}`;
};

const HomeScreen = ({ user, navigation }) => {
  const userName = user.name;
  const initial = userName.split(' ').map(n => n[0]).join('');
  const db = useSQLiteContext();
  const isFocused = useIsFocused();
  const profilePicture = user?.profile_picture;


  const [activeTab, setActiveTab] = useState('Upcoming');
  const [activeFilter, setActiveFilter] = useState('All'); // 'All', 'Task', 'Schedule'
  const [tasks, setTasks] = useState([]);
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [allTasks, setAllTasks] = useState([]);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  // --- AI Modal States ---
  const [isAiModalVisible, setAiModalVisible] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResult, setAiResult] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const fetchTasks = useCallback(async () => {
    if (user?.id) {
      try {
        const today = getCurrentDate();
        let fetchedTasks;
        
        // Base query parts
        let typeFilterClause = "";
        if (activeFilter === 'Task') {
          typeFilterClause = " AND type = 'Task'";
        } else if (activeFilter === 'Schedule') {
          typeFilterClause = " AND type != 'Task'";
        }

        switch (activeTab) {
          case 'All':
            fetchedTasks = await db.getAllAsync(`SELECT * FROM tasks WHERE userId = ?${typeFilterClause}`, [user.id]);
            break;
          case 'Today':
            fetchedTasks = await db.getAllAsync(`SELECT * FROM tasks WHERE userId = ? AND date = ?${typeFilterClause}`, [user.id, today]);
            break;
          case 'Upcoming':
            fetchedTasks = await db.getAllAsync(`SELECT * FROM tasks WHERE userId = ? AND date > ? AND status != 'done'${typeFilterClause}`, [user.id, today]);
            break;
          case 'Completed':
            fetchedTasks = await db.getAllAsync(`SELECT * FROM tasks WHERE userId = ? AND status = 'done'${typeFilterClause}`, [user.id]);
            break;
          default:
            fetchedTasks = [];
        }
        setTasks(fetchedTasks);
        if(activeTab === 'All') {
          setAllTasks(fetchedTasks);
        } else {
          const all = await getAllTasks(db, user.id);
          setAllTasks(all);
        }
      } catch (error) {
        console.error("Failed to fetch tasks:", error);
      }
    }
  }, [db, user?.id, activeTab, activeFilter]);

  useEffect(() => {
    if (isFocused) {
      fetchTasks();
    }
  }, [isFocused, fetchTasks]);

  const handleDone = async (taskId) => {
    try {
      await updateTaskStatus(db, taskId, 'done');
      fetchTasks();
    } catch (error) {
      console.error("Failed to update task status:", error);
    }
  };

  const handleEdit = (task) => {
    setSelectedTask(task);
    setIsEditModalVisible(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalVisible(false);
    setSelectedTask(null);
    fetchTasks();
  };

  const dayName = getDayName();
  const formattedDate = getFormattedDate();

  const handleNotificationPress = () => {
    console.log('Notification button pressed!');
  }

  // --- AI Logic ---
  const handleAiButtonPress = () => {
    setAiModalVisible(true);
    setAiPrompt('');
    setAiResult(null);
  };

  const handleAiVoicePress = () => {
    Alert.alert("Voice Input", "Voice input feature is coming soon!");
  };

  // --- INTEGRATED AI SUBMIT FUNCTION ---
  const handleAiSubmit = async () => {
    if (!aiPrompt.trim()) return;
    
    setIsAiLoading(true);
    
    try {
      // 1. Fetch upcoming tasks to provide context (Optimized: Limit to 50)
      const today = new Date().toISOString().split('T')[0]; 
      const allUpcomingTasks = await getUpcomingTasks(db, user.id, today);
      const contextTasks = allUpcomingTasks.slice(0, 50);
      
      // 2. Call the real AI Service
      const recommendation = await getScheduleRecommendation(contextTasks, aiPrompt);

      setAiResult(recommendation);
      
    } catch (error) {
      console.error("AI generation failed:", error);
      Alert.alert("AI Error", "Could not generate a schedule. Please check your connection.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAddRecommendation = () => {
    setAiModalVisible(false);
    navigation.navigate('Add', { 
        user: user,
        prefilledData: aiResult 
    });
  };

  const toggleFilterVisibility = () => {
    setIsFilterVisible(!isFilterVisible);
  };

  const completedTasksCount = allTasks.filter(task => task.status === 'done').length;
  const donePercentage = allTasks.length > 0 ? Math.round((completedTasksCount / allTasks.length) * 100) : 0;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.userInfo}>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <View style={styles.avatarContainer}>
              {profilePicture ? (
                <Image source={{ uri: profilePicture }} style={styles.avatar} />
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initial}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
            <View>
              <Text style={styles.greetingText}>Hey,</Text>
              <Text style={styles.userNameText}>{userName}</Text>
            </View>
          </View>
          
          <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.headerButton} onPress={handleNotificationPress}>
                  <Bell size={24} color={LightColors.card} />
              </TouchableOpacity>
          </View>
        </View>

        {/* Today's Report Card */}
        <View style={styles.reportCard}>
          <View style={styles.reportHeader}>
            <Text style={styles.reportTitle}>Today's Report</Text>
          </View>
          <View style={styles.reportBody}>
            <View>
              <Text style={styles.reportDateLarge}>{dayName}</Text>
              <Text style={styles.reportDateSmall}>{formattedDate}</Text>
            </View>
            <View style={styles.statsContainer}>
                <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Tasks</Text>
                    <Text style={styles.statValue}>{allTasks.length}</Text>
                </View>
                <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Done</Text>
                    <Text style={[styles.statValue, { color: LightColors.accentOrange }]}>{donePercentage}%</Text>
                </View>
            </View>
          </View>
          <View style={styles.reportFooter}>
              <Text style={styles.quote}>
                "Focus on being productive instead of busy."
                <Text style={styles.quoteAuthor}> - Tim Ferriss</Text>
              </Text>
          </View>
        </View>

        {/* List Header with Filter Toggle */}
        <View style={styles.listHeaderContainer}>
          <Text style={styles.listHeaderTitle}>
            {activeFilter === 'Schedule'
              ? 'My Schedules'
              : activeFilter === 'All'
              ? 'Tasks and Schedules'
              : 'My Tasks'}
          </Text>
          <TouchableOpacity onPress={toggleFilterVisibility} style={styles.filterIcon}>
            <Ionicons name="options-outline" size={24} color={isFilterVisible ? LightColors.accentOrange : LightColors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Toggleable Filter Tabs for Task/Schedule */}
        {isFilterVisible && (
          <View style={styles.filterTabsContainer}>
            {['All', 'Task', 'Schedule'].map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[styles.filterTabButton, activeFilter === filter && styles.filterTabActive]}
                onPress={() => setActiveFilter(filter)}
              >
                <Text style={[styles.filterTabText, activeFilter === filter && styles.filterTabTextActive]}>{filter}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Navigation Tabs */}
        <View style={styles.tabsContainer}>
          {['All', 'Today', 'Upcoming', 'Completed'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabButton, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Task List */}
        <FlatList
          data={tasks}
          renderItem={({ item }) => {
            const time24 = convertTo24HourFormat(item.time);
            const deadline = `${item.date}T${time24}:00`;
            return <TaskCard {...item} deadline={deadline} onDone={handleDone} onEdit={handleEdit} />;
          }}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.taskList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={styles.emptyTasks}>
              <Text style={styles.emptyText}>No tasks to display.</Text>
            </View>
          )}
        />
      </View>

      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        onRequestClose={handleCloseEditModal}
      >
        {selectedTask && (
          <EditScreen
            task={selectedTask}
            onClose={handleCloseEditModal}
          />
        )}
      </Modal>

      {/* --- AI Modal --- */}
      <Modal
        visible={isAiModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setAiModalVisible(false)}
      >
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalOverlay}
        >
            <View style={styles.aiModalContainer}>
                <View style={styles.aiModalHeader}>
                    <View style={styles.aiTitleRow}>
                        <Sparkles size={24} color={LightColors.accentOrange} style={{marginRight: 8}}/>
                        <Text style={styles.aiModalTitle}>Smart AI Assistant</Text>
                    </View>
                    <TouchableOpacity onPress={() => setAiModalVisible(false)}>
                        <X size={24} color={LightColors.textSecondary} />
                    </TouchableOpacity>
                </View>

                <Text style={styles.aiInstruction}>What do you want to do?</Text>

                <View style={styles.aiInputContainer}>
                    <TextInput 
                        style={styles.aiTextInput}
                        placeholder="e.g., I need to study for Math exam..."
                        placeholderTextColor={LightColors.textSecondary}
                        value={aiPrompt}
                        onChangeText={setAiPrompt}
                        multiline
                    />
                    <TouchableOpacity style={styles.micButton} onPress={handleAiVoicePress}>
                        <Mic size={20} color={LightColors.textSecondary} />
                    </TouchableOpacity>
                </View>

                {isAiLoading ? (
                    <View style={styles.aiLoadingContainer}>
                        <ActivityIndicator size="large" color={LightColors.accentOrange} />
                        <Text style={styles.aiLoadingText}>Analyzing your schedule...</Text>
                    </View>
                ) : aiResult ? (
                    <View style={styles.aiResultContainer}>
                        <Text style={styles.aiResultLabel}>AI Recommendation:</Text>
                        <View style={styles.recommendationCard}>
                            <Text style={styles.recommendationTitle}>{aiResult.title}</Text>
                            <Text style={styles.recommendationDetail}>{aiResult.date} at {aiResult.time}</Text>
                            <Text style={styles.recommendationReason}>{aiResult.reason}</Text>
                        </View>
                        <TouchableOpacity style={styles.addToScheduleButton} onPress={handleAddRecommendation}>
                            <Text style={styles.addToScheduleText}>Add to Schedule</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity style={styles.askAiButton} onPress={handleAiSubmit}>
                        <Text style={styles.askAiButtonText}>Ask AI</Text>
                    </TouchableOpacity>
                )}
            </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* AI Floating Action Button */}
      <TouchableOpacity style={styles.aiButton} onPress={handleAiButtonPress}>
        <Sparkles size={30} color={LightColors.card} />
      </TouchableOpacity>

    </SafeAreaView>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LightColors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: LightColors.accentOrange,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarContainer: {
    marginRight: 10,
  },
  avatarText: {
    color: LightColors.card,
    fontWeight: 'bold',
    fontSize: 16,
  },
  greetingText: {
    color: LightColors.textSecondary,
    fontSize: 14,
    lineHeight: 16,
  },
  userNameText: {
    color: LightColors.textPrimary,
    fontWeight: 'bold',
    fontSize: 18,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: LightColors.accentOrange,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: LightColors.accentOrange,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 5,
  },

  reportCard: {
    backgroundColor: LightColors.card,
    borderRadius: 15,
    padding: 18,
    marginTop: 20,
    marginBottom: 20,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 5,
  },
  reportTitle: {
    color: LightColors.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  reportBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  reportDateSmall: {
    color: LightColors.textSecondary,
    fontSize: 16,
  },
  reportDateLarge: {
    color: LightColors.textPrimary,
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statsContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 120,
    marginBottom: 4,
  },
  statLabel: {
    color: LightColors.textSecondary,
    fontSize: 16,
  },
  statValue: {
    color: LightColors.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  reportFooter: {},
  quote: {
    color: LightColors.textSecondary,
    fontSize: 14,
    marginTop: 15,
    lineHeight: 18,
  },
  quoteAuthor: {
      fontSize: 14,
  },

  listHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  listHeaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: LightColors.textPrimary,
  },
  filterIcon: {
    padding: 5,
  },

  filterTabsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    backgroundColor: LightColors.background,
    paddingBottom: 5,
    borderBottomWidth: 2,
    borderBottomColor: LightColors.tabInactive,
  },
  filterTabButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 10,
  },
  filterTabActive: {
    borderBottomWidth: 3,
    borderBottomColor: LightColors.accentOrange,
  },
  filterTabText: {
    color: LightColors.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: LightColors.textPrimary,
    fontWeight: 'bold',
  },


  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: LightColors.background,
    marginBottom: 10,
    paddingVertical: 5,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
  tabActive: {
      borderBottomWidth: 2,
      borderBottomColor: LightColors.accentOrange,
  },
  tabText: {
    color: LightColors.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
  tabTextActive: {
      color: LightColors.textPrimary,
      fontWeight: 'bold',
  },
  taskList: {

  },
  emptyTasks: {
    paddingVertical: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: LightColors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },
  aiButton: {
    position: 'absolute',
    right: 25,
    bottom: 25,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: LightColors.accentOrange,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: LightColors.accentOrange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  // --- AI Modal Styles ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  aiModalContainer: {
    width: '100%',
    backgroundColor: LightColors.card,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  aiModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  aiTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: LightColors.textPrimary,
  },
  aiInstruction: {
    fontSize: 16,
    color: LightColors.textSecondary,
    marginBottom: 15,
  },
  aiInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LightColors.inputBackground,
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  aiTextInput: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
    color: LightColors.textPrimary,
    minHeight: 50,
  },
  micButton: {
    padding: 10,
  },
  askAiButton: {
    backgroundColor: LightColors.accentOrange,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  askAiButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  aiLoadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  aiLoadingText: {
    marginTop: 10,
    color: LightColors.textSecondary,
    fontSize: 16,
  },
  aiResultContainer: {
    marginTop: 10,
  },
  aiResultLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: LightColors.textPrimary,
    marginBottom: 10,
  },
  recommendationCard: {
    backgroundColor: '#FFF8E1', // Light yellow/orange tint
    padding: 15,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: LightColors.accentOrange,
    marginBottom: 20,
  },
  recommendationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: LightColors.textPrimary,
    marginBottom: 5,
  },
  recommendationDetail: {
    fontSize: 16,
    color: LightColors.accentOrange,
    fontWeight: '600',
    marginBottom: 5,
  },
  recommendationReason: {
    fontSize: 14,
    color: LightColors.textSecondary,
    fontStyle: 'italic',
  },
  addToScheduleButton: {
    backgroundColor: LightColors.greenAccent || '#4CAF50', // Using green for add action
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  addToScheduleText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default HomeScreen;