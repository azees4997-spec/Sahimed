import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../../core/theme/colors.dart';
import '../../../core/layout/main_layout.dart';
import 'otp_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final TextEditingController _phoneController = TextEditingController();

  bool _agreedToTerms = false;
  bool _isLoading = false;

  @override
  void dispose() {
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _sendOtp() async {
    if (!_agreedToTerms) {
      _showError("Please agree to the Terms & Conditions first");
      return;
    }

    final phone = _phoneController.text.trim();
    if (phone.length != 10) {
      _showError("Please enter a valid 10-digit mobile number");
      return;
    }

    setState(() => _isLoading = true);
    try {
      await _auth.verifyPhoneNumber(
        phoneNumber: '+91$phone',
        verificationCompleted: (PhoneAuthCredential credential) async {
          await _auth.signInWithCredential(credential);
          _navigateToHome();
        },
        verificationFailed: (FirebaseAuthException e) {
          setState(() => _isLoading = false);
          _showError("Auth Error: ${e.message}");
        },
        codeSent: (String verificationId, int? resendToken) {
          if (!mounted) return;
          setState(() => _isLoading = false);
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) =>
                  OtpScreen(phoneNumber: phone, verificationId: verificationId),
            ),
          );
        },
        codeAutoRetrievalTimeout: (String verificationId) {},
      );
    } catch (e) {
      setState(() => _isLoading = false);
      _showError("Error: $e");
    }
  }

  void _navigateToHome() {
    if (mounted) {
      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (context) => const MainLayout()),
        (route) => false,
      );
    }
  }

  void _showError(String message) {
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            message,
            style: GoogleFonts.inter(fontWeight: FontWeight.w600),
          ),
          backgroundColor: SahimedColors.accent,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: SahimedColors.background,
      body: Stack(
        children: [
          // Background Aesthetic Blobs
          Positioned(
            top: -120,
            right: -60,
            child: _buildBlob(350, SahimedColors.primary.withOpacity(0.08)),
          ),
          Positioned(
            bottom: -80,
            left: -40,
            child: _buildBlob(280, SahimedColors.accent.withOpacity(0.05)),
          ),

          SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Column(
                children: [
                  const SizedBox(height: 32),

                  // App Branding
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: SahimedColors.primary,
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: [
                            BoxShadow(
                              color: SahimedColors.primary.withOpacity(0.2),
                              blurRadius: 20,
                              offset: const Offset(0, 8),
                            ),
                          ],
                        ),
                        child: const Icon(
                          Icons.health_and_safety_rounded,
                          color: Colors.white,
                          size: 28,
                        ),
                      ),
                      const SizedBox(width: 12),
                      RichText(
                        text: TextSpan(
                          children: [
                            TextSpan(
                              text: 'Sahi',
                              style: GoogleFonts.outfit(
                                fontSize: 32,
                                fontWeight: FontWeight.w900,
                                color: const Color(0xFF0F172A),
                                letterSpacing: -1,
                              ),
                            ),
                            TextSpan(
                              text: 'Med',
                              style: GoogleFonts.outfit(
                                fontSize: 32,
                                fontWeight: FontWeight.w900,
                                color: SahimedColors.primary,
                                letterSpacing: -1,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 48),

                  // Hero Illustration
                  Container(
                    height: 280,
                    width: double.infinity,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(40),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.05),
                          blurRadius: 40,
                          offset: const Offset(0, 20),
                        ),
                      ],
                    ),
                    clipBehavior: Clip.antiAlias,
                    child: Image.asset(
                      'assets/images/login_illustration_wellness.png',
                      fit: BoxFit.cover,
                    ),
                  ),

                  const SizedBox(height: 48),

                  Text(
                    'Premium Healthcare',
                    style: GoogleFonts.outfit(
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                      color: const Color(0xFF0F172A),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Access your generic medicines and health records with one secure login.',
                    textAlign: TextAlign.center,
                    style: GoogleFonts.inter(
                      fontSize: 15,
                      color: const Color(0xFF64748B),
                      height: 1.5,
                    ),
                  ),

                  const SizedBox(height: 48),

                  // Phone Input
                  _buildPhoneInput(),

                  const SizedBox(height: 24),
                  _buildTermsCheckbox(),

                  const SizedBox(height: 48),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTermsCheckbox() {
    return GestureDetector(
      onTap: () => setState(() => _agreedToTerms = !_agreedToTerms),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            SizedBox(
              height: 24,
              width: 24,
              child: Checkbox(
                value: _agreedToTerms,
                onChanged: (v) => setState(() => _agreedToTerms = v ?? false),
                activeColor: SahimedColors.primary,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(6),
                ),
              ),
            ),
            const SizedBox(width: 10),
            Text(
              'I agree to the Terms & Privacy Policy',
              style: GoogleFonts.inter(
                fontSize: 13,
                fontWeight: FontWeight.w500,
                color: const Color(0xFF475569),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPhoneInput() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFF1F5F9)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      padding: const EdgeInsets.all(8),
      child: Row(
        children: [
          const SizedBox(width: 20),
          Text(
            '+91',
            style: GoogleFonts.outfit(
              fontWeight: FontWeight.bold,
              color: SahimedColors.primary,
              fontSize: 16,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: TextField(
              controller: _phoneController,
              keyboardType: TextInputType.phone,
              style: GoogleFonts.outfit(
                fontWeight: FontWeight.bold,
                fontSize: 16,
              ),
              decoration: InputDecoration(
                hintText: 'Mobile Number',
                border: InputBorder.none,
                hintStyle: GoogleFonts.outfit(
                  color: const Color(0xFFCBD5E1),
                  fontSize: 15,
                ),
              ),
            ),
          ),
          GestureDetector(
            onTap: _isLoading ? null : _sendOtp,
            child: Container(
              height: 52,
              width: 52,
              decoration: BoxDecoration(
                color: SahimedColors.primary,
                borderRadius: BorderRadius.circular(18),
                boxShadow: [
                  BoxShadow(
                    color: SahimedColors.primary.withOpacity(0.3),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: _isLoading
                  ? const Center(
                      child: SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          color: Colors.white,
                          strokeWidth: 2,
                        ),
                      ),
                    )
                  : const Icon(
                      Icons.arrow_forward_rounded,
                      color: Colors.white,
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
