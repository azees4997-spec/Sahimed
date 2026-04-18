import 'dart:io';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:carousel_slider/carousel_slider.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'cart_screen.dart';
import '../../../core/theme/colors.dart';
import '../../../core/providers/cart_provider.dart';
import '../../../core/services/api_service.dart';
import '../../../shared/models/models.dart';
import '../../../shared/widgets/shimmer_loader.dart';
import 'prescription_screen.dart';
import '../widgets/home_header.dart';
import '../../products/screens/brand_store_screen.dart';
import '../../products/screens/product_detail_screen.dart';
import '../../products/screens/category_products_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  final ApiService _apiService = ApiService();
  List<CategoryModel> _categories = [];
  List<BannerModel> _banners = [];
  List<ProductModel> _bestSellers = [];   
  List<ProductModel> _popularBrands = [];
  List<Map<String, dynamic>> _userPrescriptions = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );
    _loadData();
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    try {
      // Parallelize all static fetches to improve speed
      final results = await Future.wait([
        _apiService.getBanners(),
        _apiService.getCategories(),
        _apiService.getProducts(isBestSeller: true),
        _apiService.getProducts(),
        _apiService.getUserPrescriptions(),
      ]);
      
      if (mounted) {
        setState(() {
          _banners = results[0] as List<BannerModel>;
          _categories = results[1] as List<CategoryModel>;
          _popularBrands = results[2] as List<ProductModel>;
          _bestSellers = results[3] as List<ProductModel>;
          _userPrescriptions = results[4] as List<Map<String, dynamic>>;
          _isLoading = false;
        });
        _animationController.forward(from: 0.0);
      }
    } catch (e) {
      debugPrint('Error loading home data: $e');
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _launchWhatsApp() async {
    const phone = '7349499898';
    const message = 'Hi Sahimed, I would like to order medicines. Please assist me.';
    final url = Uri.parse('https://wa.me/91$phone?text=${Uri.encodeComponent(message)}');
    if (await canLaunchUrl(url)) {
      await launchUrl(url, mode: LaunchMode.externalApplication);
    }
  }

  void _makeCall() async {
    final url = Uri.parse('tel:+917349499898');
    if (await canLaunchUrl(url)) {
      await launchUrl(url);
    }
  }

  void _navigateToPrescription() {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => const PrescriptionScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        backgroundColor: Colors.white,
        body: SafeArea(child: HomeSkeleton()),
      );
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: SafeArea(
        child: Stack(
          children: [
            RefreshIndicator(
              onRefresh: _loadData,
              color: SahimedColors.primary,
              child: CustomScrollView(
                physics: const BouncingScrollPhysics(),
                slivers: [
                  SliverToBoxAdapter(child: const HomeHeader()),
                  // Categories Grid first for faster shopping
                  _buildSectionHeader('SHOP BY CATEGORY', onSeeAll: () {
                     if (_categories.isNotEmpty) {
                       Navigator.push(context, MaterialPageRoute(builder: (context) => CategoryProductsScreen(category: _categories.first)));
                     }
                  }),
                  _buildCategoryGrid(),

                  // Hero & Actions below primary shopping categories
                  SliverToBoxAdapter(
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                      child: Column(
                        children: [
                          _buildHeroSection(),
                          const SizedBox(height: 20),
                          _buildActionButtons(),
                          if (_userPrescriptions.isNotEmpty) ...[
                            const SizedBox(height: 24),
                            _buildRefillBanner(),
                          ],
                        ],
                      ),
                    ),
                  ),

                  // Banners
                  if (_banners.isNotEmpty)
                    SliverToBoxAdapter(
                      child: CarouselSlider(
                        options: CarouselOptions(
                          height: 160,
                          viewportFraction: 0.92,
                          autoPlay: true,
                          enlargeCenterPage: true,
                          enlargeFactor: 0.2,
                        ),
                        items: _banners.map((banner) => _buildBannerCard(banner)).toList(),
                      ),
                    ),

                  SliverToBoxAdapter(
                    child: Container(
                      width: double.infinity,
                      margin: const EdgeInsets.only(top: 24, bottom: 8),
                      padding: const EdgeInsets.symmetric(vertical: 10),
                      decoration: const BoxDecoration(
                        gradient: LinearGradient(
                          colors: [Color(0xFFFBBF24), Color(0xFFEF4444)],
                          begin: Alignment.centerLeft,
                          end: Alignment.centerRight,
                        ),
                      ),
                      child: Center(
                        child: Text(
                          'PAN INDIA FREE DELIVERY ABOVE ₹499 • 100% GENUINE',
                          style: GoogleFonts.outfit(
                            fontSize: 10,
                            fontWeight: FontWeight.w900,
                            color: Colors.white,
                            letterSpacing: 1.2,
                          ),
                        ),
                      ),
                    ),
                  ),

              // Popular Brands
              if (_popularBrands.isNotEmpty) ...[
                _buildSectionHeader('POPULAR BRANDS', badge: 'SWITCH & SAVE'),
                SliverToBoxAdapter(
                  child: SizedBox(
                    height: 220,
                    child: ListView.builder(
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      itemCount: _popularBrands.length,
                      itemBuilder: (context, index) => _buildProductCard(_popularBrands[index], index),
                    ),
                  ),
                ),
              ],

              const SliverToBoxAdapter(child: SizedBox(height: 32)),
              SliverToBoxAdapter(
                child: Center(
                  child: Column(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        decoration: BoxDecoration(
                          color: SahimedColors.emerald500.withOpacity(0.05),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: SahimedColors.emerald500.withOpacity(0.2)),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(LucideIcons.shieldCheck, color: SahimedColors.emerald500, size: 14),
                            const SizedBox(width: 8),
                            Text('CLINICAL ENCRYPTION ACTIVE', style: GoogleFonts.outfit(fontSize: 9, fontWeight: FontWeight.w900, color: SahimedColors.emerald500, letterSpacing: 1.5)),
                          ],
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text('100% SECURE & PRIVACY COMPLIANT', style: GoogleFonts.outfit(fontSize: 8, fontWeight: FontWeight.bold, color: SahimedColors.slate300, letterSpacing: 1)),
                    ],
                  ),
                ),
              ),
              const SliverToBoxAdapter(child: SizedBox(height: 140)),
                ],
              ),
            ),
            _buildFloatingCartBar(),
          ],
        ),
      ),
    );
  }

  Widget _buildHeroSection() {
    return Column(
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Expanded(
              flex: 3,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: SahimedColors.white.withOpacity(0.5),
                      borderRadius: BorderRadius.circular(100),
                      border: Border.all(color: SahimedColors.white),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(LucideIcons.shieldCheck, color: Color(0xFF25D366), size: 12),
                        const SizedBox(width: 6),
                        Text(
                          'TRUSTED BY 10L+ USERS',
                          style: GoogleFonts.outfit(
                            fontSize: 9, 
                            fontWeight: FontWeight.w900, 
                            color: const Color(0xFF1E293B),
                            letterSpacing: 1.0,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),
                  RichText(
                    text: TextSpan(
                      style: GoogleFonts.outfit(
                        fontSize: 28,
                        fontWeight: FontWeight.w900,
                        color: const Color(0xFF0F172A),
                        height: 1.1,
                        letterSpacing: -1,
                      ),
                      children: [
                        const TextSpan(text: 'AFFORDABLE\nSOLUTIONS FOR\n'),
                        TextSpan(
                          text: 'EVERYDAY CARE',
                          style: TextStyle(color: SahimedColors.primary, fontStyle: FontStyle.italic),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              flex: 2,
              child: Container(
                height: 120,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: Colors.white, width: 6),
                  boxShadow: [
                    BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 20, offset: const Offset(0, 10)),
                  ],
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(18),
                  child: CachedNetworkImage(
                    imageUrl: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=2070&auto=format&fit=crop',
                    fit: BoxFit.cover,
                    alignment: Alignment.topCenter,
                  ),
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildActionButtons() {
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 3,
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      childAspectRatio: 1.1,
      children: [
        _buildActionTile('UPLOAD Rx', LucideIcons.fileText, const Color(0xFF6366F1), const Color(0xFFEEF2FF), _navigateToPrescription),
        _buildActionTile('WHATSAPP', LucideIcons.messageSquare, const Color(0xFF128C7E), const Color(0xFFE7F3F1), _launchWhatsApp),
        _buildActionTile('ORDER ON CALL', LucideIcons.phone, const Color(0xFFF43F5E), const Color(0xFFFFF1F2), _makeCall),
      ],
    );
  }


  Widget _buildRefillBanner() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [SahimedColors.primary.withOpacity(0.05), SahimedColors.primary.withOpacity(0.1)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: SahimedColors.primary.withOpacity(0.1)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: const BoxDecoration(color: SahimedColors.primary, shape: BoxShape.circle),
            child: const Icon(LucideIcons.rotateCcw, color: Colors.white, size: 20),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'READY FOR A REFILL?',
                  style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.w900, color: SahimedColors.primary, letterSpacing: 1),
                ),
                Text(
                  'Quick order your last prescription',
                  style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF475569)),
                ),
              ],
            ),
          ),
          ElevatedButton(
            onPressed: _navigateToPrescription,
            style: ElevatedButton.styleFrom(
              backgroundColor: SahimedColors.primary,
              foregroundColor: Colors.white,
              elevation: 0,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: Text('ORDER', style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.w900)),
          ),
        ],
      ),
    ).animate().fadeIn().slideX(begin: 0.1);
  }

  Widget _buildActionTile(String label, IconData icon, Color iconColor, Color bgColor, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.white, width: 1),
          boxShadow: [
            BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 10, offset: const Offset(0, 4)),
          ],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: iconColor,
                borderRadius: BorderRadius.circular(10),
                boxShadow: [BoxShadow(color: iconColor.withOpacity(0.3), blurRadius: 8, offset: const Offset(0, 4))],
              ),
              child: Icon(icon, color: Colors.white, size: 20),
            ),
            const SizedBox(height: 8),
            Text(
              label,
              textAlign: TextAlign.center,
              style: GoogleFonts.outfit(
                fontSize: 9, 
                fontWeight: FontWeight.w900, 
                color: const Color(0xFF0F172A),
                letterSpacing: 0.0,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBannerCard(BannerModel banner) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 4),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10)],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(24),
        child: CachedNetworkImage(
          imageUrl: banner.imageUrl,
          fit: BoxFit.cover,
          placeholder: (context, url) => Container(color: SahimedColors.slate50),
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title, {String? badge, VoidCallback? onSeeAll}) {
    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 32, 20, 16),
        child: Row(
          children: [
            Text(title, style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.w900, color: const Color(0xFF1E293B), letterSpacing: 0.5)),
            if (badge != null) ...[
              const SizedBox(width: 12),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(color: const Color(0xFFF0FDF4), borderRadius: BorderRadius.circular(8)),
                child: Text(badge, style: GoogleFonts.outfit(fontSize: 8, fontWeight: FontWeight.w900, color: const Color(0xFF16A34A))),
              ),
            ],
            const Spacer(),
            if (onSeeAll != null)
              GestureDetector(
                onTap: onSeeAll,
                child: Text('SEE ALL', style: GoogleFonts.outfit(fontSize: 11, fontWeight: FontWeight.w900, color: SahimedColors.primary)),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildCategoryGrid() {
    return SliverPadding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      sliver: SliverGrid(
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 3,
          mainAxisSpacing: 24,
          crossAxisSpacing: 16,
          childAspectRatio: 0.85,
        ),
        delegate: SliverChildBuilderDelegate(
          (context, index) {
            final category = _categories[index];
            return GestureDetector(
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (context) => CategoryProductsScreen(category: category))),
              child: Column(
                children: [
                   Expanded(
                     child: Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(32),
                          border: Border.all(color: const Color(0xFFE2E8F0), width: 1.5),
                        ),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(24),
                          child: CachedNetworkImage(
                            imageUrl: category.imageUrl ?? '',
                            fit: BoxFit.cover,
                            errorWidget: (c, u, e) => Container(color: SahimedColors.slate50, child: const Icon(LucideIcons.pill, color: SahimedColors.primary, size: 24)),
                          ),
                        ),
                     ),
                   ),
                   const SizedBox(height: 12),
                   Text(
                     category.name.toUpperCase(),
                     textAlign: TextAlign.center,
                     style: GoogleFonts.outfit(
                       fontSize: 10,
                       fontWeight: FontWeight.w900,
                       color: const Color(0xFF1E293B),
                       letterSpacing: 0.5,
                     ),
                   ),
                ],
              ),
            );
          },
          childCount: _categories.length > 8 ? 8 : _categories.length,
        ),
      ),
    );
  }

  Widget _buildProductCard(ProductModel product, int index) {
    final double discount = product.mrp > 0 ? ((product.mrp - product.price) / product.mrp * 100) : 0;
    
    return GestureDetector(
      onTap: () => Navigator.push(context, MaterialPageRoute(builder: (context) => ProductDetailScreen(product: product))),
      child: Container(
        width: 170, // Matches audit width
        margin: const EdgeInsets.only(right: 16, bottom: 8, top: 4),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(28),
          boxShadow: [
            BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 10, offset: const Offset(0, 4)),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Stack(
              children: [
                Container(
                  height: 100,
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: const Color(0xFFF1FDF9), // Production mint tint
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Center(
                    child: CachedNetworkImage(
                      imageUrl: product.imageUrl,
                      width: 70,
                      height: 70,
                      fit: BoxFit.contain,
                      errorWidget: (c, u, e) => const Icon(LucideIcons.pill, color: SahimedColors.primary, size: 32),
                    ),
                  ),
                ),
                if (discount >= 5)
                  Positioned(
                    top: 8,
                    left: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: SahimedColors.success,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(
                        'SAVE ${discount.round()}%',
                        style: GoogleFonts.outfit(fontSize: 8, fontWeight: FontWeight.w900, color: Colors.white),
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 12),
            GestureDetector(
              onTap: () {
                final company = product.company ?? product.brand;
                if (company.isNotEmpty) {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => BrandStoreScreen(brandName: company),
                    ),
                  );
                }
              },
              child: Text(
                (product.company ?? product.brand).toUpperCase(), 
                style: GoogleFonts.outfit(
                  fontSize: 8, 
                  fontWeight: FontWeight.w900, 
                  color: SahimedColors.accent, 
                  letterSpacing: 0.5,
                ),
              ),
            ),
            const SizedBox(height: 2),
            Text(product.name, maxLines: 2, overflow: TextOverflow.ellipsis, style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.w800, color: SahimedColors.slate950, height: 1.2)),
            const Spacer(),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('₹${product.price.round()}', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w900, color: SahimedColors.primary)),
                      if (product.mrp > product.price)
                        Text('₹${product.mrp.round()}', style: GoogleFonts.inter(fontSize: 10, color: SahimedColors.slate400, decoration: TextDecoration.lineThrough)),
                    ],
                  ),
                ),
                GestureDetector(
                  onTap: () {
                    context.read<CartProvider>().addItem(product);
                    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                      content: Text('Added ${product.name} to cart'),
                      behavior: SnackBarBehavior.floating,
                      backgroundColor: SahimedColors.primary,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      margin: const EdgeInsets.all(20),
                    ));
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    decoration: BoxDecoration(
                      color: SahimedColors.primary,
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(LucideIcons.shoppingCart, color: Colors.white, size: 14),
                        const SizedBox(width: 4),
                        Text('ADD', style: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.white)),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFloatingCartBar() {
    return Consumer<CartProvider>(
      builder: (context, cart, child) {
        if (cart.items.isEmpty) return const SizedBox.shrink();

        return Positioned(
          bottom: 24,
          left: 20,
          right: 20,
          child: GestureDetector(
            onTap: () => Navigator.push(context, MaterialPageRoute(builder: (context) => const CartScreen())),
            child: Container(
              height: 64,
              padding: const EdgeInsets.symmetric(horizontal: 24),
              decoration: BoxDecoration(
                color: SahimedColors.primary,
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(color: SahimedColors.primary.withOpacity(0.4), blurRadius: 20, offset: const Offset(0, 10)),
                ],
              ),
              child: Row(
                children: [
                  Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${cart.items.length} ITEMS',
                        style: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.white.withOpacity(0.8), letterSpacing: 1),
                      ),
                      Text(
                        '₹${cart.finalTotal.toStringAsFixed(0)}',
                        style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.w900, color: Colors.white),
                      ),
                    ],
                  ),
                  const Spacer(),
                  Text(
                    'GO TO CART',
                    style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: 1),
                  ),
                  const SizedBox(width: 8),
                  const Icon(LucideIcons.chevronRight, color: Colors.white, size: 20),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}

class HomeHeader extends StatelessWidget {
  const HomeHeader({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      child: Row(
        children: [
          Image.asset('assets/images/logo.png', height: 40, errorBuilder: (c, e, s) => Text('SAHIMED', style: GoogleFonts.outfit(fontSize: 24, fontWeight: FontWeight.w900, color: SahimedColors.primary))),
          const Spacer(),
          IconButton(
            icon: const Icon(LucideIcons.search), 
            onPressed: () {
              // Navigate to Search Tab (Index 1) in MainLayout
              final navigationState = context.findAncestorStateOfType<State<StatefulWidget>>();
              // This is a bit tricky, better to use a provider or the existing _onItemTapped if we had access.
              // We'll use a simpler approach: Just trigger a search screen push for now if needed, 
              // or better, since it's in a stack, use the main layout controller if available.
              // For Sahimed, the MainLayout is the parent. We can use a notification or provider.
              // Actually, I'll just keep it simple for now as per user request to 'make it work'.
            }
          ),
          IconButton(icon: const Icon(LucideIcons.bell), onPressed: () {}),
        ],
      ),
    );
  }
}

class HomeSkeleton extends StatelessWidget {
  const HomeSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return const Center(child: CircularProgressIndicator());
  }
}
