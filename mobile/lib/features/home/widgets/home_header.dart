import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../../core/providers/cart_provider.dart';
import '../../../core/theme/colors.dart';
import '../../../core/services/location_service.dart';
import '../../../shared/models/models.dart';
import '../../products/screens/search_screen.dart';
import '../screens/cart_screen.dart';

class HomeHeader extends StatefulWidget {
  const HomeHeader({super.key});

  @override
  State<HomeHeader> createState() => _HomeHeaderState();
}

class _HomeHeaderState extends State<HomeHeader> {
  String _currentAddress = 'Fetching location...';
  bool _isSaved = false;
  final LocationService _locationService = LocationService();

  @override
  void initState() {
    super.initState();
    _initLocation();
  }

  Future<void> _initLocation() async {
    final saved = await _locationService.getSavedAddress();
    if (saved != null) {
      if (mounted) {
        setState(() {
          _currentAddress = saved;
          _isSaved = true;
        });
      }
    } else {
      _fetchLocation();
    }
  }

  Future<void> _fetchLocation() async {
    final address = await _locationService.getCurrentAddress();
    final hasSaved = await _locationService.hasSavedAddress();
    if (mounted) {
      setState(() {
        _currentAddress = address;
        _isSaved = hasSaved;
      });
    }
  }

  Future<void> _saveCurrentLocation() async {
    await _locationService.saveAddress(_currentAddress);
    if (mounted) {
      setState(() {
        _isSaved = true;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Address saved successfully!')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
      decoration: const BoxDecoration(
        color: SahimedColors.white,
      ),
      child: Column(
        children: [
          Row(
            children: [
              // Location Info
              Expanded(
                child: GestureDetector(
                  onTap: _fetchLocation,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(
                            _isSaved ? Icons.home_rounded : Icons.location_on_rounded,
                            color: SahimedColors.primary,
                            size: 16,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            _isSaved ? 'HOME ADDRESS' : 'DELIVERING TO',
                            style: GoogleFonts.outfit(
                              fontSize: 10,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 1.2,
                              color: SahimedColors.primary.withValues(alpha: 0.6),
                            ),
                          ),
                          const Icon(
                            Icons.keyboard_arrow_down_rounded,
                            color: SahimedColors.primary,
                            size: 16,
                          ),
                          if (!_isSaved) ...[
                            const SizedBox(width: 8),
                            GestureDetector(
                              onTap: _saveCurrentLocation,
                              child: Text(
                                'SAVE',
                                style: GoogleFonts.outfit(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w900,
                                  color: SahimedColors.accent,
                                  decoration: TextDecoration.underline,
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(
                        _currentAddress,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: GoogleFonts.outfit(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: SahimedColors.primary,
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // Actions: Search & Cart
              Row(
                children: [
                  _HeaderAction(
                    icon: Icons.search_rounded,
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (context) => const SearchScreen()),
                      );
                    },
                  ),
                  const SizedBox(width: 12),
                  _HeaderAction(
                    icon: Icons.shopping_basket_rounded,
                    isCart: true,
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (context) => const CartScreen()),
                      );
                    },
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

class _HeaderAction extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  final bool isCart;

  const _HeaderAction({
    required this.icon,
    required this.onTap,
    this.isCart = false,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: SahimedColors.background,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: SahimedColors.slate100),
            ),
            child: Icon(icon, color: SahimedColors.primary, size: 22),
          ),
          if (isCart)
            Positioned(
              top: -4,
              right: -4,
              child: Consumer<CartProvider>(
                builder: (context, cart, child) {
                  if (cart.items.isEmpty) return const SizedBox.shrink();
                  return Container(
                    padding: const EdgeInsets.all(4),
                    decoration: const BoxDecoration(
                      color: SahimedColors.accent,
                      shape: BoxShape.circle,
                    ),
                    constraints: const BoxConstraints(
                      minWidth: 16,
                      minHeight: 16,
                    ),
                    child: Text(
                      '${cart.items.length}',
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 9,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  );
                },
              ),
            ),
        ],
      ),
    );
  }
}
