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

class HomeHeader extends StatefulWidget {
  const HomeHeader({super.key});

  @override
  State<HomeHeader> createState() => _HomeHeaderState();
}

class _HomeHeaderState extends State<HomeHeader> {
  String _currentAddress = 'Loading...';
  final LocationService _locationService = LocationService();
  bool _isCheckingPincode = false;
  bool? _isServiceable;

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
      _checkAddressServiceability(address);
    }
  }

  Future<void> _checkAddressServiceability(String address) async {
    // Attempt to find a 6-digit pincode in the address string
    final RegExp pincodeRegex = RegExp(r'\b\d{6}\b');
    final match = pincodeRegex.firstMatch(address);
    
    if (match != null) {
      final pincode = match.group(0);
      if (pincode != null) {
        final shipway = await ApiService().getShipwayServiceability(pincode);
        if (mounted) {
          setState(() => _isServiceable = shipway?['serviceable'] == true);
        }
        return;
      }
    }
    
    // If no pincode found, we might still be serviceable if we have a city
    // but for now, we'll leave it as null (unknown) to avoid false positives
    if (mounted) setState(() => _isServiceable = null);
  }


  // Address form controllers
  final _houseController = TextEditingController();
  final _streetController = TextEditingController();
  final _cityController = TextEditingController();
  final _pincodeController = TextEditingController();
  String _selectedTag = 'Home';
  bool _isAddingAddress = false;

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
            bottom: MediaQuery.of(context).viewInsets.bottom + 32,
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
              if (!_isAddingAddress) ...[
                // Simplified view: Only show saved addresses + Add New trigger
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
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
                          'Delivery Area',
                          style: GoogleFonts.outfit(
                            fontSize: 18,
                            fontWeight: FontWeight.w900,
                            color: const Color(0xFF0F172A),
                          ),
                        ),
                      ],
                    ),
                    TextButton(
                      onPressed: () => setStateSheet(() => _isAddingAddress = true),
                      child: Text(
                        'ADD NEW +',
                        style: GoogleFonts.outfit(
                          fontSize: 10,
                          fontWeight: FontWeight.w900,
                          color: SahimedColors.primary,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                
                // Saved Addresses Section
                FutureBuilder<List<Map<String, dynamic>>>(
                  future: ApiService().getUserAddresses(),
                  builder: (context, snapshot) {
                    if (snapshot.connectionState == ConnectionState.waiting) {
                      return const Center(child: Padding(padding: EdgeInsets.all(20), child: CircularProgressIndicator()));
                    }
                    
                    final addresses = snapshot.data ?? [];
                    if (addresses.isEmpty) {
                      return Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(24),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.circular(24),
                        ),
                        child: Column(
                          children: [
                            const Icon(LucideIcons.map, color: Color(0xFFCBD5E1), size: 32),
                            const SizedBox(height: 12),
                            Text(
                              'No saved addresses yet',
                              style: GoogleFonts.outfit(
                                fontSize: 12,
                                color: const Color(0xFF64748B),
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                            TextButton(
                              onPressed: () => setStateSheet(() => _isAddingAddress = true),
                              child: Text('CREATE ONE NOW', style: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.w900, color: SahimedColors.primary)),
                            ),
                          ],
                        ),
                      );
                    }

                    return Container(
                      constraints: const BoxConstraints(maxHeight: 280),
                      child: ListView.separated(
                        shrinkWrap: true,
                        itemCount: addresses.length,
                        separatorBuilder: (_, _) => const SizedBox(height: 10),
                        itemBuilder: (context, index) {
                          final addr = addresses[index];
                          return GestureDetector(
                            onTap: () {
                              final formatted = '${addr['houseNumber']}, ${addr['street']}, ${addr['city']}';
                              if (mounted) {
                                setState(() => _currentAddress = formatted);
                                _checkAddressServiceability(formatted);
                              }
                              Navigator.pop(context);
                            },
                            child: Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: const Color(0xFFF8FAFC),
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(color: const Color(0xFFF1F5F9)),
                              ),
                              child: Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.all(8),
                                    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(10)),
                                    child: const Icon(LucideIcons.house, size: 16, color: SahimedColors.primary),
                                  ),
                                  const SizedBox(width: 16),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          (addr['tag'] ?? 'Address').toString().toUpperCase(),
                                          style: GoogleFonts.outfit(fontSize: 11, fontWeight: FontWeight.w900, color: const Color(0xFF0F172A)),
                                        ),
                                        Text(
                                          '${addr['houseNumber']}, ${addr['street']}, ${addr['city']}',
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                          style: GoogleFonts.outfit(fontSize: 10, color: const Color(0xFF64748B), fontWeight: FontWeight.w600),
                                        ),
                                      ],
                                    ),
                                  ),
                                  const Icon(LucideIcons.chevronRight, size: 16, color: Color(0xFFCBD5E1)),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    );
                  },
                ),
              ] else ...[
                // Add Address Form View
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    IconButton(
                      onPressed: () => setStateSheet(() => _isAddingAddress = false),
                      icon: const Icon(LucideIcons.arrowLeft, size: 20),
                    ),
                    Text(
                      'NEW ADDRESS',
                      style: GoogleFonts.outfit(
                        fontSize: 16,
                        fontWeight: FontWeight.w900,
                        color: const Color(0xFF0F172A),
                      ),
                    ),
                    const SizedBox(width: 48), // Spacer to center title
                  ],
                ),
                const SizedBox(height: 24),
                // Compact Use Current Location Button inside Form
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    onPressed: _isCheckingPincode ? null : () async {
                      setStateSheet(() => _isCheckingPincode = true);
                      try {
                        final pos = await _locationService.getCurrentPosition();
                        if (pos != null) {
                          final address = await _locationService.getAddressFromLatLng(pos.latitude, pos.longitude);
                          setStateSheet(() {
                            _houseController.text = address['suburb'] ?? address['neighbourhood'] ?? '';
                            _streetController.text = address['street'] ?? '';
                            _cityController.text = address['city'] ?? '';
                            _pincodeController.text = address['pincode'] ?? '';
                            _isCheckingPincode = false;
                          });
                        } else {
                          setStateSheet(() => _isCheckingPincode = false);
                        }
                      } catch (e) {
                        setStateSheet(() => _isCheckingPincode = false);
                        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to detect location')));
                      }
                    },
                    icon: const Icon(LucideIcons.locateFixed, size: 16),
                    label: Text(
                      'USE CURRENT LOCATION',
                      style: GoogleFonts.outfit(fontWeight: FontWeight.w900, fontSize: 10, letterSpacing: 1),
                    ),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: SahimedColors.primary,
                      side: const BorderSide(color: SahimedColors.primary, width: 2),
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                _buildField(controller: _houseController, hint: 'House / Flat / Block No.'),
                const SizedBox(height: 12),
                _buildField(controller: _streetController, hint: 'Street / Area Name'),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(child: _buildField(controller: _cityController, hint: 'City')),
                    const SizedBox(width: 12),
                    Expanded(child: _buildField(controller: _pincodeController, hint: 'Pincode', isNum: true)),
                  ],
                ),
                const SizedBox(height: 20),
                Row(
                  children: ['Home', 'Office', 'Other'].map((tag) => Expanded(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 4),
                      child: GestureDetector(
                        onTap: () => setStateSheet(() => _selectedTag = tag),
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          decoration: BoxDecoration(
                            color: _selectedTag == tag ? SahimedColors.primary : Colors.white,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: _selectedTag == tag ? SahimedColors.primary : const Color(0xFFF1F5F9)),
                          ),
                          child: Center(
                            child: Text(
                              tag.toUpperCase(),
                              style: GoogleFonts.outfit(
                                fontSize: 9,
                                fontWeight: FontWeight.w900,
                                color: _selectedTag == tag ? Colors.white : const Color(0xFF64748B),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  )).toList(),
                ),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _isCheckingPincode ? null : () async {
                      if (_houseController.text.isEmpty || _pincodeController.text.length != 6) {
                        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please enter valid address details')));
                        return;
                      }
                      setStateSheet(() => _isCheckingPincode = true);
                      final success = await ApiService().saveAddress({
                        'houseNumber': _houseController.text,
                        'street': _streetController.text,
                        'city': _cityController.text,
                        'pincode': _pincodeController.text,
                        'tag': _selectedTag,
                        'isDefault': true,
                      });
                      if (success) {
                        final formatted = '${_houseController.text}, ${_streetController.text}, ${_cityController.text}';
                        setState(() {
                          _currentAddress = formatted;
                          _isCheckingPincode = false;
                          _isAddingAddress = false;
                        });
                        Navigator.pop(context);
                      } else {
                        setStateSheet(() => _isCheckingPincode = false);
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: SahimedColors.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 20),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                    ),
                    child: _isCheckingPincode 
                      ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : Text('SAVE & DELIVER', style: GoogleFonts.outfit(fontWeight: FontWeight.w900)),
                  ),
                ),
              ],
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

  Widget _buildField({required TextEditingController controller, required String hint, bool isNum = false}) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFF1F5F9)),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: TextField(
        controller: controller,
        keyboardType: isNum ? TextInputType.number : TextInputType.text,
        style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.bold),
        decoration: InputDecoration(
          hintText: hint,
          border: InputBorder.none,
          hintStyle: GoogleFonts.outfit(fontSize: 14, color: const Color(0xFF94A3B8)),
        ),
      ),
    );
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
                          if (_isServiceable != null) ...[
                            const SizedBox(width: 4),
                            Icon(
                              _isServiceable! ? Icons.check_circle_rounded : Icons.cancel_rounded,
                              size: 10,
                              color: _isServiceable! ? SahimedColors.success : SahimedColors.accent,
                            ),
                          ],
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
