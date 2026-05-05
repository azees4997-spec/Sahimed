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
  bool _isCheckingPincode = false;

  @override
  void initState() {
    super.initState();
    _initLocation();
  }

  Future<void> _initLocation() async {
    // 1. First attempt (check saved)
    var address = await _locationService.getCurrentAddress();
    
    // 2. If it's a generic message, try forcing a fresh GPS check
    if (address == 'Location permissions denied' || address == 'Loading...') {
      address = await _locationService.getCurrentAddress(forceRefresh: true);
    }

    if (mounted) {
      setState(() => _currentAddress = address);
    }
  }

  void _showLocationSheet() {
    final pincodeController = TextEditingController();
    bool isLoading = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => StatefulBuilder(
        builder: (context, setStateSheet) => Container(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom + 20,
            top: 12,
            left: 20,
            right: 20,
          ),
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Drag Handle
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: const Color(0xFFE2E8F0),
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
              const SizedBox(height: 24),
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: SahimedColors.primary.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(
                      LucideIcons.mapPin,
                      color: SahimedColors.primary,
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Text(
                    'Service Delivery Area',
                    style: GoogleFonts.outfit(
                      fontSize: 18,
                      fontWeight: FontWeight.w900,
                      color: const Color(0xFF0F172A),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              
              // Pincode Input
              Container(
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFFF1F5F9)),
                ),
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                child: TextField(
                  controller: pincodeController,
                  keyboardType: TextInputType.number,
                  maxLength: 6,
                  onChanged: (val) {
                    if (val.length == 6) {
                      _handlePincodeSubmit(val, setStateSheet);
                    }
                  },
                  decoration: InputDecoration(
                    hintText: 'Enter your 6-digit Pincode',
                    hintStyle: GoogleFonts.outfit(
                      color: const Color(0xFF94A3B8),
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                    ),
                    counterText: '',
                    border: InputBorder.none,
                    suffixIcon: _isCheckingPincode 
                      ? const Padding(
                          padding: EdgeInsets.all(12),
                          child: SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          ),
                        )
                      : null,
                  ),
                  style: GoogleFonts.outfit(
                    fontSize: 16,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 4,
                  ),
                ),
              ),
              
              const SizedBox(height: 20),
              
              Text(
                'OR',
                style: GoogleFonts.outfit(
                  fontSize: 10,
                  fontWeight: FontWeight.w900,
                  color: const Color(0xFFCBD5E1),
                  letterSpacing: 1,
                ),
              ),
              
              const SizedBox(height: 20),
              
              // Use Current Location Button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: _isCheckingPincode ? null : () => _handleAutoDetect(setStateSheet),
                  icon: const Icon(LucideIcons.locateFixed, size: 18),
                  label: Text(
                    'DETECT MY LOCATION',
                    style: GoogleFonts.outfit(
                      fontWeight: FontWeight.w900,
                      letterSpacing: 1,
                    ),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: SahimedColors.primary,
                    foregroundColor: Colors.white,
                    elevation: 0,
                    padding: const EdgeInsets.symmetric(vertical: 18),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(20),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              Text(
                'We need your location to show available items',
                style: GoogleFonts.outfit(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: const Color(0xFF64748B),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _handlePincodeSubmit(String pincode, StateSetter setStateSheet) async {
    if (_isCheckingPincode) return;
    
    setStateSheet(() => _isCheckingPincode = true);
    setState(() => _isCheckingPincode = true);
    
    try {
      final isServiceable = await ApiService().checkServiceability(pincode);
      
      if (isServiceable) {
        if (mounted) {
          setState(() {
            _currentAddress = 'PIN: $pincode';
            _isCheckingPincode = false;
          });
          Navigator.pop(context);
        }
      } else {
        if (mounted) {
          setState(() => _isCheckingPincode = false);
          setStateSheet(() => _isCheckingPincode = false);
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Delivery not available in $pincode yet.'),
              backgroundColor: Colors.red,
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isCheckingPincode = false);
        setStateSheet(() => _isCheckingPincode = false);
      }
    }
  }

  Future<void> _handleAutoDetect(StateSetter setStateSheet) async {
    setStateSheet(() => {}); // Refresh UI
    try {
      final address = await _locationService.getCurrentAddress();
      if (mounted) {
        setState(() => _currentAddress = address);
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to detect location')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final cartItems = context.watch<CartProvider>().items.length;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.9),
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
                    onTap: _showLocationSheet,
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
                        color: SahimedColors.primary.withOpacity(0.3),
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
