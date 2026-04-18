import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:intl/intl.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../core/theme/colors.dart';
import '../../../core/services/api_service.dart';
import '../../home/screens/prescription_screen.dart';

class HealthVaultScreen extends StatefulWidget {
  const HealthVaultScreen({super.key});

  @override
  State<HealthVaultScreen> createState() => _HealthVaultScreenState();
}

class _HealthVaultScreenState extends State<HealthVaultScreen> {
  final ApiService _apiService = ApiService();
  List<Map<String, dynamic>> _prescriptions = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadPrescriptions();
  }

  Future<void> _loadPrescriptions() async {
    final prescriptions = await _apiService.getUserPrescriptions();
    if (mounted) {
      setState(() {
        _prescriptions = prescriptions;
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(LucideIcons.arrowLeft, color: Colors.black),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'HEALTH VAULT',
          style: GoogleFonts.outfit(
            fontSize: 20,
            fontWeight: FontWeight.w900,
            color: Colors.black,
            letterSpacing: -0.5,
          ),
        ),
        actions: [
          IconButton(
            onPressed: () {
              Navigator.push(
                context, 
                MaterialPageRoute(builder: (context) => const PrescriptionScreen())
              ).then((_) => _loadPrescriptions());
            },
            icon: const Icon(LucideIcons.circlePlus, color: SahimedColors.primary),
          ),
        ],
      ),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator()) 
        : _prescriptions.isEmpty 
          ? _buildEmptyState() 
          : _buildPrescriptionList(),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(color: SahimedColors.primary.withOpacity(0.1), blurRadius: 40),
                ],
              ),
              child: Icon(LucideIcons.folder, size: 64, color: Colors.grey[300]),
            ),
            const SizedBox(height: 24),
            Text(
              'No Prescriptions Yet',
              style: GoogleFonts.outfit(fontSize: 24, fontWeight: FontWeight.w900),
            ),
            const SizedBox(height: 8),
            Text(
              'Upload your medicinal documents to keep them safe and accessible.',
              textAlign: TextAlign.center,
              style: GoogleFonts.outfit(fontSize: 14, color: Colors.grey, fontWeight: FontWeight.w500),
            ),
            const SizedBox(height: 32),
            ElevatedButton(
              onPressed: () {
                Navigator.push(
                  context, 
                  MaterialPageRoute(builder: (context) => const PrescriptionScreen())
                ).then((_) => _loadPrescriptions());
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: SahimedColors.primary,
                padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
              ),
              child: Text(
                'UPLOAD NOW', 
                style: GoogleFonts.outfit(fontWeight: FontWeight.w900, color: Colors.white),
              ),
            ),
          ],
        ),
      ).animate().fadeIn(),
    );
  }

  Widget _buildPrescriptionList() {
    return ListView.builder(
      padding: const EdgeInsets.all(20),
      itemCount: _prescriptions.length,
      itemBuilder: (context, index) {
        final rx = _prescriptions[index];
        final dynamic uploadDate = rx['uploadDate'];
        String formattedDate = 'Unknown Date';
        if (uploadDate != null) {
          try {
            if (uploadDate is String) {
              formattedDate = DateFormat('dd MMM yyyy').format(DateTime.parse(uploadDate));
            } else if (uploadDate is DateTime) {
              formattedDate = DateFormat('dd MMM yyyy').format(uploadDate);
            } else if (uploadDate.runtimeType.toString().contains('Timestamp')) {
              formattedDate = DateFormat('dd MMM yyyy').format(uploadDate.toDate());
            }
          } catch (e) {
            debugPrint('Error parsing date: $e');
          }
        }
        final status = rx['status'] ?? 'Pending';
        final isPdf = (rx['imageUrl'] ?? '').toLowerCase().contains('.pdf');
        
        return Container(
          margin: const EdgeInsets.only(bottom: 16),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(24),
            boxShadow: [
              BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10, offset: const Offset(0, 5)),
            ],
          ),
          child: Row(
            children: [
              // Thumbnail/Icon
              Container(
                width: 70,
                height: 70,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  color: Colors.grey[50],
                ),
                child: isPdf 
                  ? const Icon(LucideIcons.fileText, color: Colors.red, size: 32)
                  : ClipRRect(
                      borderRadius: BorderRadius.circular(16),
                      child: CachedNetworkImage(
                        imageUrl: rx['imageUrl'] ?? '',
                        fit: BoxFit.cover,
                        placeholder: (context, url) => Container(color: Colors.grey[100]),
                        errorWidget: (context, url, error) => const Icon(LucideIcons.image, color: Colors.grey),
                      ),
                    ),
              ),
              const SizedBox(width: 16),
              // Info
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      rx['patientName'] ?? 'Self',
                      style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w900),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      formattedDate,
                      style: GoogleFonts.outfit(fontSize: 12, color: Colors.grey, fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: _getStatusColor(status).withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        status.toUpperCase(),
                        style: GoogleFonts.outfit(
                          fontSize: 9, 
                          fontWeight: FontWeight.w900, 
                          color: _getStatusColor(status),
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const Icon(LucideIcons.chevronRight, color: Colors.grey, size: 20),
            ],
          ),
        ).animate().slideX(begin: 0.1, delay: (index * 50).ms);
      },
    );
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'pending review':
      case 'pending':
        return SahimedColors.primary;
      case 'verified':
      case 'completed':
        return SahimedColors.success;
      case 'rejected':
      case 'cancelled':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }
}
