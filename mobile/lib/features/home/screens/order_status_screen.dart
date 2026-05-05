import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/theme/colors.dart';

import 'package:audioplayers/audioplayers.dart';
import '../../../core/providers/navigation_provider.dart';
import 'package:provider/provider.dart';

import 'package:lottie/lottie.dart';

class OrderStatusScreen extends StatefulWidget {
  final bool isSuccess;
  final String? orderId;
  final double? totalAmount;
  final String? patientName;

  const OrderStatusScreen({
    super.key,
    required this.isSuccess,
    this.orderId,
    this.totalAmount,
    this.patientName,
  });

  @override
  State<OrderStatusScreen> createState() => _OrderStatusScreenState();
}

class _OrderStatusScreenState extends State<OrderStatusScreen> {
  final _audioPlayer = AudioPlayer();

  @override
  void initState() {
    super.initState();
    if (widget.isSuccess) {
      _playSuccessSound();
      _triggerHaptics();
    }
  }

  void _triggerHaptics() async {
    HapticFeedback.vibrate();
    await Future.delayed(const Duration(milliseconds: 100));
    HapticFeedback.lightImpact();
    await Future.delayed(const Duration(milliseconds: 100));
    HapticFeedback.mediumImpact();
    await Future.delayed(const Duration(milliseconds: 100));
    HapticFeedback.heavyImpact();
  }

  Future<void> _playSuccessSound() async {
    try {
      // High-quality "Dopamine" Magical Win Sound
      await _audioPlayer.play(UrlSource('https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3'));
    } catch (e) {
      debugPrint('Error playing success sound: $e');
    }
  }

  @override
  void dispose() {
    _audioPlayer.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: widget.isSuccess ? const Color(0xFF00B377) : SahimedColors.background,
      body: Stack(
        children: [
          // Background Joyful Gradient for Success
          if (widget.isSuccess)
            Positioned.fill(
              child: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [Color(0xFF00D991), Color(0xFF008C5D)],
                  ),
                ),
              ).animate().fadeIn(duration: 800.ms),
            ),

          // Lottie Confetti Celebration
          if (widget.isSuccess)
            Positioned.fill(
              child: IgnorePointer(
                child: Lottie.network(
                  'https://lottie.host/859367c3-3174-4b5a-9418-8798e3b38c2f/x0S0H9O5Q0.json',
                  fit: BoxFit.cover,
                  repeat: false,
                ),
              ),
            ),

          SafeArea(
            child: SingleChildScrollView(
              physics: const BouncingScrollPhysics(),
              padding: const EdgeInsets.symmetric(horizontal: 24.0),
              child: Column(
                children: [
                  const SizedBox(height: 60),
                  
                  // Big Animated Icon
                  _buildAnimatedStatusIcon(),
                  
                  const SizedBox(height: 32),
                  
                  // Success/Joy Text
                  if (widget.isSuccess) ...[
                    Text(
                      'Order Confirmed!',
                      style: GoogleFonts.outfit(
                        fontSize: 34,
                        fontWeight: FontWeight.w900,
                        color: Colors.white,
                        letterSpacing: -1,
                      ),
                    ).animate().scale(delay: 400.ms, duration: 600.ms, curve: Curves.elasticOut),
                    const SizedBox(height: 8),
                    Text(
                      'YOUR MEDICINES ARE ON THE WAY',
                      textAlign: TextAlign.center,
                      style: GoogleFonts.outfit(
                        fontSize: 12,
                        fontWeight: FontWeight.w900,
                        color: Colors.white.withOpacity(0.9),
                        letterSpacing: 2,
                      ),
                    ).animate().fadeIn(delay: 600.ms),
                  ] else ...[
                    Text(
                      'Something Went Wrong',
                      style: GoogleFonts.outfit(
                        fontSize: 28,
                        fontWeight: FontWeight.w900,
                        color: SahimedColors.textPrimary,
                        letterSpacing: -0.5,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'TRANSACTION FAILED',
                      textAlign: TextAlign.center,
                      style: GoogleFonts.outfit(
                        fontSize: 12,
                        fontWeight: FontWeight.w900,
                        color: SahimedColors.accent,
                        letterSpacing: 2,
                      ),
                    ),
                  ],

                  const SizedBox(height: 48),
                  
                  // Detail Card
                  if (widget.isSuccess) _buildOrderCard() else _buildErrorCard(),
                  
                  const SizedBox(height: 48),
                  
                  // Action Buttons
                  _buildActionButtons(context),
                  const SizedBox(height: 40),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAnimatedStatusIcon() {
    return Container(
      width: 140,
      height: 140,
      decoration: BoxDecoration(
        color: Colors.white,
        shape: BoxShape.circle,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 30,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Center(
        child: Icon(
          widget.isSuccess ? Icons.check_rounded : Icons.close_rounded,
          size: 90,
          color: widget.isSuccess ? const Color(0xFF00B377) : SahimedColors.accent,
        ),
      ),
    ).animate()
      .scale(duration: 600.ms, curve: Curves.elasticOut)
      .shimmer(delay: 1.seconds, duration: 1.5.seconds);
  }

  Widget _buildOrderCard() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(32),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 24,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        children: [
          if (widget.orderId != null) ...[
            _rowItem(LucideIcons.hash, 'Order ID', widget.orderId!),
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 12),
              child: Divider(height: 1, color: Color(0xFFF1F5F9)),
            ),
          ],
          if (widget.patientName != null) ...[
            _rowItem(LucideIcons.user, 'Patient Name', widget.patientName!.toUpperCase()),
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 12),
              child: Divider(height: 1, color: Color(0xFFF1F5F9)),
            ),
          ],
          if (widget.totalAmount != null) ...[
            _rowItem(LucideIcons.banknote, 'Total Amount', '₹${widget.totalAmount!.toStringAsFixed(2)}'),
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 12),
              child: Divider(height: 1, color: Color(0xFFF1F5F9)),
            ),
          ],
          _rowItem(LucideIcons.truck, 'Expected Arrival', 'WITHIN 24-48 HOURS'),
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 12),
            child: Divider(height: 1, color: Color(0xFFF1F5F9)),
          ),
          _rowItem(LucideIcons.packageCheck, 'Payment Mode', 'CASH ON DELIVERY'),
          const SizedBox(height: 20),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFFF0FDF4),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: const Color(0xFFDCFCE7)),
            ),
            child: Row(
              children: [
                const Icon(LucideIcons.smile, color: Color(0xFF16A34A), size: 20),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'We\'re excited to serve you! You will receive a confirmation call shortly.',
                    style: GoogleFonts.outfit(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: const Color(0xFF16A34A),
                      height: 1.4,
                    ),
                  ),
                ),
              ],
            ),
          ).animate().fadeIn(delay: 1.seconds),
        ],
      ),
    ).animate().slideY(begin: 0.2, duration: 600.ms, curve: Curves.easeOut);
  }

  Widget _buildErrorCard() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: SahimedColors.accent.withOpacity(0.2)),
      ),
      child: Column(
        children: [
          const Icon(LucideIcons.circleAlert, color: SahimedColors.accent, size: 40),
          const SizedBox(height: 16),
          Text(
            'Don\'t worry, no amount was charged from your wallet. Please try again or contact support.',
            textAlign: TextAlign.center,
            style: GoogleFonts.outfit(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: SahimedColors.textSecondary,
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }

  Widget _rowItem(IconData icon, String label, String value) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: const Color(0xFFF8FAFC),
            borderRadius: BorderRadius.circular(14),
          ),
          child: Icon(icon, size: 22, color: widget.isSuccess ? const Color(0xFF00B377) : SahimedColors.primary),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label.toUpperCase(),
                style: GoogleFonts.outfit(
                  fontSize: 10,
                  color: SahimedColors.slate400,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 1,
                ),
              ),
              Text(
                value,
                style: GoogleFonts.outfit(
                  fontSize: 16,
                  fontWeight: FontWeight.w900,
                  color: SahimedColors.textPrimary,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildActionButtons(BuildContext context) {
    return Column(
      children: [
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: () {
              HapticFeedback.mediumImpact();
              Navigator.of(context).popUntil((route) => route.isFirst);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.white,
              foregroundColor: widget.isSuccess ? const Color(0xFF00B377) : SahimedColors.textPrimary,
              padding: const EdgeInsets.symmetric(vertical: 20),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(24),
              ),
              elevation: 0,
            ),
            child: Text(
              widget.isSuccess ? 'CONTINUE SHOPPING' : 'BACK TO HOME',
              style: GoogleFonts.outfit(
                fontSize: 14,
                fontWeight: FontWeight.w900,
                letterSpacing: 1.5,
              ),
            ),
          ),
        ).animate().fadeIn(delay: 1.2.seconds),
        
        if (widget.isSuccess) ...[
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: () {
                HapticFeedback.mediumImpact();
                // Switch to Profile/Orders tab
                Navigator.of(context).popUntil((route) => route.isFirst);
                context.read<NavigationProvider>().switchTab(3); // Profile tab where orders are
              },
              icon: const Icon(LucideIcons.packageSearch, size: 18),
              label: Text(
                'TRACK ORDERS',
                style: GoogleFonts.outfit(
                  fontSize: 13,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 1,
                ),
              ),
              style: OutlinedButton.styleFrom(
                foregroundColor: Colors.white,
                side: const BorderSide(color: Colors.white, width: 2),
                padding: const EdgeInsets.symmetric(vertical: 20),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(24),
                ),
              ),
            ),
          ).animate().fadeIn(delay: 1.4.seconds),
        ],
      ],
    );
  }
}
