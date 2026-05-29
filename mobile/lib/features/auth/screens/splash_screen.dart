import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/theme/colors.dart';

class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        width: double.infinity,
        decoration: const BoxDecoration(
          color: Colors.white,
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Colors.white,
              SahimedColors.sahiBlue,
            ],
          ),
        ),
        child: Stack(
          children: [
            // Decorative background elements
            Positioned(
              top: -100,
              right: -100,
              child: Container(
                width: 300,
                height: 300,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: SahimedColors.primary.withOpacity(0.05),
                ),
              ).animate().scale(duration: 2.seconds, curve: Curves.easeOut),
            ),
            
            Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Logo Group
                  Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      SvgPicture.asset(
                        'assets/icons/logo.svg',
                        width: 90,
                        height: 90,
                      )
                          .animate()
                          .fadeIn(duration: 800.ms)
                          .scale(begin: const Offset(0.9, 0.9)),
                      const SizedBox(height: 16),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            'Sahi',
                            style: GoogleFonts.outfit(
                              fontSize: 54,
                              fontWeight: FontWeight.w900,
                              color: const Color(0xFF1E3A8A),
                              letterSpacing: -2,
                            ),
                          )
                              .animate()
                              .fadeIn(duration: 800.ms)
                              .slideX(begin: -0.2, end: 0, curve: Curves.easeOutCubic),
                          Text(
                            'Med',
                            style: GoogleFonts.outfit(
                              fontSize: 54,
                              fontWeight: FontWeight.w900,
                              color: const Color(0xFF15803D),
                              letterSpacing: -2,
                            ),
                          )
                              .animate()
                              .fadeIn(delay: 200.ms, duration: 800.ms)
                              .slideX(begin: 0.2, end: 0, curve: Curves.easeOutCubic),
                        ],
                      ),
                      const SizedBox(height: 8),
                      RichText(
                        text: TextSpan(
                          children: [
                            TextSpan(
                              text: 'Sahi Dawai '.toUpperCase(),
                              style: GoogleFonts.outfit(
                                fontSize: 10,
                                fontWeight: FontWeight.w900,
                                color: const Color(0xFF1E3A8A),
                                letterSpacing: 2.5,
                              ),
                            ),
                            TextSpan(
                              text: 'Sahi Daam Pe'.toUpperCase(),
                              style: GoogleFonts.outfit(
                                fontSize: 10,
                                fontWeight: FontWeight.w900,
                                color: const Color(0xFF15803D),
                                letterSpacing: 2.5,
                              ),
                            ),
                          ],
                        ),
                      )
                          .animate()
                          .fadeIn(delay: 600.ms, duration: 800.ms)
                          .shimmer(delay: 1.5.seconds, duration: 1.5.seconds),
                    ],
                  ),
                  
                  const SizedBox(height: 80),
                  
                  // Loader
                  const SizedBox(
                    width: 32,
                    height: 32,
                    child: CircularProgressIndicator(
                      valueColor: AlwaysStoppedAnimation<Color>(
                        SahimedColors.primary,
                      ),
                      strokeWidth: 2,
                    ),
                  )
                      .animate()
                      .fadeIn(delay: 1.5.seconds)
                      .scale(delay: 1.5.seconds, begin: const Offset(0.5, 0.5)),
                ],
              ),
            ),
            
            // Bottom Footer
            Positioned(
              bottom: 60,
              left: 0,
              right: 0,
              child: Center(
                child: Text(
                  'PREMIUM HEALTHCARE PARTNER',
                  style: GoogleFonts.outfit(
                    fontSize: 10,
                    fontWeight: FontWeight.w900,
                    color: SahimedColors.slate400,
                    letterSpacing: 2,
                  ),
                ).animate().fadeIn(delay: 2.seconds),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

