import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../theme/colors.dart';

class PermissionService {
  /// Unified method to request a permission with a modern rationale dialog
  static Future<bool> requestPermission(
    BuildContext context, {
    required Permission permission,
    required String title,
    required String rationale,
    required IconData icon,
  }) async {
    // 1. Check current status
    var status = await permission.status;

    // 2. If already granted, return true
    if (status.isGranted) return true;

    // 3. If permanently denied, show settings dialog
    if (status.isPermanentlyDenied) {
      if (context.mounted) {
        _showSettingsDialog(context, title);
      }
      return false;
    }

    // 4. Request the actual permission directly (bypassing custom rationale as requested)
    final result = await permission.request();
    return result.isGranted;
  }

  static Future<bool?> _showRationaleDialog(
    BuildContext context, {
    required String title,
    required String rationale,
    required IconData icon,
  }) {
    return showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
        contentPadding: const EdgeInsets.all(24),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: SahimedColors.primary.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: SahimedColors.primary, size: 32),
            ),
            const SizedBox(height: 24),
            Text(
              title.toUpperCase(),
              style: GoogleFonts.outfit(
                fontWeight: FontWeight.w900,
                fontSize: 18,
                color: const Color(0xFF0F172A),
                letterSpacing: 1,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            Text(
              rationale,
              style: GoogleFonts.inter(
                fontSize: 14,
                color: const Color(0xFF64748B),
                height: 1.5,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
            Row(
              children: [
                Expanded(
                  child: TextButton(
                    onPressed: () => Navigator.pop(context, false),
                    style: TextButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                    child: Text(
                      'NOT NOW',
                      style: GoogleFonts.outfit(
                        fontWeight: FontWeight.w900,
                        fontSize: 12,
                        color: const Color(0xFF94A3B8),
                        letterSpacing: 1,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () => Navigator.pop(context, true),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: SahimedColors.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                    child: Text(
                      'CONTINUE',
                      style: GoogleFonts.outfit(
                        fontWeight: FontWeight.w900,
                        fontSize: 12,
                        letterSpacing: 1,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  static void _showSettingsDialog(BuildContext context, String permissionName) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
        title: Text(
          'PERMISSION REQUIRED',
          style: GoogleFonts.outfit(fontWeight: FontWeight.w900, fontSize: 16),
        ),
        content: Text(
          'The $permissionName permission is permanently denied. Please enable it in the app settings to continue.',
          style: GoogleFonts.inter(fontSize: 14),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('CANCEL', style: GoogleFonts.outfit(fontWeight: FontWeight.w900)),
          ),
          ElevatedButton(
            onPressed: () {
              openAppSettings();
              Navigator.pop(context);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: SahimedColors.primary,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: Text('OPEN SETTINGS', style: GoogleFonts.outfit(fontWeight: FontWeight.w900)),
          ),
        ],
      ),
    );
  }

  // --- Specific Helpers for the 5 requested permissions ---

  static Future<bool> requestCamera(BuildContext context) {
    return requestPermission(
      context,
      permission: Permission.camera,
      title: 'Camera Access',
      rationale: 'We need camera access to help you upload prescriptions and scan medicine details.',
      icon: LucideIcons.camera,
    );
  }

  static Future<bool> requestStorage(BuildContext context) async {
    // 1. Check for Android 13+ Photo access
    final photoStatus = await Permission.photos.request();
    if (photoStatus.isGranted) return true;

    // 2. Fallback to legacy storage permission
    final storageStatus = await Permission.storage.request();
    if (storageStatus.isGranted) return true;

    // 3. Fallback to rationale if both failed but not permanently denied
    return requestPermission(
      context,
      permission: Permission.storage,
      title: 'File Access',
      rationale: 'Allow access to your files to upload prescriptions and saved medical reports.',
      icon: LucideIcons.fileText,
    );
  }


  static Future<bool> requestLocation(BuildContext context) {
    return requestPermission(
      context,
      permission: Permission.locationWhenInUse,
      title: 'Location Access',
      rationale: 'Your location is used to find the nearest delivery partner and ensure faster service.',
      icon: LucideIcons.mapPin,
    );
  }

  static Future<bool> requestNotifications(BuildContext context) {
    return requestPermission(
      context,
      permission: Permission.notification,
      title: 'Notifications',
      rationale: 'Get real-time updates about your order status, delivery tracking, and health tips.',
      icon: LucideIcons.bell,
    );
  }

  static Future<bool> requestPhone(BuildContext context) {
    return requestPermission(
      context,
      permission: Permission.phone,
      title: 'Phone Access',
      rationale: 'This allows you to directly call our pharmacists and support team from within the app.',
      icon: LucideIcons.phone,
    );
  }

  static Future<bool> requestAlarms(BuildContext context) {
    return requestPermission(
      context,
      permission: Permission.scheduleExactAlarm,
      title: 'Exact Alarms',
      rationale: 'To ensure your medicine reminders ring exactly on time, we need permission to set exact alarms.',
      icon: LucideIcons.alarmClock,
    );
  }
}

