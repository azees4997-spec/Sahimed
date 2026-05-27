import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../features/home/widgets/home_header.dart';
import '../../features/products/screens/search_screen.dart';
import '../../core/theme/colors.dart';

class SahimedTopNav extends StatelessWidget {
  final bool showSearch;
  final bool showBack;

  const SahimedTopNav({
    super.key,
    this.showSearch = true,
    this.showBack = false,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // 1. HomeHeader (Logo + Location)
        // We wrap it to handle the back button if needed
        Stack(
          children: [
            const HomeHeader(),
            if (showBack)
              Positioned(
                left: 10,
                top: 0,
                bottom: 0,
                child: Center(
                  child: IconButton(
                    icon: const Icon(LucideIcons.arrowLeft, color: Color(0xFF0F172A)),
                    onPressed: () => Navigator.pop(context),
                  ),
                ),
              ),
          ],
        ),
        
        // 2. Search Bar
        if (showSearch)
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
            child: GestureDetector(
              onTap: () {
                HapticFeedback.mediumImpact();
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const SearchScreen()),
                );
              },
              child: Container(
                height: 52,
                padding: const EdgeInsets.symmetric(horizontal: 20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: SahimedColors.primary.withOpacity(0.08),
                      blurRadius: 20,
                      offset: const Offset(0, 4),
                    ),
                  ],
                  border: Border.all(color: SahimedColors.primary.withOpacity(0.05), width: 1.5),
                ),
                child: Row(
                  children: [
                    Icon(LucideIcons.search, size: 18, color: SahimedColors.primary.withOpacity(0.6)),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Search by Brand or Salt',
                        style: GoogleFonts.outfit(
                          fontWeight: FontWeight.w600,
                          color: const Color(0xFF94A3B8),
                          fontSize: 14,
                        ),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: SahimedColors.primary.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(100),
                      ),
                      child: Text(
                        'SEARCH',
                        style: GoogleFonts.outfit(
                          fontSize: 9,
                          fontWeight: FontWeight.w900,
                          color: SahimedColors.primary,
                          letterSpacing: 1,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
      ],
    );
  }
}
