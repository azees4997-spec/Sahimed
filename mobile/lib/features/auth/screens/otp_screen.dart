import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/services.dart';
import '../../../core/theme/colors.dart';
import '../../../core/layout/main_layout.dart';
import '../../../core/services/api_service.dart';
import 'package:pinput/pinput.dart';

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
  final TextEditingController _pinController = TextEditingController();
  final FocusNode _pinFocusNode = FocusNode();
  bool _isLoading = false;
  
  // Timer State
  int _resendTimer = 30;
  bool _canResend = false;
  late dynamic _timer;

  @override
  void initState() {
    super.initState();
    _startTimer();
  }

  void _startTimer() {
    _resendTimer = 30;
    _canResend = false;
    setState(() {});
    _timer = Stream.periodic(const Duration(seconds: 1), (i) => 29 - i)
        .take(30)
        .listen((seconds) {
      if (mounted) {
        setState(() {
          _resendTimer = seconds;
          if (_resendTimer == 0) _canResend = true;
        });
      }
    });
  }

  @override
  void dispose() {
    if (_timer != null) _timer.cancel();
    _pinController.dispose();
    _pinFocusNode.dispose();
    super.dispose();
  }

  Future<void> _verifyOtp([String? manualCode]) async {
    final code = manualCode ?? _pinController.text;
    if (code.length != 6) return;

    setState(() => _isLoading = true);

    try {
      await HapticFeedback.mediumImpact();
      PhoneAuthCredential credential = PhoneAuthProvider.credential(
        verificationId: widget.verificationId,
        smsCode: code,
      );

      await _auth.signInWithCredential(credential);

      // CRITICAL: Sync with MongoDB immediately after login
      try {
        await ApiService().syncUser();
      } catch (e) {
        debugPrint("Sync Error: $e");
        // We continue anyway so as not to block the user, 
        // but the sync is triggered in the background.
      }

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
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(
            Icons.arrow_back_ios_new_rounded,
            color: SahimedColors.primary,
          ),
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
                  Text(
                    'Verification',
                    style: GoogleFonts.outfit(
                      fontSize: 32,
                      fontWeight: FontWeight.bold,
                      color: const Color(0xFF0F172A),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'We\'ve sent a verification code to:',
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      color: const Color(0xFF64748B),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '+91 ${widget.phoneNumber}',
                    style: GoogleFonts.outfit(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: SahimedColors.primary,
                    ),
                  ),

                  const SizedBox(height: 48),

                  // OTP Input Card
                  Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(32),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.03),
                          blurRadius: 40,
                          offset: const Offset(0, 10),
                        ),
                      ],
                    ),
                    child: Column(
                      children: [
                        Pinput(
                          length: 6,
                          controller: _pinController,
                          focusNode: _pinFocusNode,
                          androidSmsAutofillMethod: AndroidSmsAutofillMethod.smsUserConsentApi,
                          listenForSmsCode: true,
                          autofocus: true,
                          hapticFeedbackType: HapticFeedbackType.mediumImpact,
                          onCompleted: (pin) => _verifyOtp(pin),
                          defaultPinTheme: PinTheme(
                            width: 48,
                            height: 56,
                            textStyle: GoogleFonts.outfit(
                              fontSize: 22,
                              fontWeight: FontWeight.w900,
                              color: const Color(0xFF0F172A),
                            ),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF8FAFC),
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: const Color(0xFFF1F5F9)),
                            ),
                          ),
                          focusedPinTheme: PinTheme(
                            width: 52,
                            height: 60,
                            textStyle: GoogleFonts.outfit(
                              fontSize: 24,
                              fontWeight: FontWeight.w900,
                              color: SahimedColors.primary,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(
                                color: SahimedColors.primary,
                                width: 2,
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: SahimedColors.primary.withOpacity(0.1),
                                  blurRadius: 20,
                                  offset: const Offset(0, 10),
                                ),
                              ],
                            ),
                          ),
                          submittedPinTheme: PinTheme(
                            width: 48,
                            height: 56,
                            textStyle: GoogleFonts.outfit(
                              fontSize: 22,
                              fontWeight: FontWeight.w900,
                              color: const Color(0xFF0F172A),
                            ),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF1F5F9),
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: const Color(0xFFE2E8F0)),
                            ),
                          ),
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
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(20),
                              ),
                              elevation: 10,
                              shadowColor: SahimedColors.primary.withOpacity(
                                0.3,
                              ),
                            ),
                            child: _isLoading
                                ? const SizedBox(
                                    height: 20,
                                    width: 20,
                                    child: CircularProgressIndicator(
                                      color: Colors.white,
                                      strokeWidth: 2,
                                    ),
                                  )
                                : Text(
                                    'VERIFY OTP',
                                    style: GoogleFonts.outfit(
                                      fontWeight: FontWeight.w900,
                                      fontSize: 16,
                                      letterSpacing: 2,
                                    ),
                                  ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 48),

                  Center(
                    child: Column(
                      children: [
                        Text(
                          _canResend 
                            ? "Didn't receive the code?" 
                            : "Resend code in ${_resendTimer}s",
                          style: GoogleFonts.inter(
                            fontSize: 14,
                            color: const Color(0xFF94A3B8),
                          ),
                        ),
                        const SizedBox(height: 8),
                        TextButton(
                          onPressed: _canResend ? () {
                            _startTimer();
                            // In a real app, you would call the Firebase resend logic here
                            _showError("OTP Resent Successfully");
                          } : null,
                          child: Text(
                            "RESEND CODE",
                            style: GoogleFonts.outfit(
                              fontSize: 14,
                              fontWeight: FontWeight.w900,
                              color: _canResend ? SahimedColors.primary : SahimedColors.slate300,
                              letterSpacing: 1.5,
                            ),
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
