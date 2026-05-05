import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../theme/colors.dart';
import '../providers/cart_provider.dart';
import '../providers/navigation_provider.dart';

/// Wraps any pushed screen with the persistent floating cart bar
/// and bottom navigation bar — just like the main layout shows.
class ScreenWithNav extends StatelessWidget {
  final Widget child;
  final int activeTab; // 0=Home,1=Search,2=Cart,3=Profile (for highlight)

  const ScreenWithNav({
    super.key,
    required this.child,
    this.activeTab = -1, // -1 = none highlighted (we're on a sub-screen)
  });

  void _onNavTap(BuildContext context, int index) {
    final nav = context.read<NavigationProvider>();
    nav.switchTab(index);
    // Pop all pushed routes back to MainLayout
    Navigator.popUntil(context, (route) => route.isFirst);
  }

  @override
  Widget build(BuildContext context) {
    final cart = context.watch<CartProvider>();
    final itemCount = cart.items.length;
    final double freeShippingThreshold = 499.0;
    final double remainingForFree = freeShippingThreshold - cart.total;
    final bool isFreeShipping = remainingForFree <= 0;
    final double progress = (cart.total / freeShippingThreshold).clamp(0.0, 1.0);

    return Stack(
      children: [
        // The actual screen content
        child,

        // Floating "View Cart" bar — shown when cart has items
        if (itemCount > 0)
          Positioned(
            bottom: 85,
            left: 20,
            right: 20,
            child: GestureDetector(
              onTap: () => _onNavTap(context, 2),
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [SahimedColors.primary, Color(0xFF4F46E5)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: [
                    BoxShadow(
                      color: SahimedColors.primary.withOpacity(0.35),
                      blurRadius: 20,
                      offset: const Offset(0, 10),
                    ),
                  ],
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.2),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            LucideIcons.shoppingCart,
                            color: Colors.white,
                            size: 18,
                          ),
                        ).animate(onPlay: (c) => c.repeat()).shimmer(duration: const Duration(seconds: 2)),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Row(
                                children: [
                                  Text(
                                    '$itemCount ITEMS',
                                    style: GoogleFonts.outfit(
                                      fontSize: 10,
                                      fontWeight: FontWeight.w900,
                                      color: Colors.white.withOpacity(0.8),
                                      letterSpacing: 1.2,
                                    ),
                                  ),
                                  if (cart.totalSavings > 0) ...[
                                    const SizedBox(width: 8),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: SahimedColors.emerald500,
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                      child: Text(
                                        'SAVED ₹${cart.totalSavings.toStringAsFixed(0)}',
                                        style: GoogleFonts.outfit(
                                          fontSize: 8,
                                          fontWeight: FontWeight.w900,
                                          color: Colors.white,
                                        ),
                                      ),
                                    ).animate().scale(),
                                  ],
                                ],
                              ),
                              isFreeShipping 
                                ? Text(
                                    'FREE DELIVERY UNLOCKED!',
                                    style: GoogleFonts.outfit(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w900,
                                      color: Colors.white,
                                    ),
                                  ).animate(onPlay: (c) => c.repeat()).shimmer(duration: const Duration(seconds: 3))
                                : Text(
                                    'ADD ₹${remainingForFree.toStringAsFixed(0)} FOR FREE SHIPPING',
                                    style: GoogleFonts.outfit(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w900,
                                      color: Colors.white,
                                    ),
                                  ),
                            ],
                          ),
                        ),
                        Text(
                          '₹${cart.total.toStringAsFixed(0)}',
                          style: GoogleFonts.outfit(
                            fontSize: 18,
                            fontWeight: FontWeight.w900,
                            color: Colors.white,
                          ),
                        ),
                      ],
                    ),
                    if (!isFreeShipping) ...[
                      const SizedBox(height: 12),
                      Stack(
                        children: [
                          Container(
                            height: 3,
                            width: double.infinity,
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.15),
                              borderRadius: BorderRadius.circular(2),
                            ),
                          ),
                          AnimatedContainer(
                            duration: 500.ms,
                            height: 3,
                            width: (MediaQuery.of(context).size.width - 72) * progress,
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(2),
                              boxShadow: [
                                BoxShadow(color: Colors.white.withOpacity(0.3), blurRadius: 4),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ).animate().slideY(begin: 1, end: 0),

        // Bottom Navigation Bar
        Positioned(
          bottom: 0,
          left: 0,
          right: 0,
          child: Container(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(32),
                topRight: Radius.circular(32),
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 25,
                  offset: const Offset(0, -5),
                ),
              ],
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _NavItem(
                  icon: LucideIcons.house,
                  label: 'Home',
                  index: 0,
                  activeTab: activeTab,
                  badge: 0,
                  onTap: () => _onNavTap(context, 0),
                ),
                _NavItem(
                  icon: LucideIcons.layoutGrid,
                  label: 'Categories',
                  index: 1,
                  activeTab: activeTab,
                  badge: 0,
                  onTap: () => _onNavTap(context, 1),
                ),
                _NavItem(
                  icon: LucideIcons.shoppingCart,
                  label: 'Cart',
                  index: 2,
                  activeTab: activeTab,
                  badge: itemCount,
                  onTap: () => _onNavTap(context, 2),
                ),
                _NavItem(
                  icon: LucideIcons.user,
                  label: 'Profile',
                  index: 3,
                  activeTab: activeTab,
                  badge: 0,
                  onTap: () => _onNavTap(context, 3),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _NavItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final int index;
  final int activeTab;
  final int badge;
  final VoidCallback onTap;

  const _NavItem({
    required this.icon,
    required this.label,
    required this.index,
    required this.activeTab,
    required this.badge,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isSelected = activeTab == index;

    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: isSelected
              ? SahimedColors.primary.withOpacity(0.1)
              : Colors.transparent,
          borderRadius: BorderRadius.circular(100),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Stack(
              clipBehavior: Clip.none,
              children: [
                Icon(
                  icon,
                  size: 20,
                  color: isSelected
                      ? SahimedColors.primary
                      : SahimedColors.slate400,
                ),
                if (badge > 0)
                  Positioned(
                    top: -4,
                    right: -4,
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: const BoxDecoration(
                        color: SahimedColors.accent,
                        shape: BoxShape.circle,
                      ),
                      child: Text(
                        badge > 9 ? '9+' : '$badge',
                        style: GoogleFonts.outfit(
                          fontSize: 8,
                          fontWeight: FontWeight.w900,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
            if (isSelected) ...[
              const SizedBox(width: 8),
              Text(
                label,
                style: GoogleFonts.outfit(
                  fontSize: 12,
                  fontWeight: FontWeight.w900,
                  color: SahimedColors.primary,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
