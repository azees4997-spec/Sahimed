import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../theme/colors.dart';
import '../providers/cart_provider.dart';
import '../providers/navigation_provider.dart';

// Screens
import '../../../features/home/screens/home_screen.dart';
import '../../../features/products/screens/categories_screen.dart';
import '../../../features/home/screens/cart_screen.dart';
import '../../../features/profile/screens/profile_screen.dart';

class MainLayout extends StatefulWidget {
  const MainLayout({super.key});

  @override
  State<MainLayout> createState() => _MainLayoutState();
}

class _MainLayoutState extends State<MainLayout> {
  final List<Widget> _screens = [
    const HomeScreen(),
    const CategoriesScreen(),
    const CartScreen(),
    const ProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    final navProvider = context.watch<NavigationProvider>();
    final currentIndex = navProvider.currentIndex;

    return PopScope(
      canPop: currentIndex == 0,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
        if (currentIndex != 0) {
          navProvider.switchTab(0);
        }
      },
      child: Scaffold(
        backgroundColor: SahimedColors.background,
        body: SafeArea(
          top: true,
          bottom: false,
          child: Stack(
            fit: StackFit.expand,
            children: [
              IndexedStack(
                index: currentIndex,
                children: _screens,
              ),

              // Persistent Cart Summary - Only rebuilds when cart items or tab change
              Consumer<CartProvider>(
                builder: (context, cart, _) {
                  // Hide on Cart (2) and Profile (3) tabs
                  if (cart.items.isNotEmpty && currentIndex < 2) {
                    return Positioned(
                      bottom: 12,
                      left: 16,
                      right: 16,
                      child: _buildCartSummary(cart),
                    ).animate().slideY(begin: 1, end: 0, curve: Curves.easeOutCubic, duration: 500.ms).fadeIn();
                  }
                  return const SizedBox.shrink();
                },
              ),
            ],
          ),
        ),
        bottomNavigationBar: _buildBottomNavigationBar(context, currentIndex),
      ),
    );
  }

  Widget _buildBottomNavigationBar(BuildContext context, int currentIndex) {
    return Consumer<CartProvider>(
      builder: (context, cart, _) {
        return Container(
          decoration: BoxDecoration(
            color: Colors.white,
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.04),
                blurRadius: 20,
                offset: const Offset(0, -5),
              ),
            ],
          ),
          child: BottomNavigationBar(
            currentIndex: currentIndex,
            onTap: (index) {
              HapticFeedback.mediumImpact();
              context.read<NavigationProvider>().switchTab(index);
            },
            type: BottomNavigationBarType.fixed,
            backgroundColor: Colors.white,
            selectedItemColor: SahimedColors.primary,
            unselectedItemColor: SahimedColors.slate400,
            selectedLabelStyle: GoogleFonts.outfit(
              fontWeight: FontWeight.w900,
              fontSize: 10,
              letterSpacing: 0.5,
            ),
            unselectedLabelStyle: GoogleFonts.outfit(
              fontWeight: FontWeight.w700,
              fontSize: 10,
              letterSpacing: 0.5,
            ),
            elevation: 0,
            items: [
              const BottomNavigationBarItem(
                icon: Icon(LucideIcons.house),
                activeIcon: Icon(LucideIcons.house, size: 24),
                label: 'HOME',
              ),
              const BottomNavigationBarItem(
                icon: Icon(LucideIcons.layoutGrid),
                activeIcon: Icon(LucideIcons.layoutGrid, size: 24),
                label: 'CATEGORIES',
              ),
              BottomNavigationBarItem(
                icon: Badge(
                  label: Text(cart.items.length.toString()),
                  isLabelVisible: cart.items.isNotEmpty,
                  child: const Icon(LucideIcons.shoppingCart),
                ),
                activeIcon: Badge(
                  label: Text(cart.items.length.toString()),
                  isLabelVisible: cart.items.isNotEmpty,
                  child: const Icon(LucideIcons.shoppingCart, size: 24),
                ),
                label: 'CART',
              ),
              const BottomNavigationBarItem(
                icon: Icon(LucideIcons.user),
                activeIcon: Icon(LucideIcons.user, size: 24),
                label: 'PROFILE',
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildCartSummary(CartProvider cart) {
    final double freeShippingThreshold = 499.0;
    final double remainingForFree = freeShippingThreshold - cart.total;
    final bool isFreeShipping = remainingForFree <= 0;
    final double progress = (cart.total / freeShippingThreshold).clamp(0.0, 1.0);

    return GestureDetector(
      onTap: () {
        HapticFeedback.mediumImpact();
        context.read<NavigationProvider>().switchTab(2);
      },
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
              color: SahimedColors.primary.withAlpha(76),
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
                // Cart Icon with pulse
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.white.withAlpha(51),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    LucideIcons.shoppingCart,
                    color: Colors.white,
                    size: 18,
                  ),
                ).animate(onPlay: (controller) => controller.repeat())
                 .shimmer(duration: 2.seconds, color: Colors.white30),
                
                const SizedBox(width: 12),
                
                // Items and Savings
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(
                            '${cart.items.length} ITEMS',
                            style: GoogleFonts.outfit(
                              fontSize: 10,
                              fontWeight: FontWeight.w900,
                              color: Colors.white.withAlpha(204),
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
                            ).animate().scale(delay: 200.ms),
                          ],
                        ],
                      ),
                      const SizedBox(height: 2),
                      isFreeShipping 
                        ? Text(
                            'FREE DELIVERY UNLOCKED!',
                            style: GoogleFonts.outfit(
                              fontSize: 12,
                              fontWeight: FontWeight.w900,
                              color: Colors.white,
                            ),
                          ).animate(onPlay: (c) => c.repeat())
                           .shimmer(duration: 3.seconds, color: Colors.amberAccent.withOpacity(0.5))
                        : Text(
                            'ADD ₹${remainingForFree.toStringAsFixed(0)} MORE FOR FREE DELIVERY',
                            style: GoogleFonts.outfit(
                              fontSize: 12,
                              fontWeight: FontWeight.w900,
                              color: Colors.white,
                            ),
                          ),
                    ],
                  ),
                ),
                
                // Total and Arrow
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      '₹${cart.total.toStringAsFixed(0)}',
                      style: GoogleFonts.outfit(
                        fontSize: 18,
                        fontWeight: FontWeight.w900,
                        color: Colors.white,
                      ),
                    ),
                    const Icon(
                      Icons.keyboard_arrow_right_rounded,
                      color: Colors.white70,
                      size: 16,
                    ),
                  ],
                ),
              ],
            ),
            
            // Progress Bar for Free Shipping
            if (!isFreeShipping) ...[
              const SizedBox(height: 12),
              Stack(
                children: [
                  Container(
                    height: 4,
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                  AnimatedContainer(
                    duration: 600.ms,
                    height: 4,
                    width: (MediaQuery.of(context).size.width - 64) * progress,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(2),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.white.withOpacity(0.5),
                          blurRadius: 4,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}

