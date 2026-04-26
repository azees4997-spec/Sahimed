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
import 'package:url_launcher/url_launcher.dart';

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
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadProfileData();
  }

  Future<void> _loadProfileData() async {
    try {
      final orders = await _apiService.getUserOrders();
      final addresses = await _apiService.getUserAddresses();
      if (mounted) {
        setState(() {
          _orders = orders;
          _addresses = addresses;
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

  @override
  Widget build(BuildContext context) {
    final user = _auth.currentUser;
    final phone = user?.phoneNumber ?? '+91 7349499898';
    final name = (user?.displayName ?? 'Sahimed Member').toUpperCase();

    return Container(
      color: SahimedColors.background,
      child: CustomScrollView(
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
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const SizedBox(height: 60),
                    Container(
                      width: 100,
                      height: 100,
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
                      child: Center(
                        child: Text(
                          name.isNotEmpty ? name[0] : 'S',
                          style: GoogleFonts.outfit(
                            fontSize: 40,
                            fontWeight: FontWeight.w900,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      name,
                      style: GoogleFonts.outfit(
                        fontSize: 22,
                        fontWeight: FontWeight.w900,
                        color: SahimedColors.textPrimary,
                      ),
                    ),
                    Text(
                      phone,
                      style: GoogleFonts.inter(
                        fontSize: 13,
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
                                      'CLINICAL ENCRYPTION ACTIVE',
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
}
