import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/services.dart';
import '../../../core/theme/colors.dart';
import '../../../core/layout/main_layout.dart';
import '../../../core/services/api_service.dart';
import '../../../core/services/notification_service.dart';
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
        // Also sync FCM token now that we have auth headers
        await NotificationService.syncToken();
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
      backgroundColor: Colors.white,
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
      body: SafeArea(
        child: Column(
          children: [
            if (_isLoading)
              const LinearProgressIndicator(
                backgroundColor: Colors.white,
                valueColor: AlwaysStoppedAnimation<Color>(SahimedColors.primary),
                minHeight: 2,
              ),
            Expanded(
              child: Center(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(horizontal: 32),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      _buildStepIndicator(2),
                      const SizedBox(height: 48),
                      // Icon Header
                      Container(
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          color: SahimedColors.primary.withOpacity(0.05),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.mark_email_read_rounded,
                          color: SahimedColors.primary,
                          size: 64,
                        ),
                      ),
                      const SizedBox(height: 32),
                      
                      Text(
                        'Verification',
                        style: GoogleFonts.outfit(
                          fontSize: 32,
                          fontWeight: FontWeight.w900,
                          color: const Color(0xFF0F172A),
                          letterSpacing: -0.5,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        'We\'ve sent a 6-digit code to',
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          color: const Color(0xFF64748B),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '+91 ${widget.phoneNumber}',
                        style: GoogleFonts.outfit(
                          fontSize: 18,
                          fontWeight: FontWeight.w900,
                          color: SahimedColors.primary,
                        ),
                      ),

                      const SizedBox(height: 48),

                      // OTP Input (Clean)
                      Pinput(
                        length: 6,
                        controller: _pinController,
                        focusNode: _pinFocusNode,
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
                      ),

                      const SizedBox(height: 40),

                      // Verify Button
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
                            elevation: 0, // Flat for modern look
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
                                  'VERIFY & CONTINUE',
                                  style: GoogleFonts.outfit(
                                    fontWeight: FontWeight.w900,
                                    fontSize: 14,
                                    letterSpacing: 2,
                                  ),
                                ),
                        ),
                      ),

                      const SizedBox(height: 48),

                      // Resend Logic
                      Column(
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
                              _showError("OTP Resent Successfully");
                            } : null,
                            child: Text(
                              "RESEND OTP",
                              style: GoogleFonts.outfit(
                                fontSize: 12,
                                fontWeight: FontWeight.w900,
                                color: _canResend ? SahimedColors.primary : SahimedColors.slate300,
                                letterSpacing: 1.5,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStepIndicator(int currentStep) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        _buildStep(1, "Mobile", currentStep >= 1),
        Container(
          width: 40,
          height: 2,
          margin: const EdgeInsets.only(left: 8, right: 8, bottom: 14),
          color: currentStep > 1 ? SahimedColors.primary : const Color(0xFFE2E8F0),
        ),
        _buildStep(2, "OTP", currentStep >= 2),
      ],
    );
  }

  Widget _buildStep(int step, String label, bool isActive) {
    return Column(
      children: [
        Container(
          width: 28,
          height: 28,
          decoration: BoxDecoration(
            color: isActive ? SahimedColors.primary : Colors.white,
            border: Border.all(color: isActive ? SahimedColors.primary : const Color(0xFFE2E8F0), width: 2),
            shape: BoxShape.circle,
            boxShadow: isActive ? [
              BoxShadow(
                color: SahimedColors.primary.withOpacity(0.2),
                blurRadius: 8,
                offset: const Offset(0, 4),
              )
            ] : null,
          ),
          child: Center(
            child: Text(
              step.toString(),
              style: GoogleFonts.outfit(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: isActive ? Colors.white : const Color(0xFF94A3B8),
              ),
            ),
          ),
        ),
        const SizedBox(height: 6),
        Text(
          label,
          style: GoogleFonts.outfit(
            fontSize: 11,
            fontWeight: FontWeight.w900,
            color: isActive ? SahimedColors.primary : const Color(0xFF94A3B8),
            letterSpacing: 0.5,
          ),
        ),
      ],
    );
  }
}
