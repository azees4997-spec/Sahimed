import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../../core/theme/colors.dart';
import '../../../core/services/api_service.dart';
import '../../auth/screens/login_screen.dart';
import 'policies_screen.dart';
import 'health_vault_screen.dart';
import 'orders_screen.dart';
import 'address_list_screen.dart';
import 'reminders_screen.dart';
import 'package:url_launcher/url_launcher.dart';
import 'dart:io';
import 'package:image_picker/image_picker.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/services.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final ApiService _apiService = ApiService();
  final FirebaseAuth _auth = FirebaseAuth.instance;

  List<Map<String, dynamic>> _orders = [];
  List<Map<String, dynamic>> _addresses = [];
  Map<String, dynamic>? _profile;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadProfileData();
  }

  Future<void> _loadProfileData() async {
    try {
      final results = await Future.wait([
        _apiService.getUserProfile(),
        _apiService.getUserOrders(),
        _apiService.getUserAddresses(),
      ]);

      if (mounted) {
        setState(() {
          _profile = results[0] as Map<String, dynamic>?;
          _orders = results[1] as List<Map<String, dynamic>>;
          _addresses = results[2] as List<Map<String, dynamic>>;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _logout(BuildContext context) async {
    await _auth.signOut();
    if (context.mounted) {
      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (context) => const LoginScreen()),
        (route) => false,
      );
    }
  }

  Future<void> _pickAndUploadProfileImage() async {
    HapticFeedback.mediumImpact();
    final ImagePicker picker = ImagePicker();
    try {
      final XFile? image = await picker.pickImage(
        source: ImageSource.gallery,
        maxWidth: 512,
        maxHeight: 512,
        imageQuality: 85,
      );

      if (image != null) {
        setState(() => _isLoading = true);
        final file = File(image.path);
        final downloadUrl = await _apiService.uploadProfileImage(file);

        if (downloadUrl != null) {
          final success = await _apiService.updateUserProfile({
            'photoUrl': downloadUrl,
          });

          if (success) {
            await _loadProfileData();
            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Profile picture updated!')),
              );
            }
          } else {
            if (mounted) {
              setState(() => _isLoading = false);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Failed to save profile picture.')),
              );
            }
          }
        } else {
          if (mounted) {
            setState(() => _isLoading = false);
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Failed to upload image.')),
            );
          }
        }
      }
    } catch (e) {
      debugPrint('Error picking/uploading profile image: $e');
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    }
  }

  Widget _buildInitialsAvatar(String name) {
    return Center(
      child: Text(
        name.isNotEmpty ? name[0] : 'S',
        style: GoogleFonts.outfit(
          fontSize: 36,
          fontWeight: FontWeight.w900,
          color: Colors.white,
        ),
      ),
    );
  }

  void _showEditHealthStatsDialog(BuildContext context) {
    final ageController = TextEditingController(text: _profile?['age']?.toString() ?? '');
    final weightController = TextEditingController(text: _profile?['weight']?.toString() ?? '');
    final heightController = TextEditingController(text: _profile?['height']?.toString() ?? '');
    bool isSaving = false;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
          title: Text(
            'Edit Health Stats',
            style: GoogleFonts.outfit(fontWeight: FontWeight.w900),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: ageController,
                decoration: InputDecoration(
                  labelText: 'AGE (YEARS)',
                  labelStyle: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.bold, color: SahimedColors.slate400),
                  prefixIcon: const Icon(LucideIcons.baby, size: 20),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                ),
                keyboardType: TextInputType.number,
              ),
              const SizedBox(height: 16),
              TextField(
                controller: weightController,
                decoration: InputDecoration(
                  labelText: 'WEIGHT (KG)',
                  labelStyle: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.bold, color: SahimedColors.slate400),
                  prefixIcon: const Icon(LucideIcons.scale, size: 20),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                ),
                keyboardType: TextInputType.number,
              ),
              const SizedBox(height: 16),
              TextField(
                controller: heightController,
                decoration: InputDecoration(
                  labelText: 'HEIGHT (CM)',
                  labelStyle: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.bold, color: SahimedColors.slate400),
                  prefixIcon: const Icon(LucideIcons.ruler, size: 20),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                ),
                keyboardType: TextInputType.number,
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: Text(
                'CANCEL',
                style: GoogleFonts.outfit(color: SahimedColors.slate500, fontWeight: FontWeight.bold),
              ),
            ),
            isSaving 
              ? const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 16),
                  child: SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)),
                )
              : ElevatedButton(
                  onPressed: () async {
                    setDialogState(() => isSaving = true);
                    final age = int.tryParse(ageController.text.trim());
                    final weight = double.tryParse(weightController.text.trim());
                    final height = double.tryParse(heightController.text.trim());

                    final success = await _apiService.updateUserProfile({
                      'age': age,
                      'weight': weight,
                      'height': height,
                    });

                    if (mounted) {
                      if (success) {
                        await _loadProfileData();
                        if (mounted) {
                          Navigator.pop(ctx);
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Health stats updated successfully')),
                          );
                        }
                      } else {
                        setDialogState(() => isSaving = false);
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Failed to update stats. Try again.')),
                        );
                      }
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: SahimedColors.primary,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: Text('SAVE', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
                ),
          ],
        ),
      ),
    );
  }

  void _showEditNameDialog(BuildContext context) {
    final user = _auth.currentUser;
    final nameController = TextEditingController(text: user?.displayName ?? '');

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: Text(
          'Edit Profile Name',
          style: GoogleFonts.outfit(fontWeight: FontWeight.w900),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: nameController,
              decoration: InputDecoration(
                labelText: 'FULL NAME',
                labelStyle: GoogleFonts.outfit(
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  color: SahimedColors.slate400,
                ),
                hintText: 'Enter your name',
                prefixIcon: const Icon(LucideIcons.user, size: 20),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
              textCapitalization: TextCapitalization.words,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text(
              'CANCEL',
              style: GoogleFonts.outfit(
                color: SahimedColors.slate500,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          ElevatedButton(
            onPressed: () async {
              if (nameController.text.trim().isNotEmpty) {
                await user?.updateDisplayName(nameController.text.trim());
                if (mounted) {
                  setState(() {});
                  Navigator.pop(ctx);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Profile updated successfully')),
                  );
                }
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: SahimedColors.primary,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: Text(
              'SAVE',
              style: GoogleFonts.outfit(fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHealthStats() {
    final ageVal = _profile?['age']?.toString() ?? '--';
    final weightVal = _profile?['weight']?.toString() ?? '--';
    final heightVal = _profile?['height']?.toString() ?? '--';

    return Container(
      margin: const EdgeInsets.only(bottom: 24),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: const Color(0xFFF1F5F9)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 15,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'PERSONAL HEALTH STATS',
                style: GoogleFonts.outfit(
                  fontSize: 10,
                  fontWeight: FontWeight.w900,
                  color: const Color(0xFF94A3B8),
                  letterSpacing: 1.5,
                ),
              ),
              GestureDetector(
                onTap: () => _showEditHealthStatsDialog(context),
                child: Row(
                  children: [
                    Text(
                      'EDIT',
                      style: GoogleFonts.outfit(
                        fontSize: 11,
                        fontWeight: FontWeight.w900,
                        color: SahimedColors.primary,
                      ),
                    ),
                    const SizedBox(width: 4),
                    const Icon(LucideIcons.pencil, size: 12, color: SahimedColors.primary),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildStatItem('AGE', ageVal != '--' ? '$ageVal yrs' : '--', LucideIcons.baby, const Color(0xFFEFF6FF), const Color(0xFF3B82F6)),
              _buildDivider(),
              _buildStatItem('WEIGHT', weightVal != '--' ? '$weightVal kg' : '--', LucideIcons.scale, const Color(0xFFECFDF5), const Color(0xFF10B981)),
              _buildDivider(),
              _buildStatItem('HEIGHT', heightVal != '--' ? '$heightVal cm' : '--', LucideIcons.ruler, const Color(0xFFFFF1F2), const Color(0xFFF43F5E)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem(String label, String value, IconData icon, Color bg, Color iconColor) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: bg,
            shape: BoxShape.circle,
          ),
          child: Icon(icon, color: iconColor, size: 16),
        ),
        const SizedBox(height: 8),
        Text(
          label,
          style: GoogleFonts.outfit(
            fontSize: 8,
            fontWeight: FontWeight.w900,
            color: const Color(0xFF94A3B8),
            letterSpacing: 0.5,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          value,
          style: GoogleFonts.outfit(
            fontSize: 14,
            fontWeight: FontWeight.w900,
            color: const Color(0xFF0F172A),
          ),
        ),
      ],
    );
  }

  Widget _buildDivider() {
    return Container(
      height: 36,
      width: 1,
      color: const Color(0xFFF1F5F9),
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = _auth.currentUser;
    final phone = _profile?['phone'] ?? user?.phoneNumber ?? '+91 7349499898';
    final name = (_profile?['name'] ?? user?.displayName ?? 'Sahimed Member').toUpperCase();

    return Container(
      color: SahimedColors.background,
      child: RefreshIndicator(
        onRefresh: _loadProfileData,
        color: SahimedColors.primary,
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(
            parent: BouncingScrollPhysics(),
          ),
          slivers: [
          SliverAppBar(
            backgroundColor: SahimedColors.white,
            expandedHeight: 220,
            pinned: true,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Color(0xFFF1F5F9), Colors.white],
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                  ),
                ),
                child: SafeArea(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const SizedBox(height: 10),
                      Stack(
                        children: [
                          GestureDetector(
                            onTap: _pickAndUploadProfileImage,
                            child: Container(
                              width: 90,
                              height: 90,
                              decoration: BoxDecoration(
                                gradient: const LinearGradient(
                                  colors: [SahimedColors.primary, Color(0xFF6366F1)],
                                ),
                                shape: BoxShape.circle,
                                border: Border.all(color: Colors.white, width: 4),
                                boxShadow: [
                                  BoxShadow(
                                    color: SahimedColors.primary.withOpacity(0.2),
                                    blurRadius: 20,
                                    offset: const Offset(0, 10),
                                  ),
                                ],
                              ),
                              child: ClipOval(
                                child: _profile?['photoUrl'] != null && _profile!['photoUrl'].toString().isNotEmpty
                                    ? CachedNetworkImage(
                                        imageUrl: _profile!['photoUrl'],
                                        fit: BoxFit.cover,
                                        width: 90,
                                        height: 90,
                                        placeholder: (context, url) => const Center(child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)),
                                        errorWidget: (context, url, error) => _buildInitialsAvatar(name),
                                      )
                                    : _buildInitialsAvatar(name),
                              ),
                            ),
                          ),
                          Positioned(
                            bottom: 0,
                            right: 0,
                            child: GestureDetector(
                              onTap: _pickAndUploadProfileImage,
                              child: Container(
                                padding: const EdgeInsets.all(6),
                                decoration: const BoxDecoration(
                                  color: SahimedColors.primary,
                                  shape: BoxShape.circle,
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.black12,
                                      blurRadius: 4,
                                      offset: Offset(0, 2),
                                    ),
                                  ],
                                ),
                                child: const Icon(
                                  LucideIcons.camera,
                                  size: 14,
                                  color: Colors.white,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            name,
                            style: GoogleFonts.outfit(
                              fontSize: 22,
                              fontWeight: FontWeight.w900,
                              color: SahimedColors.textPrimary,
                            ),
                          ),
                          IconButton(
                            icon: const Icon(
                              LucideIcons.pencil,
                              size: 16,
                              color: SahimedColors.primary,
                            ),
                            onPressed: () => _showEditNameDialog(context),
                          ),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: SahimedColors.primary.withOpacity(0.05),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              phone,
                              style: GoogleFonts.inter(
                                fontSize: 15,
                                fontWeight: FontWeight.w700,
                                color: SahimedColors.primary,
                                letterSpacing: 0.5,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: _isLoading
                ? const Center(
                    child: Padding(
                      padding: EdgeInsets.all(40),
                      child: CircularProgressIndicator(
                        color: SahimedColors.primary,
                      ),
                    ),
                  )
                : Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 20,
                      vertical: 24,
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildHealthStats(),
                        _buildSectionTitle('ACTIVITY'),
                        const SizedBox(height: 16),
                        _buildMenuCard(
                          title: 'My Orders',
                          subtitle: _orders.isEmpty
                              ? 'No orders yet'
                              : '${_orders.length} orders placed',
                          icon: LucideIcons.package,
                          color: const Color(0xFFEEF2FF),
                          iconColor: const Color(0xFF4338CA),
                          onTap: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => const OrdersScreen(),
                              ),
                            );
                          },
                        ),
                        const SizedBox(height: 12),
                        _buildMenuCard(
                          title: 'Saved Addresses',
                          subtitle: _addresses.isEmpty
                              ? 'No saved addresses'
                              : '${_addresses.length} locations saved',
                          icon: LucideIcons.mapPin,
                          color: const Color(0xFFF0FDF4),
                          iconColor: const Color(0xFF16A34A),
                          onTap: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => const AddressListScreen(),
                              ),
                            );
                          },
                        ),
                        const SizedBox(height: 12),
                        _buildMenuCard(
                          title: 'Health Vault',
                          subtitle: 'Manage your prescriptions',
                          icon: LucideIcons.folder,
                          color: const Color(0xFFFEF2F2),
                          iconColor: const Color(0xFFEF4444),
                          onTap: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => const HealthVaultScreen(),
                              ),
                            );
                          },
                        ),
                        const SizedBox(height: 12),
                        // Wallet Deactivated
                        const SizedBox(height: 12),
                        _buildMenuCard(
                          title: 'Pill Reminders',
                          subtitle: 'Manage your daily medicine alarms',
                          icon: LucideIcons.alarmClock,
                          color: const Color(0xFFFAF5FF),
                          iconColor: const Color(0xFF7C3AED),
                          onTap: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => const RemindersScreen(),
                              ),
                            );
                          },
                        ),

                        const SizedBox(height: 32),
                        _buildSectionTitle('SETTINGS'),
                        const SizedBox(height: 16),
                        _buildSettingsTile(
                          LucideIcons.shieldCheck,
                          'Terms & Conditions',
                          () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => const PoliciesScreen(),
                              ),
                            );
                          },
                        ),
                        _buildSettingsTile(LucideIcons.info, 'Help & FAQ', () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => const PoliciesScreen(),
                            ),
                          );
                        }),
                        _buildSettingsTile(LucideIcons.phone, 'Contact Us', () {
                          launchUrl(Uri.parse('tel:+917349499898'));
                        }),

                        const SizedBox(height: 48),
                        SizedBox(
                          width: double.infinity,
                          child: TextButton.icon(
                            onPressed: () => _showLogoutDialog(context),
                            icon: const Icon(
                              LucideIcons.logOut,
                              color: Color(0xFFF43F5E),
                              size: 20,
                            ),
                            label: Text(
                              'LOGOUT ACCOUNT',
                              style: GoogleFonts.outfit(
                                fontWeight: FontWeight.w900,
                                color: const Color(0xFFF43F5E),
                                letterSpacing: 1,
                              ),
                            ),
                            style: TextButton.styleFrom(
                              padding: const EdgeInsets.symmetric(vertical: 20),
                              backgroundColor: const Color(0xFFFFF1F2),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(24),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 32),
                        Center(
                          child: Column(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 16,
                                  vertical: 8,
                                ),
                                decoration: BoxDecoration(
                                  color: SahimedColors.emerald500.withOpacity(0.05),
                                  borderRadius: BorderRadius.circular(20),
                                  border: Border.all(
                                    color: SahimedColors.emerald500.withOpacity(0.2),
                                  ),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const Icon(
                                      LucideIcons.shieldCheck,
                                      color: SahimedColors.emerald500,
                                      size: 14,
                                    ),
                                    const SizedBox(width: 8),
                                    Text(
                                      'MEDICAL-GRADE ENCRYPTION ACTIVE',
                                      style: GoogleFonts.outfit(
                                        fontSize: 9,
                                        fontWeight: FontWeight.w900,
                                        color: SahimedColors.emerald500,
                                        letterSpacing: 1.5,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                'TRUSTED BY 10L+ USERS NATIONWIDE',
                                style: GoogleFonts.outfit(
                                  fontSize: 8,
                                  fontWeight: FontWeight.bold,
                                  color: SahimedColors.slate300,
                                  letterSpacing: 1,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 120),
                      ],
                    ),
                  ),
          ),
        ],
      ),
    ),
  );
}

  void _showLogoutDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(
          'Logout',
          style: GoogleFonts.outfit(fontWeight: FontWeight.w900),
        ),
        content: Text(
          'Are you sure you want to sign out?',
          style: GoogleFonts.inter(),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text(
              'CANCEL',
              style: GoogleFonts.outfit(
                color: SahimedColors.slate500,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          TextButton(
            onPressed: () => _logout(context),
            child: Text(
              'LOGOUT',
              style: GoogleFonts.outfit(
                color: SahimedColors.accent,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: GoogleFonts.outfit(
        fontSize: 12,
        fontWeight: FontWeight.w900,
        color: const Color(0xFF94A3B8),
        letterSpacing: 2,
      ),
    );
  }

  Widget _buildMenuCard({
    required String title,
    required String subtitle,
    required IconData icon,
    required Color color,
    required Color iconColor,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(28),
          border: Border.all(color: Colors.white, width: 2),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Icon(icon, color: iconColor, size: 24),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: GoogleFonts.outfit(
                      fontSize: 16,
                      fontWeight: FontWeight.w900,
                      color: const Color(0xFF1E293B),
                    ),
                  ),
                  Text(
                    subtitle,
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      color: const Color(0xFF64748B),
                    ),
                  ),
                ],
              ),
            ),
            const Icon(
              LucideIcons.chevronRight,
              color: Color(0xFF94A3B8),
              size: 20,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSettingsTile(IconData icon, String title, VoidCallback onTap) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFFF1F5F9)),
        ),
        child: Icon(icon, size: 20, color: const Color(0xFF1E293B)),
      ),
      title: Text(
        title,
        style: GoogleFonts.outfit(
          fontSize: 15,
          fontWeight: FontWeight.w700,
          color: const Color(0xFF1E293B),
        ),
      ),
      trailing: const Icon(
        LucideIcons.chevronRight,
        color: Color(0xFFCBD5E1),
        size: 18,
      ),
      onTap: onTap,
    );
  }

  Widget _buildMenuTile(IconData icon, String title, VoidCallback onTap) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFF1F5F9)),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: SahimedColors.primary.withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(icon, color: SahimedColors.primary, size: 20),
        ),
        title: Text(
          title,
          style: GoogleFonts.outfit(
            fontSize: 13,
            fontWeight: FontWeight.w900,
            color: const Color(0xFF1E293B),
            letterSpacing: 0.5,
          ),
        ),
        trailing: const Icon(LucideIcons.chevronRight, size: 18, color: Color(0xFF94A3B8)),
        onTap: onTap,
      ),
    );
  }
}

