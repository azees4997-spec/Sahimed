import 'dart:io';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:file_picker/file_picker.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:lottie/lottie.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/theme/colors.dart';
import '../../../core/services/api_service.dart';

class PrescriptionScreen extends StatefulWidget {
  const PrescriptionScreen({super.key});

  @override
  State<PrescriptionScreen> createState() => _PrescriptionScreenState();
}

class _PrescriptionScreenState extends State<PrescriptionScreen> {
  final ApiService _apiService = ApiService();
  final List<File> _selectedFiles = [];
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _notesController = TextEditingController();
  bool _isUploading = false;
  bool _isSuccess = false;

  Future<void> _pickFiles() async {
    final result = await FilePicker.platform.pickFiles(
      allowMultiple: true,
      type: FileType.custom,
      allowedExtensions: ['jpg', 'jpeg', 'png', 'pdf'],
    );

    if (result != null) {
      setState(() {
        _selectedFiles.addAll(result.paths.where((path) => path != null).map((path) => File(path!)));
      });
    }
  }

  void _removeFile(int index) {
    setState(() => _selectedFiles.removeAt(index));
  }

  Future<void> _submitRequest() async {
    if (_selectedFiles.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select at least one prescription')),
      );
      return;
    }

    setState(() => _isUploading = true);

    try {
      final List<String> imageUrls = [];
      for (var file in _selectedFiles) {
        final url = await _apiService.uploadPrescription(file);
        if (url != null) imageUrls.add(url);
      }

      final success = await _apiService.submitPrescription(
        imageUrls: imageUrls,
        patientName: _nameController.text.isEmpty ? 'Self' : _nameController.text,
        notes: _notesController.text,
      );

      if (success && mounted) {
        setState(() {
          _isUploading = false;
          _isSuccess = true;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isUploading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Submission failed: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isSuccess) return _buildSuccessState();

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(LucideIcons.arrowLeft, color: Colors.black),
          onPressed: () => Navigator.pop(context),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'PRESCRIPTION UPLOAD',
              style: GoogleFonts.outfit(
                fontSize: 18,
                fontWeight: FontWeight.w900,
                color: Colors.black,
                letterSpacing: -0.5,
              ),
            ),
            Text(
              'QUICK ORDER SYSTEM',
              style: GoogleFonts.outfit(
                fontSize: 10,
                fontWeight: FontWeight.w800,
                color: SahimedColors.primary,
                letterSpacing: 1.2,
              ),
            ),
          ],
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Upload Area
            GestureDetector(
              onTap: _pickFiles,
              child: Container(
                width: double.infinity,
                height: 240,
                decoration: BoxDecoration(
                  color: _selectedFiles.isEmpty ? Colors.white : Colors.slate[900]?.withOpacity(0.05),
                  borderRadius: BorderRadius.circular(40),
                  border: _selectedFiles.isEmpty 
                    ? Border.all(color: Colors.grey[200]!, width: 2, style: BorderStyle.solid)
                    : null,
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    if (_selectedFiles.isEmpty) ...[
                      Container(
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          color: SahimedColors.primary.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(32),
                        ),
                        child: Icon(LucideIcons.camera, color: SahimedColors.primary, size: 32),
                      ).animate().scale(delay: 200.ms),
                      const SizedBox(height: 16),
                      Text(
                        'Upload Prescription',
                        style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w800),
                      ),
                      Text(
                        'IMAGE, PDF UP TO 5MB',
                        style: GoogleFonts.outfit(fontSize: 10, color: Colors.grey, fontWeight: FontWeight.w900, letterSpacing: 1),
                      ),
                    ] else ...[
                      Icon(LucideIcons.clipboardCheck, color: SahimedColors.success, size: 40),
                      const SizedBox(height: 12),
                      Text(
                        '${_selectedFiles.length} FILES SELECTED',
                        style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w900),
                      ),
                      TextButton.icon(
                        onPressed: _pickFiles,
                        icon: const Icon(LucideIcons.plus, size: 16),
                        label: const Text('ADD MORE'),
                      ),
                    ],
                  ],
                ),
              ),
            ).animate().fadeIn(duration: 600.ms),

            if (_selectedFiles.isNotEmpty) ...[
              const SizedBox(height: 16),
              SizedBox(
                height: 110,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  itemCount: _selectedFiles.length,
                  itemBuilder: (context, index) {
                    final isPdf = _selectedFiles[index].path.toLowerCase().endsWith('.pdf');
                    return Container(
                      width: 90,
                      margin: const EdgeInsets.only(right: 12),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(20),
                        color: Colors.white,
                        border: Border.all(color: Colors.grey[100]!),
                      ),
                      child: Stack(
                        children: [
                          Center(
                            child: isPdf 
                              ? Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    const Icon(LucideIcons.fileText, color: Colors.red, size: 30),
                                    Text('PDF', style: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.w900)),
                                  ],
                                )
                              : ClipRRect(
                                  borderRadius: BorderRadius.circular(20),
                                  child: Image.file(_selectedFiles[index], fit: BoxFit.cover, width: double.infinity, height: double.infinity),
                                ),
                          ),
                          Positioned(
                            top: 4,
                            right: 4,
                            child: GestureDetector(
                              onTap: () => _removeFile(index),
                              child: Container(
                                padding: const EdgeInsets.all(4),
                                decoration: const BoxDecoration(color: Colors.red, shape: BoxShape.circle),
                                child: const Icon(LucideIcons.x, color: Colors.white, size: 12),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ).animate().scale(delay: (index * 100).ms);
                  },
                ),
              ),
            ],

            const SizedBox(height: 32),

            // Form Fields
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(40),
                boxShadow: [
                  BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 20, offset: const Offset(0, 10)),
                ],
              ),
              child: Column(
                children: [
                  _buildFieldHeader(LucideIcons.user, 'ORDERING FOR (PATIENT NAME)'),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _nameController,
                    decoration: _inputDecoration('e.g. Self or Family Member Name'),
                    style: GoogleFonts.outfit(fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 24),
                  _buildFieldHeader(LucideIcons.fileText, 'ORDER NOTES'),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _notesController,
                    maxLines: 4,
                    decoration: _inputDecoration('Any specific requirements...'),
                    style: GoogleFonts.outfit(fontWeight: FontWeight.w700),
                  ),
                ],
              ),
            ).animate().slideY(begin: 0.1, duration: 600.ms),

            const SizedBox(height: 32),

            // Submit Button
            SizedBox(
              width: double.infinity,
              height: 70,
              child: ElevatedButton(
                onPressed: _isUploading ? null : _submitRequest,
                style: ElevatedButton.styleFrom(
                  backgroundColor: SahimedColors.primary,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(35)),
                  elevation: 10,
                  shadowColor: SahimedColors.primary.withOpacity(0.4),
                ),
                child: _isUploading 
                  ? const CircularProgressIndicator(color: Colors.white)
                  : Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(LucideIcons.clipboardCheck),
                        const SizedBox(width: 12),
                        Text(
                          'SUBMIT ORDER REQUEST',
                          style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w900, letterSpacing: 0.5),
                        ),
                      ],
                    ),
              ),
            ).animate(
              adapter: ValueAdapter(_isUploading ? 0.0 : 1.0),
              onPlay: (controller) => controller.repeat(reverse: true),
            ).scale(
              begin: const Offset(1, 1),
              end: const Offset(0.98, 0.98),
              duration: 1.seconds,
              curve: Curves.easeInOut,
              when: _isUploading,
            ),
            
            const SizedBox(height: 20),
            Center(
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(LucideIcons.shieldCheck, color: SahimedColors.success, size: 16),
                  const SizedBox(width: 8),
                  Text(
                    '100% SECURE & RELIABLE',
                    style: GoogleFonts.outfit(fontSize: 10, color: Colors.grey, fontWeight: FontWeight.w900, letterSpacing: 2),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFieldHeader(IconData icon, String label) {
    return Row(
      children: [
        Icon(icon, size: 14, color: SahimedColors.primary),
        const SizedBox(width: 8),
        Text(
          label,
          style: GoogleFonts.outfit(fontSize: 10, color: Colors.grey, fontWeight: FontWeight.w900, letterSpacing: 1),
        ),
      ],
    );
  }

  InputDecoration _inputDecoration(String hint) {
    return InputDecoration(
      hintText: hint,
      hintStyle: GoogleFonts.outfit(color: Colors.grey[400], fontWeight: FontWeight.w500),
      filled: true,
      fillColor: const Color(0xFFF8FAFC),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(20), borderSide: BorderSide.none),
      contentPadding: const EdgeInsets.all(20),
    );
  }

  Widget _buildSuccessState() {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(LucideIcons.checkCircle2, color: SahimedColors.success, size: 80)
                .animate()
                .scale(duration: 600.ms, curve: Curves.elasticOut),
              const SizedBox(height: 24),
              Text(
                'REQUEST SENT',
                style: GoogleFonts.outfit(fontSize: 32, fontWeight: FontWeight.w900, letterSpacing: -1),
              ),
              const SizedBox(height: 8),
              Text(
                'We have received your prescription.\nOur team is reviewing it now.',
                textAlign: TextAlign.center,
                style: GoogleFonts.outfit(fontSize: 16, color: Colors.grey, fontWeight: FontWeight.w500),
              ),
              const SizedBox(height: 48),
              SizedBox(
                width: double.infinity,
                height: 60,
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(context),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: SahimedColors.primary,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
                  ),
                  child: Text('RETURN HOME', style: GoogleFonts.outfit(fontWeight: FontWeight.w900, color: Colors.white)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
