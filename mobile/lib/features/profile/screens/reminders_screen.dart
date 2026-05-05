import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../core/theme/colors.dart';
import '../../../core/services/reminder_service.dart';
import '../../../shared/models/models.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../core/services/api_service.dart';
import '../../../core/services/permission_service.dart';
import 'dart:convert';



class RemindersScreen extends StatefulWidget {
  const RemindersScreen({super.key});

  @override
  State<RemindersScreen> createState() => _RemindersScreenState();
}

class _RemindersScreenState extends State<RemindersScreen> {
  List<MedicineReminder> _reminders = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadReminders();
  }

  Future<void> _loadReminders() async {
    final prefs = await SharedPreferences.getInstance();
    final String? data = prefs.getString('pill_reminders');
    if (data != null) {
      final List<dynamic> decoded = json.decode(data);
      setState(() {
        _reminders = decoded.map((item) => MedicineReminder.fromJson(item)).toList();
        _isLoading = false;
      });
    } else {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _saveReminders() async {
    final prefs = await SharedPreferences.getInstance();
    final listJson = _reminders.map((r) => r.toJson()).toList();
    final String data = json.encode(listJson);
    await prefs.setString('pill_reminders', data);
    
    // Sync to Database for Admin Tracking
    final apiService = ApiService();
    await apiService.syncReminders(listJson.cast<Map<String, dynamic>>());
  }


  void _addReminder() async {
    // Check both Notification and Alarm permissions
    final hasNotif = await PermissionService.requestNotifications(context);
    if (!hasNotif) return;
    
    final hasAlarm = await PermissionService.requestAlarms(context);
    if (!hasAlarm) return;

    final TimeOfDay? picked = await showTimePicker(

      context: context,
      initialTime: TimeOfDay.now(),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: SahimedColors.primary,
            ),
          ),
          child: child!,
        );
      },
    );

    if (picked != null) {
      final String? name = await _showNameDialog();
      if (name != null && name.isNotEmpty) {
        final newReminder = MedicineReminder(
          id: DateTime.now().millisecondsSinceEpoch.toString(),
          medicineName: name,
          dosage: '1 Tablet',
          hour: picked.hour,
          minute: picked.minute,
        );

        setState(() {
          _reminders.add(newReminder);
        });
        _saveReminders();
        
        await ReminderService.scheduleReminder(
          id: int.parse(newReminder.id.substring(newReminder.id.length - 8)),
          title: '💊 Time for your medicine',
          body: 'Take $name (${newReminder.dosage})',
          hour: picked.hour,
          minute: picked.minute,
        );
      }
    }
  }

  Future<String?> _showNameDialog() {
    String name = '';
    return showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: Text('MEDICINE NAME', style: GoogleFonts.outfit(fontWeight: FontWeight.w900, fontSize: 16)),
        content: TextField(
          autofocus: true,
          decoration: const InputDecoration(hintText: 'e.g. Metformin, Pan 40'),
          onChanged: (val) => name = val,
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('CANCEL')),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, name),
            style: ElevatedButton.styleFrom(backgroundColor: SahimedColors.primary, foregroundColor: Colors.white),
            child: const Text('ADD'),
          ),
        ],
      ),
    );
  }

  void _deleteReminder(int index) async {
    final reminder = _reminders[index];
    await ReminderService.cancelReminder(int.parse(reminder.id.substring(reminder.id.length - 8)));
    setState(() {
      _reminders.removeAt(index);
    });
    _saveReminders();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: Text(
          'PILL REMINDERS',
          style: GoogleFonts.outfit(
            fontWeight: FontWeight.w900,
            fontSize: 16,
            color: const Color(0xFF0F172A),
            letterSpacing: 1,
          ),
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: SahimedColors.primary))
          : _reminders.isEmpty
              ? _buildEmptyState()
              : ListView.builder(
                  padding: const EdgeInsets.all(20),
                  itemCount: _reminders.length,
                  itemBuilder: (context, i) => _buildReminderCard(_reminders[i], i),
                ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _addReminder,
        backgroundColor: SahimedColors.primary,
        icon: const Icon(LucideIcons.plus, color: Colors.white),
        label: Text('ADD ALARM', style: GoogleFonts.outfit(fontWeight: FontWeight.w900, color: Colors.white)),
      ),
    );
  }

  Widget _buildReminderCard(MedicineReminder r, int index) {
    final time = TimeOfDay(hour: r.hour, minute: r.minute);
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(28),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 10, offset: const Offset(0, 4)),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: SahimedColors.primary.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: const Icon(LucideIcons.pill, color: SahimedColors.primary, size: 24),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  r.medicineName.toUpperCase(),
                  style: GoogleFonts.outfit(fontWeight: FontWeight.w900, fontSize: 16, color: const Color(0xFF0F172A)),
                ),
                Text(
                  '${time.format(context)} • ${r.dosage}',
                  style: GoogleFonts.inter(fontSize: 13, color: SahimedColors.slate400),
                ),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(LucideIcons.trash2, color: Color(0xFFFDA4AF), size: 20),
            onPressed: () => _deleteReminder(index),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(LucideIcons.alarmClock, size: 64, color: SahimedColors.slate200),
          const SizedBox(height: 24),
          Text(
            'NEVER MISS A DOSE',
            style: GoogleFonts.outfit(fontWeight: FontWeight.w900, fontSize: 18),
          ),
          const SizedBox(height: 8),
          Text(
            'Set reminders for your daily medicines.',
            style: GoogleFonts.inter(color: SahimedColors.slate400),
          ),
        ],
      ),
    );
  }
}
