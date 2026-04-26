import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../theme/colors.dart';

class GlobalErrorHandler extends StatefulWidget {
  final Widget child;
  const GlobalErrorHandler({super.key, required this.child});

  @override
  State<GlobalErrorHandler> createState() => _GlobalErrorHandlerState();
}

class _GlobalErrorHandlerState extends State<GlobalErrorHandler> {
  bool _hasError = false;
  Object? _error;

  @override
  void initState() {
    super.initState();
    // Catch Flutter framework errors
    ErrorWidget.builder = (FlutterErrorDetails details) {
      debugPrint('Global Error Caught: ${details.exception}');
      return _buildErrorUI(details.exception);
    };
  }

  Widget _buildErrorUI(Object error) {
    return Material(
      color: Colors.white,
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: SahimedColors.accent.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  LucideIcons.triangleAlert,
                  color: SahimedColors.accent,
                  size: 48,
                ),
              ),
              const SizedBox(height: 32),
              Text(
                'SOMETHING WENT WRONG',
                style: GoogleFonts.outfit(
                  fontSize: 24,
                  fontWeight: FontWeight.w900,
                  color: const Color(0xFF0F172A),
                  letterSpacing: -0.5,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                'Our clinical systems encountered a temporary glitch. Please try restarting that section.',
                textAlign: TextAlign.center,
                style: GoogleFonts.inter(
                  fontSize: 14,
                  color: const Color(0xFF64748B),
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 48),
              SizedBox(
                width: double.infinity,
                height: 60,
                child: ElevatedButton(
                  onPressed: () {
                    // Force a rebuild and navigation back
                    Navigator.of(context).popUntil((route) => route.isFirst);
                    setState(() {
                      _hasError = false;
                    });
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: SahimedColors.primary,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(20),
                    ),
                  ),
                  child: Text(
                    'RECOVER & HOME',
                    style: GoogleFonts.outfit(
                      fontWeight: FontWeight.w900,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              TextButton.icon(
                onPressed: () {
                  // Link to support would go here
                },
                icon: const Icon(
                  LucideIcons.messageSquare,
                  size: 16,
                  color: SahimedColors.primary,
                ),
                label: Text(
                  'REPORT TO SAHIMED SUPPORT',
                  style: GoogleFonts.outfit(
                    fontSize: 12,
                    fontWeight: FontWeight.w900,
                    color: SahimedColors.primary,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_hasError) return _buildErrorUI(_error!);
    return widget.child;
  }
}
