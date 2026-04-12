import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:truecaller_sdk/truecaller_sdk.dart';
import 'package:flutter/services.dart';
import 'dart:async';
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
  bool _isTruecallerReady = false;
  StreamSubscription? _tcSubscription;

  @override
  void initState() {
    super.initState();
    // Initialize Truecaller non-blockingly
    _initializeAuthServices();
  }

  @override
  void dispose() {
    _tcSubscription?.cancel();
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _initializeAuthServices() async {
    try {
      // 1. Initialize Truecaller SDK
      await TcSdk.initializeSDK(sdkOption: TcSdkOptions.OPTION_VERIFY_ONLY_TC_USERS);
      
      // 2. Check usability
      final isUsable = await TcSdk.isOAuthFlowUsable;
      
      if (mounted) {
        setState(() => _isTruecallerReady = isUsable);
      }

      if (isUsable) {
        // 3. Listen for callbacks
        _tcSubscription = TcSdk.streamCallbackData.listen((callback) {
          _handleTruecallerCallback(callback);
        });
      }
    } catch (e) {
      debugPrint("Auth Init Error: $e");
    }
  }

  void _handleTruecallerCallback(TcSdkCallback callback) {
    switch (callback.result) {
      case TcSdkCallbackResult.success:
        debugPrint("Truecaller Success!");
        _navigateToHome();
        break;
      case TcSdkCallbackResult.failure:
        debugPrint("Truecaller Failure: ${callback.error?.message}");
        _showError("Truecaller Error: ${callback.error?.message ?? 'Unknown error'}");
        break;
      case TcSdkCallbackResult.verification:
        debugPrint("Truecaller: Manual verification required");
        break;
      default:
        break;
    }
  }

  Future<void> _loginWithTruecaller() async {
    if (!_agreedToTerms) {
      _showError("Please agree to the Terms & Conditions first");
      return;
    }

    try {
      await HapticFeedback.mediumImpact();

      if (!_isTruecallerReady) {
        // Try to initialize/check usability again on tap
        _showError("Truecaller is still initializing. Please wait...");
        _initializeAuthServices();
        return;
      }

      final state = "state_${DateTime.now().millisecondsSinceEpoch}";
      await TcSdk.setOAuthState(state);
      await TcSdk.setOAuthScopes(['profile', 'phone', 'openid']);
      await TcSdk.getAuthorizationCode;
    } catch (e) {
      _showError("Truecaller Launch Error: $e");
    }
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
          _showError(e.message ?? "Verification failed");
        },
        codeSent: (String verificationId, int? resendToken) {
          setState(() => _isLoading = false);
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => OtpScreen(
                phoneNumber: phone,
                verificationId: verificationId,
              ),
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
          content: Text(message),
          backgroundColor: Colors.redAccent,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
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
          // Background Aesthetic
          Positioned(
            top: -100,
            right: -50,
            child: _buildBlob(300, SahimedColors.primary.withValues(alpha: 0.08)),
          ),
          
          SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 28),
              child: Column(
                children: [
                  const SizedBox(height: 40),
                  
                  // App Branding
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text('Sahi', style: GoogleFonts.outfit(fontSize: 32, fontWeight: FontWeight.w900, color: SahimedColors.primary, letterSpacing: -1)),
                      Text('Med', style: GoogleFonts.outfit(fontSize: 32, fontWeight: FontWeight.w900, color: SahimedColors.accent, letterSpacing: -1)),
                    ],
                  ),
                  
                  const SizedBox(height: 40),

                  // Hero Illustration (Simplified)
                  Container(
                    height: 220,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(32),
                      boxShadow: [
                        BoxShadow(color: SahimedColors.primary.withValues(alpha: 0.05), blurRadius: 40, offset: const Offset(0, 10)),
                      ],
                    ),
                    child: Center(
                      child: Icon(Icons.security_rounded, size: 80, color: SahimedColors.primary.withValues(alpha: 0.6)),
                    ),
                  ),

                  const SizedBox(height: 32),

                  Text('Welcome Back', style: GoogleFonts.outfit(fontSize: 26, fontWeight: FontWeight.bold, color: SahimedColors.primary)),
                  const SizedBox(height: 8),
                  Text('Quick and secure access to your health records.', textAlign: TextAlign.center, style: GoogleFonts.inter(fontSize: 14, color: SahimedColors.slate500)),
                  
                  const SizedBox(height: 32),

                  // T&C Checkbox
                  _buildTermsCheckbox(),

                  const SizedBox(height: 20),

                  // Truecaller Primary Action
                  _buildTruecallerButton(),
                  const SizedBox(height: 24),
                  _buildDivider(),
                  const SizedBox(height: 24),

                  // Phone Input Fallback
                  _buildPhoneInput(),

                  const SizedBox(height: 40),
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
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Checkbox(
            value: _agreedToTerms,
            onChanged: (v) => setState(() => _agreedToTerms = v ?? false),
            activeColor: SahimedColors.primary,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
          ),
          Flexible(
            child: Text(
              'I agree to the Terms & Conditions',
              style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w500, color: SahimedColors.slate500),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTruecallerButton() {
    return SizedBox(
      width: double.infinity,
      height: 58,
      child: ElevatedButton.icon(
        onPressed: _loginWithTruecaller,
        icon: const Icon(Icons.verified_user_rounded, size: 22),
        label: Text(
          _isTruecallerReady ? '1-TAP LOGIN WITH TRUECALLER' : 'TRUECALLER (CHECKING...)',
          style: GoogleFonts.outfit(fontWeight: FontWeight.w900, fontSize: 14, letterSpacing: 1.2),
        ),
        style: ElevatedButton.styleFrom(
          backgroundColor: _isTruecallerReady ? const Color(0xFF0087FF) : Colors.grey.shade400,
          foregroundColor: Colors.white,
          elevation: _isTruecallerReady ? 2 : 0,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        ),
      ),
    );
  }

  Widget _buildDivider() {
    return Row(
      children: [
        const Expanded(child: Divider()),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Text('OR USE PHONE NUMBER', style: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.w800, color: SahimedColors.slate400, letterSpacing: 1.5)),
        ),
        const Expanded(child: Divider()),
      ],
    );
  }

  Widget _buildPhoneInput() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: SahimedColors.slate100),
        boxShadow: [
          BoxShadow(color: SahimedColors.primary.withValues(alpha: 0.03), blurRadius: 20, offset: const Offset(0, 5)),
        ],
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            decoration: BoxDecoration(
              color: SahimedColors.slate50.withValues(alpha: 0.5),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Row(
              children: [
                Text('+91', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: SahimedColors.primary, fontSize: 16)),
                const SizedBox(width: 12),
                const SizedBox(height: 24, child: VerticalDivider(width: 1, color: SahimedColors.slate200)),
                const SizedBox(width: 12),
                Expanded(
                  child: TextField(
                    controller: _phoneController,
                    keyboardType: TextInputType.phone,
                    style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16),
                    decoration: InputDecoration(
                      hintText: 'Mobile Number',
                      border: InputBorder.none,
                      hintStyle: GoogleFonts.outfit(color: SahimedColors.slate300, fontSize: 14),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton(
              onPressed: _isLoading ? null : _sendOtp,
              style: ElevatedButton.styleFrom(
                backgroundColor: SahimedColors.primary,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                elevation: 0,
              ),
              child: _isLoading
                  ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : Text('SEND OTP', style: GoogleFonts.outfit(fontWeight: FontWeight.w900, fontSize: 14, letterSpacing: 1)),
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
