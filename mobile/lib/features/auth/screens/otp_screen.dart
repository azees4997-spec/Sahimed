import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/services.dart';
import '../../../core/theme/colors.dart';
import '../../../core/layout/main_layout.dart';

class OtpScreen extends StatefulWidget {
  final String phoneNumber;
  final String verificationId;
  const OtpScreen({
    super.key, 
    required this.phoneNumber, 
    required this.verificationId,
  });

  @override
  State<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends State<OtpScreen> {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final List<TextEditingController> _controllers = List.generate(6, (_) => TextEditingController());
  final List<FocusNode> _focusNodes = List.generate(6, (_) => FocusNode());
  bool _isLoading = false;

  @override
  void dispose() {
    for (var controller in _controllers) {
      controller.dispose();
    }
    for (var node in _focusNodes) {
      node.dispose();
    }
    super.dispose();
  }

  Future<void> _verifyOtp() async {
    final code = _controllers.map((c) => c.text).join();
    if (code.length != 6) return;

    setState(() => _isLoading = true);

    try {
      await HapticFeedback.mediumImpact();
      PhoneAuthCredential credential = PhoneAuthProvider.credential(
        verificationId: widget.verificationId,
        smsCode: code,
      );

      await _auth.signInWithCredential(credential);

      if (mounted) {
        Navigator.pushAndRemoveUntil(
          context,
          MaterialPageRoute(builder: (context) => const MainLayout()), 
          (route) => false,
        );
      }
    } catch (e) {
      setState(() => _isLoading = false);
      _showError("Invalid or expired OTP code.");
    }
  }

  void _showError(String message) {
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(message, style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
          backgroundColor: SahimedColors.accent,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: SahimedColors.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: SahimedColors.primary),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Stack(
        children: [
          Positioned(
            top: -50,
            left: -50,
            child: _buildBlob(300, SahimedColors.accent.withOpacity(0.05)),
          ),
          
          SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 20),
                  Text('Verification', style: GoogleFonts.outfit(fontSize: 32, fontWeight: FontWeight.bold, color: const Color(0xFF0F172A))),
                  const SizedBox(height: 12),
                  Text(
                    'We\'ve sent a verification code to:',
                    style: GoogleFonts.inter(fontSize: 14, color: const Color(0xFF64748B)),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '+91 ${widget.phoneNumber}',
                    style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold, color: SahimedColors.primary),
                  ),
                  
                  const SizedBox(height: 48),

                  // OTP Input Card
                  Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(32),
                      boxShadow: [
                        BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 40, offset: const Offset(0, 10)),
                      ],
                    ),
                    child: Column(
                      children: [
                        Row(
                          children: List.generate(6, (index) {
                            return Expanded(
                              child: Container(
                                margin: EdgeInsets.only(right: index == 5 ? 0 : 8),
                                child: TextField(
                                  controller: _controllers[index],
                                  focusNode: _focusNodes[index],
                                  keyboardType: TextInputType.number,
                                  textAlign: TextAlign.center,
                                  maxLength: 1,
                                  style: GoogleFonts.outfit(fontSize: 22, fontWeight: FontWeight.w900, color: const Color(0xFF0F172A)),
                                  decoration: InputDecoration(
                                    counterText: '',
                                    filled: true,
                                    fillColor: const Color(0xFFF8FAFC),
                                    contentPadding: const EdgeInsets.symmetric(vertical: 16),
                                    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: Color(0xFFF1F5F9))),
                                    focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: SahimedColors.primary, width: 2)),
                                  ),
                                  onChanged: (value) {
                                    if (value.isNotEmpty && index < 5) {
                                      _focusNodes[index + 1].requestFocus();
                                    } else if (value.isEmpty && index > 0) {
                                      _focusNodes[index - 1].requestFocus();
                                    }
                                    
                                    if (index == 5 && value.isNotEmpty) {
                                      _verifyOtp();
                                    }
                                  },
                                ),
                              ),
                            );
                          }),
                        ),
                        const SizedBox(height: 32),
                        SizedBox(
                          width: double.infinity,
                          height: 60,
                          child: ElevatedButton(
                            onPressed: _isLoading ? null : _verifyOtp,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: SahimedColors.primary,
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                              elevation: 10,
                              shadowColor: SahimedColors.primary.withOpacity(0.3),
                            ),
                            child: _isLoading
                                ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                                : Text('VERIFY OTP', style: GoogleFonts.outfit(fontWeight: FontWeight.w900, fontSize: 16, letterSpacing: 2)),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 48),
                  
                  Center(
                    child: Column(
                      children: [
                        Text("Didn't receive the code?", style: GoogleFonts.inter(fontSize: 14, color: const Color(0xFF94A3B8))),
                        const SizedBox(height: 8),
                        TextButton(
                          onPressed: () {
                            // TODO: Implement Resend
                          },
                          child: Text(
                            "RESEND CODE",
                            style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.w900, color: SahimedColors.primary, letterSpacing: 1.5),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBlob(double size, Color color) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(color: color, shape: BoxShape.circle),
    );
  }
}
