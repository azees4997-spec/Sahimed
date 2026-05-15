import 'package:intl/intl.dart';

class DateFormatter {
  static String formatToIST(DateTime dateTime) {
    // Convert to IST (UTC +5:30)
    // Firestore timestamps are usually in UTC.
    // If the dateTime is not already in UTC, we ensure it is.
    final utcDate = dateTime.toUtc();
    final istDate = utcDate.add(const Duration(hours: 5, minutes: 30));
    
    return DateFormat('dd MMM yyyy, hh:mm a').format(istDate);
  }

  static String formatToISTDateOnly(DateTime dateTime) {
    final utcDate = dateTime.toUtc();
    final istDate = utcDate.add(const Duration(hours: 5, minutes: 30));
    
    return DateFormat('dd MMM yyyy').format(istDate);
  }
}
