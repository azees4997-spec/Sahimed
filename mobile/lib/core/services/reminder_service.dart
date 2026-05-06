import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:timezone/timezone.dart' as tz;
import 'package:timezone/data/latest.dart' as tz;


class ReminderService {
  static final FlutterLocalNotificationsPlugin _notifications =
      FlutterLocalNotificationsPlugin();

  static Future<void> init() async {
    tz.initializeTimeZones();

    // BUG-06 FIX: Always set to Indian Standard Time regardless of device timezone
    tz.setLocalLocation(tz.getLocation('Asia/Kolkata'));
    
    const AndroidInitializationSettings androidInit =
        AndroidInitializationSettings('@mipmap/ic_launcher');
        
    const DarwinInitializationSettings iosInit = DarwinInitializationSettings();

    const InitializationSettings settings = InitializationSettings(
      android: androidInit,
      iOS: iosInit,
    );

    await _notifications.initialize(
      settings,
      onDidReceiveNotificationResponse: (details) {
        // Handle notification tap
      },
    );
  }

  static Future<void> scheduleReminder({
    required int id,
    required String title,
    required String body,
    required int hour,
    required int minute,
  }) async {
    // Schedule for everyday at the specific time
    await _notifications.zonedSchedule(
      id,
      title,
      body,
      _nextInstanceOfTime(hour, minute),
      const NotificationDetails(
        android: AndroidNotificationDetails(
          'pill_reminders',
          'Pill Reminders',
          channelDescription: 'Daily notifications for taking medicines',
          importance: Importance.max,
          priority: Priority.high,
          playSound: true,
          enableVibration: true,
          fullScreenIntent: true,
          category: AndroidNotificationCategory.alarm,
          visibility: NotificationVisibility.public,
        ),
        iOS: DarwinNotificationDetails(
          presentAlert: true,
          presentBadge: true,
          presentSound: true,
        ),
      ),
      androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
      uiLocalNotificationDateInterpretation:
          UILocalNotificationDateInterpretation.absoluteTime,
      matchDateTimeComponents: DateTimeComponents.time,
    );
  }

  // BUG-06 FIX: Always uses IST (Asia/Kolkata) for scheduling
  static tz.TZDateTime _nextInstanceOfTime(int hour, int minute) {
    final location = tz.getLocation('Asia/Kolkata');
    final tz.TZDateTime now = tz.TZDateTime.now(location);
    tz.TZDateTime scheduledDate =
        tz.TZDateTime(location, now.year, now.month, now.day, hour, minute);
    if (scheduledDate.isBefore(now)) {
      scheduledDate = scheduledDate.add(const Duration(days: 1));
    }
    return scheduledDate;
  }

  static Future<void> cancelReminder(int id) async {
    try {
      await _notifications.cancel(id);
    } catch (e) {
      debugPrint('Error canceling reminder: $e');
    }
  }

  static Future<void> cancelAll() async {
    try {
      await _notifications.cancelAll();
    } catch (e) {
      debugPrint('Error canceling all reminders: $e');
    }
  }
}
