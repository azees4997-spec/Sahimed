import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:provider/provider.dart';
import '../theme/colors.dart';
import '../providers/cart_provider.dart';
import '../providers/navigation_provider.dart';

/// Wraps any pushed screen with the persistent floating cart bar
/// and bottom navigation bar — just like the main layout shows.
///
/// Usage:
///   Navigator.push(context, MaterialPageRoute(
///     builder: (_) => ScreenWithNav(child: ProductDetailScreen(product: p)),
///   ));
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

    return Stack(
      children: [
        // The actual screen content
        child,

        // Floating "View Cart" bar — shown when cart has items
        if (itemCount > 0)
          Positioned(
            bottom: 110,
            left: 20,
            right: 20,
            child: GestureDetector(
              onTap: () => _onNavTap(context, 2),
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 20,
                  vertical: 16,
                ),
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
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        LucideIcons.shoppingBag,
                        color: Colors.white,
                        size: 18,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          '$itemCount ITEMS IN CART',
                          style: GoogleFonts.outfit(
                            fontSize: 10,
                            fontWeight: FontWeight.w900,
                            color: Colors.white.withOpacity(0.8),
                            letterSpacing: 1.2,
                          ),
                        ),
                        Text(
                          'VIEW BASKET',
                          style: GoogleFonts.outfit(
                            fontSize: 14,
                            fontWeight: FontWeight.w900,
                            color: Colors.white,
                          ),
                        ),
                      ],
                    ),
                    const Spacer(),
                    Text(
                      '₹${cart.total.toStringAsFixed(0)}',
                      style: GoogleFonts.outfit(
                        fontSize: 18,
                        fontWeight: FontWeight.w900,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(width: 12),
                    const Icon(
                      Icons.arrow_forward_ios_rounded,
                      color: Colors.white,
                      size: 14,
                    ),
                  ],
                ),
              ),
            ),
          ),

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
                  icon: LucideIcons.search,
                  label: 'Explore',
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
