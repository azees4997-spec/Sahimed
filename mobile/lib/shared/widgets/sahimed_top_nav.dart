import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../features/home/widgets/home_header.dart';
import '../../features/products/screens/search_screen.dart';
import '../../core/theme/colors.dart';

/// SahimedTopNav — two modes:
///
/// 1. **Home mode** (`showBack: false`, default)  
///    Shows the full HomeHeader (logo + location pill).
///    Optionally shows a search bar below via `showSearch`.
///
/// 2. **Inner-page mode** (`showBack: true`)  
///    Shows a compact, perfectly-aligned nav bar:
///    [←]   [SahiMed logo centred]   [🔍]
///    No location pill. No search bar below.
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
    if (showBack) {
      return _InnerPageNav(showSearch: showSearch);
    }

    // Home-mode: use the existing HomeHeader + optional search bar
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        const HomeHeader(),
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
                  border: Border.all(
                    color: SahimedColors.primary.withOpacity(0.05),
                    width: 1.5,
                  ),
                ),
                child: Row(
                  children: [
                    Icon(
                      LucideIcons.search,
                      size: 18,
                      color: SahimedColors.primary.withOpacity(0.6),
                    ),
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
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 4,
                      ),
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

/// Inner-page top nav: back ← | centred logo | search icon 🔍
class _InnerPageNav extends StatelessWidget {
  final bool showSearch;
  const _InnerPageNav({this.showSearch = false});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
      child: Row(
        children: [
          // ── Back button ──────────────────────────────────────────────
          IconButton(
            icon: const Icon(
              LucideIcons.arrowLeft,
              color: Color(0xFF0F172A),
              size: 22,
            ),
            onPressed: () {
              HapticFeedback.lightImpact();
              Navigator.pop(context);
            },
          ),

          // ── Logo (centred via Expanded trick) ────────────────────────
          Expanded(
            child: GestureDetector(
              onTap: () =>
                  Navigator.of(context).popUntil((route) => route.isFirst),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  SvgPicture.asset(
                    'assets/icons/logo.svg',
                    width: 32,
                    height: 32,
                  ),
                  const SizedBox(width: 8),
                  RichText(
                    text: TextSpan(
                      children: [
                        TextSpan(
                          text: 'Sahi',
                          style: GoogleFonts.outfit(
                            fontSize: 20,
                            fontWeight: FontWeight.w900,
                            color: const Color(0xFF1E3A8A),
                            letterSpacing: -0.5,
                          ),
                        ),
                        TextSpan(
                          text: 'Med',
                          style: GoogleFonts.outfit(
                            fontSize: 20,
                            fontWeight: FontWeight.w900,
                            color: const Color(0xFF15803D),
                            letterSpacing: -0.5,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          // ── Search icon ───────────────────────────────────────────────
          IconButton(
            icon: Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(
                color: SahimedColors.primary.withOpacity(0.08),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(
                LucideIcons.search,
                color: SahimedColors.primary,
                size: 18,
              ),
            ),
            onPressed: () {
              HapticFeedback.mediumImpact();
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const SearchScreen()),
              );
            },
          ),
        ],
      ),
    );
  }
}
