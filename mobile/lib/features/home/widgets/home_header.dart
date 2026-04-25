import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../core/providers/cart_provider.dart';
import '../../../core/theme/colors.dart';
import '../../../core/services/location_service.dart';
import '../../../core/services/api_service.dart';
import '../../products/screens/search_screen.dart';
import '../screens/cart_screen.dart';

class HomeHeader extends StatefulWidget {
  const HomeHeader({super.key});

  @override
  State<HomeHeader> createState() => _HomeHeaderState();
}

class _HomeHeaderState extends State<HomeHeader> {
  String _currentAddress = 'Loading...';
  final LocationService _locationService = LocationService();

  @override
  void initState() {
    super.initState();
    _initLocation();
  }

  Future<void> _initLocation() async {
    final address = await _locationService.getCurrentAddress();
    if (mounted) {
      setState(() => _currentAddress = address);
    }
  }

  void _showLocationDialog() {
    final pincodeController = TextEditingController();
    bool isLoading = false;

    showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setStateDialog) {
            return AlertDialog(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(24),
              ),
              title: Text(
                'Enter Pincode',
                style: GoogleFonts.outfit(
                  fontSize: 16,
                  fontWeight: FontWeight.w900,
                  color: const Color(0xFF0F172A),
                ),
              ),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TextField(
                    controller: pincodeController,
                    keyboardType: TextInputType.number,
                    maxLength: 6,
                    decoration: InputDecoration(
                      hintText: 'e.g. 560001',
                      filled: true,
                      fillColor: const Color(0xFFF8FAFC),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide.none,
                      ),
                      counterText: '',
                    ),
                    style: GoogleFonts.outfit(
                      fontWeight: FontWeight.w900,
                      letterSpacing: 2,
                    ),
                  ),
                  const SizedBox(height: 16),
                  if (isLoading)
                    const CircularProgressIndicator()
                  else
                    Row(
                      children: [
                        Expanded(
                          child: ElevatedButton(
                            onPressed: () async {
                              if (pincodeController.text.length == 6) {
                                setStateDialog(() => isLoading = true);
                                final isServiceable = await ApiService()
                                    .checkServiceability(pincodeController.text);
                                setStateDialog(() => isLoading = false);

                                if (isServiceable) {
                                  if (mounted) {
                                    setState(() => _currentAddress =
                                        'PIN: ${pincodeController.text}');
                                    Navigator.pop(context);
                                  }
                                } else {
                                  if (mounted) {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(
                                        content: Text(
                                          'We currently do not deliver to ${pincodeController.text}.',
                                          style: GoogleFonts.outfit(
                                              fontWeight: FontWeight.w700),
                                        ),
                                        backgroundColor: Colors.red,
                                      ),
                                    );
                                  }
                                }
                              }
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: SahimedColors.primary,
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                              padding: const EdgeInsets.symmetric(vertical: 14),
                            ),
                            child: Text(
                              'CHECK',
                              style: GoogleFonts.outfit(
                                fontWeight: FontWeight.w900,
                                letterSpacing: 1,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  const SizedBox(height: 16),
                  Text(
                    'OR',
                    style: GoogleFonts.outfit(
                      fontSize: 10,
                      fontWeight: FontWeight.w900,
                      color: const Color(0xFF94A3B8),
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextButton.icon(
                    onPressed: () async {
                      setStateDialog(() => isLoading = true);
                      // In a real scenario, we would parse the pincode from GPS. 
                      // For now, we fetch address and assume serviceable or add logic to location_service.
                      await _initLocation();
                      setStateDialog(() => isLoading = false);
                      if (mounted) Navigator.pop(context);
                    },
                    icon: const Icon(LucideIcons.locateFixed, size: 16),
                    label: Text(
                      'USE CURRENT LOCATION',
                      style: GoogleFonts.outfit(
                        fontWeight: FontWeight.w900,
                        letterSpacing: 1,
                      ),
                    ),
                    style: TextButton.styleFrom(
                      foregroundColor: SahimedColors.primary,
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final cartItems = context.watch<CartProvider>().items.length;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.9),
        border: Border(
          bottom: BorderSide(color: const Color(0xFFF1F5F9), width: 1),
        ),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              // 1. Logo Section
              GestureDetector(
                onTap: () =>
                    Navigator.of(context).popUntil((route) => route.isFirst),
                child: Row(
                  children: [
                    SvgPicture.asset(
                      'assets/icons/logo.svg',
                      width: 38,
                      height: 38,
                    ),
                    const SizedBox(width: 6),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        RichText(
                          text: TextSpan(
                            children: [
                              TextSpan(
                                text: 'Sahi',
                                style: GoogleFonts.outfit(
                                  fontSize: 20,
                                  fontWeight: FontWeight.w900,
                                  color: const Color(0xFF0F172A),
                                  letterSpacing: -0.5,
                                ),
                              ),
                              TextSpan(
                                text: 'Med',
                                style: GoogleFonts.outfit(
                                  fontSize: 20,
                                  fontWeight: FontWeight.w900,
                                  color: SahimedColors.primary,
                                  letterSpacing: -0.5,
                                ),
                              ),
                            ],
                          ),
                        ),
                        Text(
                          'Sahi dawai sahi daam pe'.toUpperCase(),
                          style: GoogleFonts.outfit(
                            fontSize: 6.5,
                            fontWeight: FontWeight.w900,
                            color: const Color(0xFF64748B),
                            letterSpacing: 1.2,
                            height: 0.8,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              // 2. Right Actions
              Row(
                children: [
                  // Location Picker (Minimalist like web)
                  GestureDetector(
                    onTap: _showLocationDialog,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(100),
                        border: Border.all(color: const Color(0xFFF1F5F9)),
                      ),
                      child: Row(
                        children: [
                          const Icon(
                            LucideIcons.mapPin,
                            size: 12,
                            color: SahimedColors.primary,
                          ),
                          const SizedBox(width: 4),
                          ConstrainedBox(
                            constraints: const BoxConstraints(maxWidth: 70),
                            child: Text(
                              _currentAddress,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: GoogleFonts.outfit(
                                fontSize: 10,
                                fontWeight: FontWeight.w900,
                                color: const Color(0xFF334155),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),

                  // Search Trigger
                  _NavbarIcon(
                    icon: LucideIcons.search,
                    onTap: () => Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const SearchScreen(),
                      ),
                    ),
                    backgroundColor: SahimedColors.primary,
                    iconColor: Colors.white,
                    shadow: true,
                  ),
                  const SizedBox(width: 10),

                  // Cart Trigger
                  _NavbarIcon(
                    icon: LucideIcons.shoppingCart,
                    onTap: () => Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const CartScreen(),
                      ),
                    ),
                    badgeCount: cartItems,
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _NavbarIcon extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  final Color? backgroundColor;
  final Color? iconColor;
  final bool shadow;
  final int badgeCount;

  const _NavbarIcon({
    required this.icon,
    required this.onTap,
    this.backgroundColor,
    this.iconColor,
    this.shadow = false,
    this.badgeCount = 0,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Container(
            height: 36,
            width: 36,
            decoration: BoxDecoration(
              color: backgroundColor ?? Colors.white,
              shape: BoxShape.circle,
              border: Border.all(
                color: backgroundColor != null
                    ? Colors.transparent
                    : const Color(0xFFE2E8F0),
              ),
              boxShadow: shadow
                  ? [
                      BoxShadow(
                        color: SahimedColors.primary.withValues(alpha: 0.3),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ]
                  : [],
            ),
            child: Icon(
              icon,
              size: 16,
              color: iconColor ?? SahimedColors.primary,
            ),
          ),
          if (badgeCount > 0)
            Positioned(
              top: -4,
              right: -4,
              child: Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: SahimedColors.accent,
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 2),
                ),
                constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
                child: Text(
                  '$badgeCount',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.outfit(
                    fontSize: 8,
                    fontWeight: FontWeight.w900,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
