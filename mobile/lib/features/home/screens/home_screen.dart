import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/colors.dart';
import '../../../core/providers/cart_provider.dart';
import '../../../core/providers/navigation_provider.dart';
import '../../../core/services/api_service.dart';

import '../../../shared/models/models.dart';
import 'prescription_screen.dart';
import '../../products/screens/product_detail_screen.dart';
import '../../products/screens/category_products_screen.dart';

// ─── color tokens matching the website ──────────────────────────────────────
const _lavender   = Color(0xFFEDE9FE);
const _sahiPink   = Color(0xFFFFF1F2);
const _sahiBlue   = Color(0xFFEFF6FF);
const _sahiGreen  = Color(0xFFECFDF5);
const _bgPage     = Color(0xFFF8FAFC);
const _waGreen    = Color(0xFF25D366);

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final _api = ApiService();

  List<CategoryModel>  _categories   = [];
  List<ProductModel>   _bestSellers  = [];
  List<ProductModel>   _medicines    = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final results = await Future.wait([
        _api.getCategories(),
        _api.getProducts(isBestSeller: true),
        _api.getProducts(),
      ]);
      if (mounted) {
        setState(() {
          _categories  = results[0] as List<CategoryModel>;
          _bestSellers = (results[1] as List<ProductModel>).take(3).toList();
          _medicines   = (results[2] as List<ProductModel>).take(20).toList();
          _isLoading   = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  // ── Helpers ──────────────────────────────────────────────────────────────
  Future<void> _launch(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  void _goSearch(BuildContext context) {
    context.read<NavigationProvider>().switchTab(1);
  }

  void _openProduct(BuildContext context, ProductModel p) {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => ProductDetailScreen(product: p)),
    );
  }

  void _openCategory(BuildContext context, CategoryModel cat) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => CategoryProductsScreen(category: cat),
      ),
    );
  }

  // ── Category background cycle (lavender / sahi-pink / sahi-blue / sahi-green)
  Color _catBg(int i) {
    const list = [_lavender, _sahiPink, _sahiBlue, _sahiGreen];
    return list[i % 4];
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bgPage,
      body: RefreshIndicator(
        onRefresh: _load,
        color: SahimedColors.primary,
        child: ListView(
          padding: const EdgeInsets.only(bottom: 180),
          children: [
            // ── 1. Hero Section ─────────────────────────────────────────────
            _buildHero(context),

            const SizedBox(height: 28),

            // ── 2. Most Popular Brands (3-col grid, best sellers) ───────────
            if (_isLoading || _bestSellers.isNotEmpty)
              _buildSection(
                title: 'Our Most Popular Brands',
                trailing: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFEF9C3),
                    borderRadius: BorderRadius.circular(100),
                  ),
                  child: Text(
                    'BEST SELLERS',
                    style: GoogleFonts.outfit(
                      fontSize: 7,
                      fontWeight: FontWeight.w900,
                      color: const Color(0xFFB45309),
                      letterSpacing: 1,
                    ),
                  ),
                ),
                child: _isLoading
                    ? _shimmerGrid(3)
                    : _productGrid(_bestSellers, context),
              ),

            const SizedBox(height: 28),

            // ── 3. Top Categories ───────────────────────────────────────────
            _buildSection(
              title: 'Top Categories',
              trailing: GestureDetector(
                onTap: () => _goSearch(context),
                child: Row(
                  children: [
                    Text(
                      'EXPLORE ALL',
                      style: GoogleFonts.outfit(
                        fontSize: 9,
                        fontWeight: FontWeight.w900,
                        color: SahimedColors.primary,
                        letterSpacing: 1,
                      ),
                    ),
                    const Icon(LucideIcons.chevronRight,
                        size: 14, color: SahimedColors.primary),
                  ],
                ),
              ),
              child: _isLoading
                  ? _shimmerGrid(9)
                  : _categoryGrid(context),
            ),

            const SizedBox(height: 28),

            // ── 4. Free Delivery Banner ───────────────────────────────────
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: _buildDeliveryBanner(context),
            ),

            const SizedBox(height: 28),

            // ── 5. Best Sellers (horizontal scroll) ───────────────────────
            _buildSection(
              title: 'Best Sellers',
              child: _isLoading
                  ? _shimmerHScroll()
                  : _horizontalProductScroll(context),
            ),
          ],
        ),
      ),
    );
  }

  // ── Hero Section ─────────────────────────────────────────────────────────
  Widget _buildHero(BuildContext context) {
    return Container(
      color: const Color(0xFFFFF9F9),
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Row 1: Text + Image
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // Left text block
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // "Trusted by 10L+ users" pill
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.7),
                        borderRadius: BorderRadius.circular(100),
                        border: Border.all(
                            color: Colors.white.withValues(alpha: 0.7)),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            width: 14,
                            height: 14,
                            decoration: const BoxDecoration(
                              color: _waGreen,
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(LucideIcons.shieldCheck,
                                size: 9, color: Colors.white),
                          ),
                          const SizedBox(width: 6),
                          Text(
                            'Trusted by 10L+ users',
                            style: GoogleFonts.outfit(
                              fontSize: 9,
                              fontWeight: FontWeight.w900,
                              color: const Color(0xFF1E293B),
                              letterSpacing: 1,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 8),
                    // Headline
                    Text.rich(
                      TextSpan(
                        children: [
                          TextSpan(
                            text: 'Affordable\nSolutions for\n',
                            style: GoogleFonts.outfit(
                              fontSize: 24,
                              fontWeight: FontWeight.w900,
                              color: const Color(0xFF0F172A),
                              height: 1.1,
                              letterSpacing: -0.5,
                            ),
                          ),
                          TextSpan(
                            text: 'Everyday Care',
                            style: GoogleFonts.outfit(
                              fontSize: 24,
                              fontWeight: FontWeight.w900,
                              color: SahimedColors.primary,
                              fontStyle: FontStyle.italic,
                              height: 1.1,
                              letterSpacing: -0.5,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(width: 12),

              // Right image (rounded)
              Container(
                width: 130,
                height: 130,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: Colors.white, width: 5),
                  boxShadow: const [
                    BoxShadow(
                      color: Color(0x22000000),
                      blurRadius: 16,
                      offset: Offset(0, 8),
                    ),
                  ],
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: CachedNetworkImage(
                    imageUrl:
                        'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=600&auto=format&fit=crop',
                    fit: BoxFit.cover,
                    alignment: Alignment.topCenter,
                    errorWidget: (c, u, e) => Container(
                      color: _lavender,
                      child: const Icon(LucideIcons.heartPulse,
                          color: SahimedColors.primary, size: 40),
                    ),
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 16),

          // Row 2: Search bar
          GestureDetector(
            onTap: () => _goSearch(context),
            child: Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(100),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x18000000),
                    blurRadius: 20,
                    offset: Offset(0, 6),
                  ),
                ],
                border: Border.all(color: const Color(0xFFF1F5F9)),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.only(left: 20),
                      child: Text(
                        'Search Medicines...',
                        style: GoogleFonts.outfit(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFF94A3B8),
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                  ),
                  Container(
                    margin: const EdgeInsets.all(4),
                    padding: const EdgeInsets.all(11),
                    decoration: BoxDecoration(
                      color: SahimedColors.primary,
                      borderRadius: BorderRadius.circular(100),
                      boxShadow: [
                        BoxShadow(
                          color: SahimedColors.primary.withValues(alpha: 0.3),
                          blurRadius: 8,
                          offset: const Offset(0, 3),
                        ),
                      ],
                    ),
                    child: const Icon(LucideIcons.search,
                        size: 16, color: Colors.white),
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 16),

          // Row 3: Quick Actions (Upload Rx / WhatsApp / Order on Call)
          Row(
            children: [
              _quickAction(
                label: 'Upload Rx',
                iconBg: SahimedColors.primary,
                tileBg: _lavender,
                icon: LucideIcons.fileText,
                onTap: () => Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const PrescriptionScreen()),
                ),
              ),
              const SizedBox(width: 10),
              _quickAction(
                label: 'WhatsApp',
                iconBg: _waGreen,
                tileBg: const Color(0xFFF0FDF4),
                icon: LucideIcons.messageCircle,
                onTap: () => _launch(
                    'https://wa.me/917349499898?text=Hi%20Sahimed%2C%20I%20would%20like%20to%20order%20medicines.'),
              ),
              const SizedBox(width: 10),
              _quickAction(
                label: 'Order on Call',
                iconBg: const Color(0xFFEF4444),
                tileBg: _sahiPink,
                icon: LucideIcons.phone,
                onTap: () => _launch('tel:+917349499898'),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _quickAction({
    required String label,
    required Color iconBg,
    required Color tileBg,
    required IconData icon,
    required VoidCallback onTap,
  }) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 4),
          decoration: BoxDecoration(
            color: tileBg,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.white, width: 1.5),
            boxShadow: const [
              BoxShadow(
                color: Color(0x12000000),
                blurRadius: 12,
                offset: Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: iconBg,
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: [
                    BoxShadow(
                      color: iconBg.withValues(alpha: 0.35),
                      blurRadius: 8,
                      offset: const Offset(0, 3),
                    ),
                  ],
                ),
                child: Icon(icon, size: 18, color: Colors.white),
              ),
              const SizedBox(height: 6),
              Text(
                label.toUpperCase(),
                textAlign: TextAlign.center,
                style: GoogleFonts.outfit(
                  fontSize: 7.5,
                  fontWeight: FontWeight.w900,
                  color: const Color(0xFF0F172A),
                  letterSpacing: 0.5,
                  height: 1.2,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ── Generic Section Wrapper ───────────────────────────────────────────────
  Widget _buildSection({
    required String title,
    required Widget child,
    Widget? trailing,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                title.toUpperCase(),
                style: GoogleFonts.outfit(
                  fontSize: 14,
                  fontWeight: FontWeight.w900,
                  color: SahimedColors.primary,
                  letterSpacing: -0.3,
                ),
              ),
              if (trailing != null) trailing,
            ],
          ),
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }

  // ── Product 3-column grid ─────────────────────────────────────────────────
  Widget _productGrid(List<ProductModel> products, BuildContext context) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        crossAxisSpacing: 8,
        mainAxisSpacing: 8,
        childAspectRatio: 0.55,
      ),
      itemCount: products.length,
      itemBuilder: (_, i) => _ProductCard(
        product: products[i],
        onTap: () => _openProduct(context, products[i]),
      ),
    );
  }

  // ── Category 3-column grid ────────────────────────────────────────────────
  Widget _categoryGrid(BuildContext context) {
    final cats = _categories.take(9).toList();
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        crossAxisSpacing: 12,
        mainAxisSpacing: 16,
        childAspectRatio: 0.9,
      ),
      itemCount: cats.length,
      itemBuilder: (_, i) {
        final cat = cats[i];
        return GestureDetector(
          onTap: () => _openCategory(context, cat),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Circle image — exactly as website
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  color: _catBg(i),
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 4),
                  boxShadow: const [
                    BoxShadow(
                      color: Color(0x14000000),
                      blurRadius: 12,
                      offset: Offset(0, 4),
                    ),
                  ],
                ),
                clipBehavior: Clip.antiAlias,
                child: ClipOval(
                  child: CachedNetworkImage(
                    imageUrl: cat.imageUrl,
                    fit: BoxFit.cover,
                    width: 80,
                    height: 80,
                    errorWidget: (c, u, e) => Icon(
                      LucideIcons.pill,
                      color: SahimedColors.primary,
                      size: 28,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 6),
              Text(
                cat.name.toUpperCase(),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                textAlign: TextAlign.center,
                style: GoogleFonts.outfit(
                  fontSize: 7.5,
                  fontWeight: FontWeight.w900,
                  color: const Color(0xFF64748B),
                  letterSpacing: 0.5,
                  height: 1.2,
                ),
              ),
            ],
          ),
        );
      },
    );
  }


  // ── Free Delivery Banner ──────────────────────────────────────────────────
  Widget _buildDeliveryBanner(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFFBBF24), Color(0xFFF97316), Color(0xFFE11D48)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(28),
        boxShadow: const [
          BoxShadow(
            color: Color(0x33F97316),
            blurRadius: 20,
            offset: Offset(0, 8),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Pan India Free\nDelivery Above ₹499',
                  style: GoogleFonts.outfit(
                    fontSize: 16,
                    fontWeight: FontWeight.w900,
                    color: Colors.white,
                    height: 1.2,
                    letterSpacing: -0.3,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'ORDER NOW & SAVE MORE',
                  style: GoogleFonts.outfit(
                    fontSize: 8,
                    fontWeight: FontWeight.bold,
                    color: Colors.white.withValues(alpha: 0.8),
                    letterSpacing: 1,
                  ),
                ),
                const SizedBox(height: 12),
                GestureDetector(
                  onTap: () => _goSearch(context),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 18, vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(100),
                      boxShadow: const [
                        BoxShadow(
                          color: Color(0x22000000),
                          blurRadius: 8,
                          offset: Offset(0, 3),
                        ),
                      ],
                    ),
                    child: Text(
                      'SHOP NOW',
                      style: GoogleFonts.outfit(
                        fontSize: 9,
                        fontWeight: FontWeight.w900,
                        color: SahimedColors.primary,
                        letterSpacing: 1,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(18),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x22000000),
                  blurRadius: 12,
                )
              ],
            ),
            child: const Icon(LucideIcons.package,
                color: SahimedColors.primary, size: 30),
          ),
        ],
      ),
    );
  }

  // ── Horizontal product scroll (Best Sellers section) ────────────────────
  Widget _horizontalProductScroll(BuildContext context) {
    return SizedBox(
      height: 290,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: _medicines.length,
        separatorBuilder: (_, __) => const SizedBox(width: 10),
        itemBuilder: (_, i) => SizedBox(
          width: 148,
          child: _ProductCard(
            product: _medicines[i],
            onTap: () => _openProduct(context, _medicines[i]),
          ),
        ),
      ),
    );
  }

  // ── Shimmer placeholders ──────────────────────────────────────────────────
  Widget _shimmerGrid(int count) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        crossAxisSpacing: 8,
        mainAxisSpacing: 8,
        childAspectRatio: 0.75,
      ),
      itemCount: count,
      itemBuilder: (_, __) => Container(
        decoration: BoxDecoration(
          color: const Color(0xFFE2E8F0),
          borderRadius: BorderRadius.circular(20),
        ),
      ),
    );
  }

  Widget _shimmerHScroll() {
    return SizedBox(
      height: 240,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: 4,
        separatorBuilder: (_, __) => const SizedBox(width: 10),
        itemBuilder: (_, __) => Container(
          width: 145,
          decoration: BoxDecoration(
            color: const Color(0xFFE2E8F0),
            borderRadius: BorderRadius.circular(20),
          ),
        ),
      ),
    );
  }
}

// ─── Product Card ─────────────────────────────────────────────────────────────
// Matching the website's ProductCard component layout
class _ProductCard extends StatelessWidget {
  final ProductModel product;
  final VoidCallback onTap;

  const _ProductCard({required this.product, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final cart = context.watch<CartProvider>();
    final inCart = cart.items.any((i) => i.product.id == product.id);
    final qty = inCart
        ? cart.items.firstWhere((i) => i.product.id == product.id).quantity
        : 0;
    final savings = product.mrp > product.price
        ? ((product.mrp - product.price) / product.mrp * 100).round()
        : 0;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: const Color(0xFFF1F5F9)),
          boxShadow: const [
            BoxShadow(
              color: Color(0x08000000),
              blurRadius: 8,
              offset: Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image area — fixed height so info section always has room
            Container(
              height: 90,
              width: double.infinity,
              decoration: const BoxDecoration(
                color: Color(0xFFF8FAFC),
                borderRadius:
                    BorderRadius.vertical(top: Radius.circular(20)),
              ),
              child: Stack(
                children: [
                  ClipRRect(
                    borderRadius:
                        const BorderRadius.vertical(top: Radius.circular(20)),
                    child: CachedNetworkImage(
                      imageUrl: product.imageUrl,
                      width: double.infinity,
                      height: 90,
                      fit: BoxFit.contain,
                      errorWidget: (c, u, e) => const Icon(LucideIcons.pill,
                          color: SahimedColors.primary, size: 28),
                    ),
                  ),
                  if (savings > 0)
                    Positioned(
                      top: 6,
                      left: 6,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 5, vertical: 2),
                        decoration: BoxDecoration(
                          color: SahimedColors.primary,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          '-$savings%',
                          style: GoogleFonts.outfit(
                            fontSize: 7,
                            fontWeight: FontWeight.w900,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),

            // Info area
            Padding(
              padding: const EdgeInsets.fromLTRB(8, 6, 8, 8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    product.name.toUpperCase(),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.outfit(
                      fontSize: 9,
                      fontWeight: FontWeight.w900,
                      color: const Color(0xFF1E293B),
                      height: 1.2,
                    ),
                  ),
                  const SizedBox(height: 2),
                  if (product.packSize != null)
                    Text(
                      product.packSize!,
                      style: GoogleFonts.outfit(
                        fontSize: 7,
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFF94A3B8),
                        letterSpacing: 0.5,
                      ),
                    ),
                  const SizedBox(height: 4),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        '₹${product.price.toStringAsFixed(0)}',
                        style: GoogleFonts.outfit(
                          fontSize: 14,
                          fontWeight: FontWeight.w900,
                          color: SahimedColors.primary,
                          height: 1,
                        ),
                      ),
                      if (product.mrp > product.price) ...[
                        const SizedBox(width: 4),
                        Text(
                          '₹${product.mrp.toStringAsFixed(0)}',
                          style: GoogleFonts.outfit(
                            fontSize: 8,
                            fontWeight: FontWeight.bold,
                            color: const Color(0xFF94A3B8),
                            decoration: TextDecoration.lineThrough,
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 6),
                  // ADD button
                  GestureDetector(
                    onTap: () => context.read<CartProvider>().addItem(product),
                    child: Container(
                      width: double.infinity,
                      height: 28,
                      decoration: BoxDecoration(
                        color: SahimedColors.primary,
                        borderRadius: BorderRadius.circular(100),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            qty > 0 ? 'IN CART ($qty)' : 'ADD',
                            style: GoogleFonts.outfit(
                              fontSize: 8,
                              fontWeight: FontWeight.w900,
                              color: Colors.white,
                              letterSpacing: 0.5,
                            ),
                          ),
                          const SizedBox(width: 4),
                          const Icon(LucideIcons.shoppingCart,
                              size: 10, color: Colors.white),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
