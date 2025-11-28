import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSQLiteContext } from 'expo-sqlite';
import DateTimePicker from '@react-native-community/datetimepicker';
import { addTask } from '../services/Database';
import { scheduleTaskNotification } from '../services/NotificationService';
import { ChevronLeft, Check, Calendar, Clock, Briefcase, BookOpen, Repeat, Users, CheckSquare, MapPin, Bell } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
// 1. Import CustomAlert
import CustomAlert from '../components/CustomAlert';

// Category definitions (kept same as before)
const scheduleCategories = [
    { name: 'Class', icon: BookOpen, color: '#FF9500' }, 
    { name: 'Routine', icon: Repeat, color: '#00BFFF' }, 
    { name: 'Meeting', icon: Users, color: '#4CAF50' }, 
    { name: 'Work', icon: Briefcase, color: '#5F50A9' }, 
];

const taskCategories = [
    { name: 'Task', icon: CheckSquare, color: '#FFC72C' }, 
];

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const AddScreen = ({ navigation, route, user: userProp }) => {
    const { colors } = useTheme();
    const db = useSQLiteContext();
    const user = route.params?.user || userProp;
    const prefilledData = route.params?.prefilledData;

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

    // State for form fields
    const [activeType, setActiveType] = useState('Task'); 
    const [taskTitle, setTaskTitle] = useState(prefilledData?.title || '');
    const [selectedCategory, setSelectedCategory] = useState(taskCategories[0].name);
    const [description, setDescription] = useState(prefilledData?.description || '');
    const [repeatFrequency, setRepeatFrequency] = useState('none');
    const [repeatDays, setRepeatDays] = useState([]);
    const [reminderMinutes, setReminderMinutes] = useState(5);
    
    const parseDateString = (dateStr) => {
        if (!dateStr) return new Date();
        const [y, m, d] = dateStr.split('-').map(Number);
        return new Date(y, m - 1, d);
    };

    const parseTimeString = (timeStr) => {
        if (!timeStr) return new Date();
        const d = new Date();
        const [time, modifier] = timeStr.split(' ');
        let [hours, minutes] = time.split(':');
        if (hours === '12') hours = '00';
        if (modifier === 'PM') hours = parseInt(hours, 10) + 12;
        d.setHours(hours, minutes, 0, 0);
        return d;
    };

    const [date, setDate] = useState(prefilledData?.date ? parseDateString(prefilledData.date) : new Date()); 
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [time, setTime] = useState(prefilledData?.time ? parseTimeString(prefilledData.time) : new Date());
    
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);

    const formatTime = (date) => {
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const formattedHours = hours % 12 === 0 ? 12 : hours % 12;
        const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
        return `${formattedHours}:${formattedMinutes} ${ampm}`;
    };

    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const [dueDate, setDueDate] = useState(prefilledData?.date || formatDate(new Date()));
    const [startDateString, setStartDateString] = useState(formatDate(new Date()));
    const [endDateString, setEndDateString] = useState(formatDate(new Date()));
    const [dueTime, setDueTime] = useState(prefilledData?.time || formatTime(new Date()));
    const [location, setLocation] = useState('');

    const handleTypeChange = (type) => {
        setActiveType(type);
        if (type === 'Task') {
            setSelectedCategory(taskCategories[0].name);
        } else {
            setSelectedCategory(scheduleCategories[0].name);
        }
        setRepeatDays([]); 
    };

    const CategoryButton = ({ item }) => {
        const isActive = selectedCategory === item.name;
        return (
            <TouchableOpacity 
                style={[
                    styles.categoryButton,
                    isActive && { backgroundColor: item.color, borderWidth: 0 }
                ]}
                onPress={() => setSelectedCategory(item.name)}
            >
                <item.icon size={24} color={isActive ? colors.card : item.color} />
                <Text style={[styles.categoryText, { color: isActive ? colors.card : colors.textPrimary }]}>{item.name}</Text>
            </TouchableOpacity>
        );
    };

    const handleDateChange = (event, selectedDate) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            setDate(selectedDate);
            setDueDate(formatDate(selectedDate));
        }
    };

    const handleStartDateChange = (event, selectedDate) => {
        setShowStartDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            setStartDate(selectedDate);
            setStartDateString(formatDate(selectedDate));
        }
    };

    const handleEndDateChange = (event, selectedDate) => {
        setShowEndDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            setEndDate(selectedDate);
            setEndDateString(formatDate(selectedDate));
        }
    };

    const handleTimeChange = (event, selectedTime) => {
        setShowTimePicker(Platform.OS === 'ios');
        if (selectedTime) {
            setTime(selectedTime);
            setDueTime(formatTime(selectedTime));
        }
    };

    const handleOpenMap = () => {
        showAlert("Open Map", "This will open a map to select a location.", "info");
    };

    const handleRepeatDayToggle = (day) => {
        setRepeatDays(prevDays => {
            if (prevDays.includes(day)) {
                return prevDays.filter(d => d !== day);
            } else {
                return [...prevDays, day];
            }
        });
    };

    const handleEverydayToggle = () => {
        if (repeatDays.length === weekDays.length) {
            setRepeatDays([]); 
        } else {
            setRepeatDays(weekDays);
        }
    };

    const handleAdd = async () => {
        if (!taskTitle.trim()) {
            showAlert('Validation Error', 'Task title is required.', 'error');
            return;
        }
        if (!user?.id) {
            showAlert('Error', 'User not found. Please log in again.', 'error');
            return;
        }

        try {
            let notificationId = null;
            if (activeType === 'Task') { 
                notificationId = await scheduleTaskNotification(
                    taskTitle, 
                    dueDate, 
                    dueTime, 
                    reminderMinutes
                );
            }

            await addTask(db, {
                title: taskTitle,
                description: description,
                date: activeType === 'Task' ? dueDate : startDateString,
                time: dueTime,
                type: selectedCategory,
                location: location,
                userId: user.id,
                repeat_frequency: repeatFrequency,
                repeat_days: repeatFrequency === 'weekly' ? JSON.stringify(repeatDays) : null,
                start_date: activeType === 'Schedule' ? startDateString : null,
                end_date: activeType === 'Schedule' ? endDateString : null,
                notification_id: notificationId,
                reminder_minutes: reminderMinutes 
            });
            
            // Replaced Alert with CustomAlert success
            showAlert('Success', `${activeType} added successfully!`, 'success', [{
                text: 'OK',
                onPress: () => {
                    closeAlert();
                    navigation.goBack();
                }
            }]);

        } catch (error) {
            console.error("Failed to add task:", error);
            showAlert('Error', `Failed to add ${activeType}. Please try again.`, 'error');
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation?.goBack()}>
                    <ChevronLeft size={28} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Add</Text>
            </View>

            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Add your schedule or task to stay organized and on track.
            </Text>

            <View style={[styles.segmentedControl, { backgroundColor: colors.card }]}>
                <TouchableOpacity 
                    style={[styles.segment, activeType === 'Task' && [styles.segmentActive, { backgroundColor: colors.purpleAccent + '20' }]]}
                    onPress={() => handleTypeChange('Task')}
                >
                    <Check size={20} color={activeType === 'Task' ? colors.purpleAccent : colors.textSecondary} />
                    <Text style={[styles.segmentText, { color: colors.textSecondary }, activeType === 'Task' && [styles.segmentTextActive, { color: colors.purpleAccent }]]}>Task</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={[styles.segment, activeType === 'Schedule' && [styles.segmentActive, { backgroundColor: colors.purpleAccent + '20' }]]}
                    onPress={() => handleTypeChange('Schedule')}
                >
                    <Calendar size={20} color={activeType === 'Schedule' ? colors.purpleAccent : colors.textSecondary} />
                    <Text style={[styles.segmentText, { color: colors.textSecondary }, activeType === 'Schedule' && [styles.segmentTextActive, { color: colors.purpleAccent }]]}>Schedule</Text>
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView 
                style={{ flex: 1 }} 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView showsVerticalScrollIndicator={false}>
                    
                    <Text style={[styles.label, { color: colors.textPrimary }]}>{activeType === 'Schedule' ? 'Schedule Title' : 'Task title'}</Text>
                    <TextInput
                        style={[styles.textInput, { backgroundColor: colors.inputBackground, color: colors.textPrimary, borderColor: colors.border }]}
                        placeholder={activeType === 'Schedule' ? 'Enter schedule title' : 'Enter task title'}
                        placeholderTextColor={colors.textSecondary}
                        value={taskTitle}
                        onChangeText={setTaskTitle}
                    />

                    <Text style={[styles.label, { color: colors.textPrimary }]}>Category</Text>
                    <View style={[styles.categoryContainer, { backgroundColor: colors.background }]}>
                        {(activeType === 'Task' ? taskCategories : scheduleCategories).map(item => (
                            <CategoryButton key={item.name} item={item} />
                        ))}
                    </View>
                    
                    <Text style={[styles.label, { color: colors.textPrimary }]}>Description</Text>
                    <TextInput
                        style={[styles.textArea, { backgroundColor: colors.inputBackground, color: colors.textPrimary, borderColor: colors.border }]}
                        placeholder={activeType === 'Task' ? 'Describe your task' : 'Describe your schedule'}
                        placeholderTextColor={colors.textSecondary}
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        textAlignVertical="top"
                    />

                    {activeType === 'Schedule' && (
                        <View> 
                            <Text style={[styles.label, { color: colors.textPrimary }]}>Repeat</Text>
                            <View style={[styles.repeatFrequencyContainer, { backgroundColor: colors.card }]}>
                                <TouchableOpacity onPress={() => setRepeatFrequency('none')} style={[styles.frequencyButton, repeatFrequency === 'none' && [styles.frequencyButtonSelected, { backgroundColor: colors.purpleAccent }]]}>
                                    <Text style={[styles.frequencyButtonText, { color: colors.purpleAccent }, repeatFrequency === 'none' && [styles.frequencyButtonTextSelected, { color: colors.card }]]}>None</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setRepeatFrequency('daily')} style={[styles.frequencyButton, repeatFrequency === 'daily' && [styles.frequencyButtonSelected, { backgroundColor: colors.purpleAccent }]]}>
                                    <Text style={[styles.frequencyButtonText, { color: colors.purpleAccent }, repeatFrequency === 'daily' && [styles.frequencyButtonTextSelected, { color: colors.card }]]}>Daily</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setRepeatFrequency('weekly')} style={[styles.frequencyButton, repeatFrequency === 'weekly' && [styles.frequencyButtonSelected, { backgroundColor: colors.purpleAccent }]]}>
                                    <Text style={[styles.frequencyButtonText, { color: colors.purpleAccent }, repeatFrequency === 'weekly' && [styles.frequencyButtonTextSelected, { color: colors.card }]]}>Weekly</Text>
                                </TouchableOpacity>
                            </View>
                            {repeatFrequency === 'weekly' &&
                            <View style={[styles.repeatContainer, { backgroundColor: colors.card }]}>
                                {weekDays.map((day, index) => (
                                    <TouchableOpacity key={index} onPress={() => handleRepeatDayToggle(day)} style={[styles.dayButton, repeatDays.includes(day) && [styles.dayButtonSelected, { backgroundColor: colors.purpleAccent }]]}>
                                        <Text style={[styles.dayText, { color: colors.purpleAccent }, repeatDays.includes(day) && [styles.dayTextSelected, { color: colors.card }]]}>{day.charAt(0)}</Text>
                                    </TouchableOpacity>
                                ))}
                                <TouchableOpacity 
                                    onPress={handleEverydayToggle} 
                                    style={[
                                        styles.everydayButton,
                                        repeatDays.length === weekDays.length && [styles.dayButtonSelected, { backgroundColor: colors.purpleAccent }]
                                    ]}
                                >
                                    <Text style={[
                                        styles.everydayText, { color: colors.purpleAccent },
                                        repeatDays.length === weekDays.length && [styles.dayTextSelected, { color: colors.card }]
                                    ]}>Everyday</Text>
                                </TouchableOpacity>
                            </View>
                            }
                        </View>
                    )}

                    <View style={styles.dateTimeContainer}>
                        <View style={styles.dateTimeInputGroup}> 
                            <Text style={[styles.label, { color: colors.textPrimary }]}>{activeType === 'Schedule' ? 'Time' : 'Due Time'}</Text>
                            <TouchableOpacity onPress={() => setShowTimePicker(true)} style={styles.dateTimeWrapper}>
                                <Clock size={20} color={colors.textSecondary} style={styles.iconInInput} />
                                <Text style={[styles.textInput, styles.dateTimeText, { backgroundColor: colors.inputBackground, color: colors.textPrimary, borderColor: colors.border }]}>{dueTime}</Text>
                            </TouchableOpacity>
                        </View>
                        
                        {activeType === 'Task' ? (
                            <View style={styles.dateTimeInputGroup}> 
                                <Text style={[styles.label, { color: colors.textPrimary }]}>Due Date</Text>
                                <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateTimeWrapper}>
                                    <Calendar size={20} color={colors.textSecondary} style={styles.iconInInput} />
                                    <Text style={[styles.textInput, styles.dateTimeText, { backgroundColor: colors.inputBackground, color: colors.textPrimary, borderColor: colors.border }]}>{dueDate}</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.scheduleDateContainer}>
                                <View style={styles.dateTimeInputGroup}> 
                                    <Text style={[styles.label, { color: colors.textPrimary }]}>Start Date</Text>
                                    <TouchableOpacity onPress={() => setShowStartDatePicker(true)} style={styles.dateTimeWrapper}>
                                        <Calendar size={20} color={colors.textSecondary} style={styles.iconInInput} />
                                        <Text style={[styles.textInput, styles.dateTimeText, { backgroundColor: colors.inputBackground, color: colors.textPrimary, borderColor: colors.border }]}>{startDateString}</Text>
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.dateTimeInputGroup}> 
                                    <Text style={[styles.label, { color: colors.textPrimary }]}>End Date</Text>
                                    <TouchableOpacity onPress={() => setShowEndDatePicker(true)} style={styles.dateTimeWrapper}>
                                        <Calendar size={20} color={colors.textSecondary} style={styles.iconInInput} />
                                        <Text style={[styles.textInput, styles.dateTimeText, { backgroundColor: colors.inputBackground, color: colors.textPrimary, borderColor: colors.border }]}>{endDateString}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>

                    {showDatePicker && (
                        <DateTimePicker
                            testID="datePicker"
                            value={date}
                            mode="date"
                            display="default"
                            onChange={handleDateChange}
                            textColor={colors.textPrimary}
                            style={{ backgroundColor: colors.card }}
                        />
                    )}

                    {showStartDatePicker && (
                        <DateTimePicker
                            testID="startDatePicker"
                            value={startDate}
                            mode="date"
                            display="default"
                            onChange={handleStartDateChange}
                            textColor={colors.textPrimary}
                            style={{ backgroundColor: colors.card }}
                        />
                    )}

                    {showEndDatePicker && (
                        <DateTimePicker
                            testID="endDatePicker"
                            value={endDate}
                            mode="date"
                            display="default"
                            onChange={handleEndDateChange}
                            textColor={colors.textPrimary}
                            style={{ backgroundColor: colors.card }}
                        />
                    )}

                    {showTimePicker && (
                        <DateTimePicker
                            testID="timePicker"
                            value={time}
                            mode="time"
                            display="default"
                            onChange={handleTimeChange}
                            textColor={colors.textPrimary}
                            style={{ backgroundColor: colors.card }}
                        />
                    )}

                    <Text style={[styles.label, { color: colors.textPrimary }]}>Location</Text>
                    <View style={styles.locationInputContainer}>
                        <TextInput
                            style={[styles.textInput, styles.locationInput, { backgroundColor: colors.inputBackground, color: colors.textPrimary, borderColor: colors.border }]}
                            placeholder="Type or select from map"
                            placeholderTextColor={colors.textSecondary}
                            value={location}
                            onChangeText={setLocation}
                        />
                        <TouchableOpacity onPress={handleOpenMap} style={styles.mapIcon}>
                            <MapPin size={22} color={colors.accentOrange} />
                        </TouchableOpacity>
                    </View>
                    
                    <Text style={[styles.label, { color: colors.textPrimary }]}>Remind Me Before</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                        {[0, 5, 10, 15, 30, 60].map((min) => (
                            <TouchableOpacity
                                key={min}
                                style={[
                                    styles.reminderChip,
                                    { borderColor: colors.border, backgroundColor: colors.card },
                                    reminderMinutes === min && { backgroundColor: colors.purpleAccent, borderColor: colors.purpleAccent }
                                ]}
                                onPress={() => setReminderMinutes(min)}
                            >
                                <Text style={[
                                    styles.reminderText, 
                                    { color: colors.textPrimary },
                                    reminderMinutes === min && { color: '#fff', fontWeight: 'bold' }
                                ]}>
                                    {min === 0 ? 'At time' : `${min} min`}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                    
                    <TouchableOpacity 
                        style={[styles.addButton, { backgroundColor: colors.purpleAccent, shadowColor: colors.purpleAccent }]}
                        onPress={handleAdd}
                    >
                        <Text style={styles.addButtonText}>Add {activeType}</Text>
                    </TouchableOpacity>

                </ScrollView>
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
    container: {
        flex: 1,
        paddingHorizontal: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 10,
        marginBottom: 10,
    },
    headerTitle: {
        fontSize: 30,
        fontWeight: 'bold',
        marginLeft: 20,
    },
    subtitle: {
        fontSize: 14,
        marginBottom: 20,
        lineHeight: 20,
    },
    segmentedControl: {
        flexDirection: 'row',
        borderRadius: 10,
        marginBottom: 25,
    },
    segment: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        paddingHorizontal: 10,
        position: 'relative',
    },
    segmentActive: {
        borderRadius: 10,
    },
    segmentText: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    segmentTextActive: {
        fontWeight: 'bold',
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    textInput: {
        borderRadius: 8,
        borderWidth: 1,
        paddingHorizontal: 15,
        paddingVertical: 15,
        fontSize: 16,
        marginBottom: 20,
    },
    textArea: {
        borderRadius: 8,
        borderWidth: 1,
        paddingHorizontal: 15,
        paddingVertical: 15,
        fontSize: 16,
        height: 100, 
        marginBottom: 20,
    },
    categoryContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 25,
    },
    categoryButton: {
        width: '23%', 
        borderRadius: 10,
        paddingVertical: 15,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    categoryText: {
        fontSize: 12,
        fontWeight: '600',
        marginTop: 5,
    },
    repeatFrequencyContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderRadius: 10,
        padding: 5,
        marginBottom: 10,
    },
    frequencyButton: {
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 8,
    },
    frequencyButtonText: {
        fontWeight: 'bold',
    },
    frequencyButtonSelected: {
    },
    frequencyButtonTextSelected: {
    },
    repeatContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderRadius: 10,
        padding: 10,
        marginBottom: 20,
    },
    dayButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    dayButtonSelected: {
    },
    dayText: {
        fontWeight: 'bold',
        fontSize: 14,
    },
    dayTextSelected: {
    },
    everydayButton: {
        paddingHorizontal: 12,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    everydayText: {
        fontWeight: 'bold',
        fontSize: 14,
    },
    dateTimeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexWrap: 'wrap', 
        marginBottom: 20,
    },
    scheduleDateContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    dateTimeInputGroup: {
        width: '48%',
        marginBottom: 15, 
    },
    iconInInput: {
        position: 'absolute',
        left: 15,
        zIndex: 1,
    },
    dateTimeText: {
        paddingLeft: 45,
        marginBottom: 0,
        paddingVertical: 0, 
        height: 50, 
        textAlignVertical: 'center',
    },
    dateTimeWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        position: 'relative',
    },
    locationInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        position: 'relative',
        marginBottom: 20,
    },
    locationInput: {
        flex: 1,
        paddingRight: 50, 
        marginBottom: 0, 
    },
    mapIcon: {
        position: 'absolute',
        right: 0,
        padding: 15, 
    },
    addButton: {
        borderRadius: 10,
        padding: 18,
        alignItems: 'center',
        marginVertical: 30,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: 10,
    },
    reminderChip: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1,
        marginRight: 10,
    },
    reminderText: {
        fontSize: 14,
    },
    addButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default AddScreen;