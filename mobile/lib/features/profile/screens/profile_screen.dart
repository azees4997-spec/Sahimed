import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../core/theme/colors.dart';
import '../../auth/screens/login_screen.dart';
import 'policies_screen.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  void _logout(BuildContext context) {
    // In a real app, you would sign out from Firebase Auth here
    Navigator.pushAndRemoveUntil(
      context,
      MaterialPageRoute(builder: (context) => const LoginScreen()),
      (route) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: SahimedColors.background,
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            backgroundColor: SahimedColors.white,
            expandedHeight: 180,
            pinned: true,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [SahimedColors.lavender, SahimedColors.white],
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                  ),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const SizedBox(height: 40),
                    Container(
                      width: 80,
                      height: 80,
                      decoration: BoxDecoration(
                        color: SahimedColors.primary,
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 4),
                        boxShadow: [
                          BoxShadow(
                            color: SahimedColors.primary.withValues(alpha: 0.2),
                            blurRadius: 15,
                            offset: const Offset(0, 5),
                          ),
                        ],
                      ),
                      child: const Center(
                        child: Text(
                          'S',
                          style: TextStyle(
                            fontSize: 32,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'Sahimed Member',
                      style: GoogleFonts.outfit(
                        fontSize: 20,
                        fontWeight: FontWeight.w900,
                        color: SahimedColors.textPrimary,
                        letterSpacing: -0.5,
                      ),
                    ),
                    Text(
                      '+91 7349499898',
                      style: GoogleFonts.outfit(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: SahimedColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'DASHBOARD',
                    style: GoogleFonts.outfit(
                      fontSize: 12,
                      fontWeight: FontWeight.w900,
                      color: SahimedColors.slate400,
                      letterSpacing: 2,
                    ),
                  ),
                  const SizedBox(height: 16),
                  _buildMenuCard(
                    context,
                    title: 'My Orders',
                    subtitle: 'Track, return, or buy again',
                    icon: LucideIcons.package,
                    color: SahimedColors.sahiBlue,
                    iconColor: SahimedColors.primary,
                    onTap: () {},
                  ),
                  const SizedBox(height: 12),
                  _buildMenuCard(
                    context,
                    title: 'My Prescriptions',
                    subtitle: 'View your uploaded Rx',
                    icon: LucideIcons.fileText,
                    color: SahimedColors.sahiPink,
                    iconColor: SahimedColors.accent,
                    onTap: () {},
                  ),
                  const SizedBox(height: 12),
                  _buildMenuCard(
                    context,
                    title: 'Saved Addresses',
                    subtitle: 'Manage delivery addresses',
                    icon: LucideIcons.mapPin,
                    color: SahimedColors.lavender,
                    iconColor: const Color(0xFF6B46C1),
                    onTap: () {},
                  ),

                  const SizedBox(height: 32),
                  Text(
                    'SETTINGS & SUPPORT',
                    style: GoogleFonts.outfit(
                      fontSize: 12,
                      fontWeight: FontWeight.w900,
                      color: SahimedColors.slate400,
                      letterSpacing: 2,
                    ),
                  ),
                  const SizedBox(height: 16),
                  _buildSettingsTile(LucideIcons.messageSquare, 'Contact Pharmacist', () {}),
                  _buildSettingsTile(LucideIcons.fileText, 'Support & Policies', () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (context) => PoliciesScreen()),
                    );
                  }),
                  _buildSettingsTile(Icons.help_outline_rounded, 'FAQ & Help', () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (context) => PoliciesScreen()),
                    );
                  }),
                  
                  const SizedBox(height: 32),
                  SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: OutlinedButton.icon(
                      onPressed: () => _logout(context),
                      icon: const Icon(LucideIcons.logOut, color: SahimedColors.accent, size: 20),
                      label: Text(
                        'LOGOUT',
                        style: GoogleFonts.outfit(
                          fontSize: 14,
                          fontWeight: FontWeight.w900,
                          color: SahimedColors.accent,
                          letterSpacing: 1.5,
                        ),
                      ),
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(color: SahimedColors.accent, width: 2),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                    ),
                  ),
                  const SizedBox(height: 120), // BottomNav spacing
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMenuCard(BuildContext context, {
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
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: Colors.white, width: 2),
          boxShadow: [
            BoxShadow(
              color: iconColor.withValues(alpha: 0.1),
              blurRadius: 15,
              offset: const Offset(0, 5),
            ),
          ],
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
                      color: SahimedColors.textPrimary,
                    ),
                  ),
                  Text(
                    subtitle,
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      color: SahimedColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
            Icon(LucideIcons.chevronRight, color: SahimedColors.textSecondary, size: 20),
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
          color: SahimedColors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: SahimedColors.slate100),
        ),
        child: Icon(icon, size: 20, color: SahimedColors.textPrimary),
      ),
      title: Text(
        title,
        style: GoogleFonts.outfit(
          fontSize: 15,
          fontWeight: FontWeight.w700,
          color: SahimedColors.textPrimary,
        ),
      ),
      trailing: Icon(LucideIcons.chevronRight, color: SahimedColors.slate300, size: 20),
      onTap: onTap,
    );
  }
}
