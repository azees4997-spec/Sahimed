import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../core/theme/colors.dart';

class OrderStatusScreen extends StatelessWidget {
  final bool isSuccess;

  const OrderStatusScreen({super.key, required this.isSuccess});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: SahimedColors.background,
      body: Container(
        width: double.infinity,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              isSuccess
                  ? Colors.green.withOpacity(0.05)
                  : SahimedColors.accent.withOpacity(0.05),
              SahimedColors.background,
            ],
          ),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 32.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Spacer(),
                _buildAnimatedStatusIcon(),
                const SizedBox(height: 48),
                Text(
                  isSuccess ? 'Success!' : 'Oops!',
                  style: GoogleFonts.outfit(
                    fontSize: 40,
                    fontWeight: FontWeight.w900,
                    color: SahimedColors.textPrimary,
                    letterSpacing: -1,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  isSuccess
                      ? 'Order Placed Successfully'
                      : 'Transaction Failed',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.outfit(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    color: isSuccess ? Colors.green[700] : SahimedColors.accent,
                  ),
                ),
                const SizedBox(height: 24),
                Text(
                  isSuccess
                      ? 'Your medical supplies are being prepared. We\'ll notify you once they are out for delivery.'
                      : 'We couldn\'t process your order at this moment. Please check your connection or try a different method.',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.outfit(
                    fontSize: 16,
                    color: SahimedColors.textSecondary,
                    height: 1.6,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 48),
                if (isSuccess) _buildOrderCard() else _buildErrorCard(),
                const Spacer(),
                _buildActionButton(context),
                const SizedBox(height: 24),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildAnimatedStatusIcon() {
    return TweenAnimationBuilder<double>(
      duration: const Duration(milliseconds: 800),
      tween: Tween(begin: 0, end: 1),
      curve: Curves.elasticOut,
      builder: (context, value, child) {
        return Transform.scale(
          scale: value,
          child: Container(
            padding: const EdgeInsets.all(40),
            decoration: BoxDecoration(
              color: SahimedColors.white,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: (isSuccess ? Colors.green : SahimedColors.accent)
                      .withOpacity(0.2),
                  blurRadius: 40,
                  spreadRadius: 10,
                ),
              ],
            ),
            child: Icon(
              isSuccess ? Icons.check_circle_rounded : Icons.cancel_rounded,
              size: 80,
              color: isSuccess ? Colors.green : SahimedColors.accent,
            ),
          ),
        );
      },
    );
  }

  Widget _buildOrderCard() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: SahimedColors.white,
        borderRadius: BorderRadius.circular(30),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        children: [
          _rowItem(LucideIcons.clock, 'Estimated Delivery', '24-48 Hours'),
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 16),
            child: Divider(height: 1),
          ),
          _rowItem(LucideIcons.package, 'Payment Method', 'Cash on Delivery'),
        ],
      ),
    );
  }

  Widget _buildErrorCard() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: SahimedColors.accent.withOpacity(0.1),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: SahimedColors.accent.withOpacity(0.2)),
      ),
      child: Row(
        children: [
          Icon(LucideIcons.info, color: SahimedColors.accent),
          const SizedBox(width: 16),
          Expanded(
            child: Text(
              'Don\'t worry, no amount was charged from your wallet.',
              style: GoogleFonts.outfit(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: SahimedColors.accent,
              ),
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
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: SahimedColors.background,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(icon, size: 20, color: SahimedColors.primary),
        ),
        const SizedBox(width: 16),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: GoogleFonts.outfit(
                fontSize: 12,
                color: SahimedColors.textSecondary,
                fontWeight: FontWeight.w600,
              ),
            ),
            Text(
              value,
              style: GoogleFonts.outfit(
                fontSize: 15,
                fontWeight: FontWeight.w800,
                color: SahimedColors.textPrimary,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildActionButton(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: () {
          Navigator.of(context).popUntil((route) => route.isFirst);
        },
        style: ElevatedButton.styleFrom(
          backgroundColor: isSuccess
              ? SahimedColors.primary
              : SahimedColors.textPrimary,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 20),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(22),
          ),
          elevation: 10,
          shadowColor:
              (isSuccess ? SahimedColors.primary : SahimedColors.textPrimary)
                  .withOpacity(0.4),
        ),
        child: Text(
          isSuccess ? 'Continue Shopping' : 'Back to Home',
          style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w800),
        ),
      ),
    );
  }
}
