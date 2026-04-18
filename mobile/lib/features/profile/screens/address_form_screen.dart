import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons_flutter.dart';
import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart';
import '../../../core/theme/colors.dart';
import '../../../core/services/api_service.dart';

class AddressFormScreen extends StatefulWidget {
  final Map<String, dynamic>? initialAddress;
  const AddressFormScreen({super.key, this.initialAddress});

  @override
  State<AddressFormScreen> createState() => _AddressFormScreenState();
}

class _AddressFormScreenState extends State<AddressFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _apiService = ApiService();
  bool _isLoading = false;
  bool _isLocating = false;

  late TextEditingController _nameController;
  late TextEditingController _phoneController;
  late TextEditingController _houseController;
  late TextEditingController _apartmentController;
  late TextEditingController _streetController;
  late TextEditingController _landmarkController;
  late TextEditingController _cityController;
  late TextEditingController _stateController;
  late TextEditingController _pincodeController;
  String _selectedTag = 'Home';

  @override
  void initState() {
    super.initState();
    final addr = widget.initialAddress;
    _nameController = TextEditingController(text: addr?['patientName'] ?? '');
    _phoneController = TextEditingController(text: addr?['phoneNumber'] ?? '');
    _houseController = TextEditingController(text: addr?['houseNumber'] ?? '');
    _apartmentController = TextEditingController(text: addr?['apartmentName'] ?? '');
    _streetController = TextEditingController(text: addr?['street'] ?? '');
    _landmarkController = TextEditingController(text: addr?['landmark'] ?? '');
    _cityController = TextEditingController(text: addr?['city'] ?? '');
    _stateController = TextEditingController(text: addr?['state'] ?? '');
    _pincodeController = TextEditingController(text: addr?['pincode'] ?? '');
    _selectedTag = addr?['tag'] ?? 'Home';
  }

  Future<void> _getCurrentLocation() async {
    setState(() => _isLocating = true);
    try {
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }

      if (permission == LocationPermission.whileInUse || permission == LocationPermission.always) {
        Position position = await Geolocator.getCurrentPosition();
        List<Placemark> placemarks = await placemarkFromCoordinates(position.latitude, position.longitude);
        
        if (placemarks.isNotEmpty) {
          Placemark place = placemarks[0];
          setState(() {
            _streetController.text = place.subLocality ?? place.name ?? '';
            _cityController.text = place.locality ?? '';
            _stateController.text = place.administrativeArea ?? '';
            _pincodeController.text = place.postalCode ?? '';
          });
        }
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Could not fetch location')));
    } finally {
      setState(() => _isLocating = false);
    }
  }

  Future<void> _saveAddress() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);
    try {
      final addressData = {
        'id': widget.initialAddress?['id'],
        'patientName': _nameController.text,
        'phoneNumber': _phoneController.text,
        'houseNumber': _houseController.text,
        'apartmentName': _apartmentController.text,
        'street': _streetController.text,
        'landmark': _landmarkController.text,
        'city': _cityController.text,
        'state': _stateController.text,
        'pincode': _pincodeController.text,
        'tag': _selectedTag,
      };

      await _apiService.saveAddress(addressData);
      if (mounted) Navigator.pop(context, true);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error saving address: $e')));
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(LucideIcons.arrowLeft, color: Color(0xFF0F172A)),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          widget.initialAddress == null ? 'ADD NEW ADDRESS' : 'EDIT ADDRESS',
          style: GoogleFonts.outfit(fontWeight: FontWeight.w900, fontSize: 16, color: const Color(0xFF0F172A), letterSpacing: 1),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('SAVE AS', style: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.w900, color: SahimedColors.slate400, letterSpacing: 2)),
              const SizedBox(height: 12),
              Row(
                children: [
                  _buildTagOption('Home', LucideIcons.home),
                  const SizedBox(width: 12),
                  _buildTagOption('Office', LucideIcons.briefcase),
                  const SizedBox(width: 12),
                  _buildTagOption('Other', LucideIcons.moreHorizontal),
                ],
              ),
              const SizedBox(height: 32),
              
              ElevatedButton.icon(
                onPressed: _isLocating ? null : _getCurrentLocation,
                icon: _isLocating ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: SahimedColors.primary)) : const Icon(LucideIcons.locateFixed, size: 18),
                label: Text('USE CURRENT LOCATION', style: GoogleFonts.outfit(fontWeight: FontWeight.w900, fontSize: 11, letterSpacing: 1)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: SahimedColors.primary.withOpacity(0.05),
                  foregroundColor: SahimedColors.primary,
                  elevation: 0,
                  minimumSize: const Size(double.infinity, 56),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), border: BorderSide(color: SahimedColors.primary.withOpacity(0.1))),
                ),
              ),
              const SizedBox(height: 32),

              _buildTextField(controller: _nameController, label: 'RECEIVER NAME', hint: 'Full Name', icon: LucideIcons.user),
              const SizedBox(height: 20),
              _buildTextField(controller: _phoneController, label: 'MOBILE NUMBER', hint: '10-digit mobile', icon: LucideIcons.phone, keyboardType: TextInputType.phone),
              const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(child: _buildTextField(controller: _houseController, label: 'HOUSE / FLAT NO', hint: 'Flat 101', icon: LucideIcons.hash)),
                  const SizedBox(width: 16),
                  Expanded(child: _buildTextField(controller: _apartmentController, label: 'APARTMENT', hint: 'Building Name', icon: LucideIcons.building2)),
                ],
              ),
              const SizedBox(height: 20),
              _buildTextField(controller: _streetController, label: 'STREET / LOCALITY', hint: 'Area Name', icon: LucideIcons.mapPin),
              const SizedBox(height: 20),
              _buildTextField(controller: _landmarkController, label: 'LANDMARK', hint: 'Near by...', icon: LucideIcons.info),
              const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(child: _buildTextField(controller: _cityController, label: 'CITY', hint: 'City', icon: LucideIcons.mapPin)),
                  const SizedBox(width: 16),
                  Expanded(child: _buildTextField(controller: _pincodeController, label: 'PINCODE', hint: '6-digit', icon: LucideIcons.hash, keyboardType: TextInputType.number)),
                ],
              ),

              const SizedBox(height: 48),
              SizedBox(
                width: double.infinity,
                height: 64,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _saveAddress,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: SahimedColors.primary,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(32)),
                    elevation: 10,
                    shadowColor: SahimedColors.primary.withOpacity(0.4),
                  ),
                  child: _isLoading 
                    ? const CircularProgressIndicator(color: Colors.white)
                    : Text('CONFIRM ADDRESS', style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.w900, letterSpacing: 1.5)),
                ),
              ),
              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTagOption(String tag, IconData icon) {
    bool isSelected = _selectedTag == tag;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _selectedTag = tag),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: BoxDecoration(
            color: isSelected ? SahimedColors.primary : Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: isSelected ? SahimedColors.primary : SahimedColors.slate200, width: 1.5),
            boxShadow: isSelected ? [BoxShadow(color: SahimedColors.primary.withOpacity(0.2), blurRadius: 10, offset: const Offset(0, 4))] : [],
          ),
          child: Column(
            children: [
              Icon(icon, size: 20, color: isSelected ? Colors.white : SahimedColors.slate400),
              const SizedBox(height: 6),
              Text(tag.toUpperCase(), style: GoogleFonts.outfit(fontSize: 9, fontWeight: FontWeight.w900, color: isSelected ? Colors.white : SahimedColors.slate400, letterSpacing: 1)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required String hint,
    required IconData icon,
    TextInputType? keyboardType,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, mb: 8),
          child: Text(label, style: GoogleFonts.outfit(fontSize: 9, fontWeight: FontWeight.w900, color: SahimedColors.slate400, letterSpacing: 1.5)),
        ),
        TextFormField(
          controller: controller,
          keyboardType: keyboardType,
          style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.w700, color: const Color(0xFF0F172A)),
          decoration: InputDecoration(
            hintText: hint.toUpperCase(),
            hintStyle: GoogleFonts.outfit(color: SahimedColors.slate300, fontSize: 11, fontWeight: FontWeight.w500, letterSpacing: 1),
            prefixIcon: Icon(icon, size: 18, color: SahimedColors.primary.withOpacity(0.3)),
            filled: true,
            fillColor: const Color(0xFFF8FAFC),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: SahimedColors.primary, width: 1.5)),
            errorStyle: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.bold),
          ),
          validator: (val) => (val == null || val.isEmpty) ? 'REQUIRED' : null,
        ),
      ],
    );
  }
}
