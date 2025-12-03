import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, Alert } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const registerForPushNotificationsAsync = async () => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF9500', 
    });
  }

  if (!Device.isDevice) {
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }
  
  return true;
};

// Standard Reminder
export const scheduleTaskNotification = async (title, date, time, reminderMinutes = 5, type = 'Task') => {
  try {
    const [year, month, day] = date.split('-').map(Number);
    const [timePart, modifier] = time.split(' ');
    let [hours, minutes] = timePart.split(':').map(Number);
    
    if (hours === 12) hours = 0;
    if (modifier === 'PM') hours += 12;

    const taskDate = new Date(year, month - 1, day, hours, minutes);
    
    // Trigger: Task Time - Reminder Minutes
    const triggerDate = new Date(taskDate.getTime() - (reminderMinutes * 60000));

    if (triggerDate < new Date()) return null;

    const isTask = type === 'Task';
    const notificationTitle = isTask ? "🔔 Upcoming Task" : "📅 Upcoming Schedule";
    const bodyText = isTask 
        ? `Your task "${title}" is due in ${reminderMinutes} minutes!`
        : `Your schedule "${title}" starts in ${reminderMinutes} minutes!`;

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: notificationTitle,
        body: bodyText,
        sound: 'default',
        color: '#FF9500',
        data: { date, time, type },
      },
      trigger: triggerDate,
    });
    
    return id;
  } catch (error) {
    console.error("Error scheduling notification:", error);
    return null;
  }
};

// Missed Notification (Scheduled for Due Time + 1 minute)
export const scheduleMissedNotification = async (title, date, time, type = 'Task') => {
    try {
        const [year, month, day] = date.split('-').map(Number);
        const [timePart, modifier] = time.split(' ');
        let [hours, minutes] = timePart.split(':').map(Number);
        
        if (hours === 12) hours = 0;
        if (modifier === 'PM') hours += 12;
    
        const taskDate = new Date(year, month - 1, day, hours, minutes);
        
        // Trigger: Task Time + 1 Minute
        const triggerDate = new Date(taskDate.getTime() + (60000)); 
    
        if (triggerDate < new Date()) return null;
    
        const notificationTitle = "⚠️ Missed Task";
        const bodyText = `You missed your task: "${title}".`;
    
        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: notificationTitle,
            body: bodyText,
            sound: 'default',
            color: '#D32F2F', // Red for missed
            data: { date, time, type, status: 'missed' },
          },
          trigger: triggerDate,
        });
        
        return id;
      } catch (error) {
        console.error("Error scheduling missed notification:", error);
        return null;
      }
};

export const cancelTaskNotification = async (notificationId) => {
  if (!notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.error("Error cancelling notification:", error);
  }
};

export const cancelAllNotifications = async () => {
    try {
        await Notifications.cancelAllScheduledNotificationsAsync();
        console.log("All notifications cancelled.");
    } catch (error) {
        console.error("Error cancelling all notifications:", error);
    }
};