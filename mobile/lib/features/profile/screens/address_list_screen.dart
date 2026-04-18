import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../core/theme/colors.dart';
import '../../../core/services/api_service.dart';
import 'address_form_screen.dart';

class AddressListScreen extends StatefulWidget {
  const AddressListScreen({super.key});

  @override
  State<AddressListScreen> createState() => _AddressListScreenState();
}

class _AddressListScreenState extends State<AddressListScreen> {
  final _apiService = ApiService();
  List<Map<String, dynamic>> _addresses = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadAddresses();
  }

  Future<void> _loadAddresses() async {
    setState(() => _isLoading = true);
    try {
      final addresses = await _apiService.getUserAddresses();
      setState(() => _addresses = addresses);
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error loading addresses: $e')));
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _deleteAddress(String id) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('DELETE ADDRESS?', style: GoogleFonts.outfit(fontWeight: FontWeight.w900, fontSize: 16)),
        content: Text('This action cannot be undone.', style: GoogleFonts.inter(fontSize: 13, color: SahimedColors.slate500)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: Text('CANCEL', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: SahimedColors.slate400))),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: Text('DELETE', style: GoogleFonts.outfit(fontWeight: FontWeight.w900, color: Colors.red))),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        await _apiService.deleteAddress(id);
        _loadAddresses();
      } catch (e) {
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Error deleting address')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(LucideIcons.arrowLeft, color: Color(0xFF0F172A)),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'SAVED ADDRESSES',
          style: GoogleFonts.outfit(fontWeight: FontWeight.w900, fontSize: 16, color: const Color(0xFF0F172A), letterSpacing: 1),
        ),
        actions: [
          IconButton(
            onPressed: () async {
              final result = await Navigator.push(context, MaterialPageRoute(builder: (context) => const AddressFormScreen()));
              if (result == true) _loadAddresses();
            },
            icon: const Icon(LucideIcons.plus, color: SahimedColors.primary),
          ),
        ],
      ),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator(color: SahimedColors.primary))
        : _addresses.isEmpty
          ? _buildEmptyState()
          : ListView.builder(
              padding: const EdgeInsets.all(20),
              itemCount: _addresses.length,
              itemBuilder: (ctx, i) {
                final addr = _addresses[i];
                return _buildAddressCard(addr);
              },
            ),
      bottomNavigationBar: _addresses.isEmpty ? null : Padding(
        padding: const EdgeInsets.all(20),
        child: SizedBox(
          width: double.infinity,
          height: 60,
          child: ElevatedButton.icon(
            onPressed: () async {
              final result = await Navigator.push(context, MaterialPageRoute(builder: (context) => const AddressFormScreen()));
              if (result == true) _loadAddresses();
            },
            icon: const Icon(LucideIcons.plus, size: 18),
            label: Text('ADD NEW ADDRESS', style: GoogleFonts.outfit(fontWeight: FontWeight.w900, fontSize: 13, letterSpacing: 1)),
            style: ElevatedButton.styleFrom(
              backgroundColor: SahimedColors.primary,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(32),
            decoration: BoxDecoration(color: Colors.white, shape: BoxShape.circle, boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 20)]),
            child: const Icon(LucideIcons.mapPin, size: 64, color: SahimedColors.slate200),
          ),
          const SizedBox(height: 24),
          Text('NO SAVED ADDRESSES', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w900, color: const Color(0xFF0F172A))),
          const SizedBox(height: 8),
          Text('Add your delivery locations for faster checkout', style: GoogleFonts.inter(fontSize: 13, color: SahimedColors.slate400)),
          const SizedBox(height: 32),
          ElevatedButton(
            onPressed: () async {
              final result = await Navigator.push(context, MaterialPageRoute(builder: (context) => const AddressFormScreen()));
              if (result == true) _loadAddresses();
            },
            style: ElevatedButton.styleFrom(backgroundColor: SahimedColors.primary, foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 20), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30))),
            child: Text('ADD ADDRESS', style: GoogleFonts.outfit(fontWeight: FontWeight.w900, fontSize: 13, letterSpacing: 1)),
          ),
        ],
      ),
    );
  }

  Widget _buildAddressCard(Map<String, dynamic> addr) {
    IconData icon = LucideIcons.house;
    Color color = const Color(0xFFEEF2FF);
    Color iconColor = const Color(0xFF4338CA);

    if (addr['tag'] == 'Office') {
      icon = LucideIcons.briefcase;
      color = const Color(0xFFF0FDF4);
      iconColor = const Color(0xFF16A34A);
    } else if (addr['tag'] == 'Other') {
      icon = LucideIcons.ellipsis;
      color = const Color(0xFFFEF2F2);
      iconColor = const Color(0xFFEF4444);
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(28), boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 20, offset: const Offset(0, 8))]),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(20),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(16)),
                  child: Icon(icon, color: iconColor, size: 24),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text((addr['tag'] ?? 'HOME').toUpperCase(), style: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.w900, color: SahimedColors.primary, letterSpacing: 1.5)),
                          const Icon(LucideIcons.check, color: SahimedColors.emerald500, size: 16),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(addr['patientName'] ?? 'Unnamed', style: GoogleFonts.outfit(fontSize: 15, fontWeight: FontWeight.bold, color: const Color(0xFF0F172A))),
                      const SizedBox(height: 4),
                      Text('${addr['houseNumber']}, ${addr['street']}', style: GoogleFonts.inter(fontSize: 13, color: SahimedColors.slate500, height: 1.4)),
                      Text('${addr['city']}, ${addr['state']} - ${addr['pincode']}', style: GoogleFonts.inter(fontSize: 12, color: SahimedColors.slate400, fontWeight: FontWeight.w500)),
                    ],
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            decoration: const BoxDecoration(color: Color(0xFFF8FAFC), borderRadius: BorderRadius.vertical(bottom: Radius.circular(28))),
            child: Row(
              children: [
                const Icon(LucideIcons.phone, size: 14, color: SahimedColors.slate400),
                const SizedBox(width: 8),
                Text(addr['phoneNumber'] ?? '', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.bold, color: SahimedColors.slate500)),
                const Spacer(),
                TextButton.icon(
                  onPressed: () async {
                    final result = await Navigator.push(context, MaterialPageRoute(builder: (context) => AddressFormScreen(initialAddress: addr)));
                    if (result == true) _loadAddresses();
                  },
                  icon: const Icon(LucideIcons.pencil, size: 14),
                  label: Text('EDIT', style: GoogleFonts.outfit(fontWeight: FontWeight.w900, fontSize: 10, letterSpacing: 1)),
                ),
                TextButton.icon(
                  onPressed: () => _deleteAddress(addr['id']!),
                  icon: const Icon(LucideIcons.trash2, size: 14, color: Colors.red),
                  label: Text('REMOVE', style: GoogleFonts.outfit(fontWeight: FontWeight.w900, fontSize: 10, color: Colors.red, letterSpacing: 1)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
