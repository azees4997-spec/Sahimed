import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/colors.dart';

import '../../../core/services/api_service.dart';
import '../../../core/services/permission_service.dart';
import '../../../shared/models/models.dart';

import 'prescription_screen.dart';
import '../../products/screens/category_products_screen.dart';
import '../../products/screens/search_screen.dart';

import '../../products/widgets/product_card.dart';
import '../widgets/home_header.dart';

// ─── color tokens matching the website ──────────────────────────────────────
const _lavender = Color(0xFFEDE9FE);
const _sahiPink = Color(0xFFFFF1F2);
const _sahiBlue = Color(0xFFEFF6FF);
const _sahiGreen = Color(0xFFECFDF5);
const _bgPage = Color(0xFFF8FAFC);
const _waGreen = Color(0xFF25D366);

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final _api = ApiService();

  List<CategoryModel> _categories = [];
  List<ProductModel> _bestSellers = [];
  List<ProductModel> _medicines = [];
  bool _isLoading = true;
  // BUG-09 FIX: Removed dead _pincode variable

  @override
  void initState() {
    super.initState();
    _load();
    _requestInitialPermissions();
  }

  Future<void> _requestInitialPermissions() async {
    // Non-blocking request for notifications on app start
    await Future.delayed(const Duration(seconds: 2));
    if (mounted) {
      PermissionService.requestNotifications(context);
    }
  }

  // BUG-02 FIX: Renamed from _loadInitialData to _load (consistent naming)
  Future<void> _load() async {
    try {
      final results = await Future.wait([
        _api.getCategories(),
        _api.getProducts(isBestSeller: true),
        _api.getProducts(),
      ]);
      if (mounted) {
        setState(() {
          _categories = (results[0] as List<CategoryModel>?) ?? [];
          _bestSellers = (results[1] as List<ProductModel>?)?.take(3).toList() ?? [];
          _medicines = (results[2] as List<ProductModel>?)?.take(20).toList() ?? [];
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _launch(String url) async {
    try {
      final uri = Uri.parse(url);
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Could not launch: $url')),
        );
      }
    }
  }

  void _goSearch(BuildContext context) {
    HapticFeedback.mediumImpact();
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const SearchScreen()),
    );
  }

  void _openCategory(BuildContext context, CategoryModel cat) {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => CategoryProductsScreen(category: cat)),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bgPage,
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(70),
        child: const HomeHeader(),
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        color: SahimedColors.primary,
        child: SingleChildScrollView(
          physics: const BouncingScrollPhysics(),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 1. Image-matched Hero Section
              _buildImageHero(context),

              // 2. Quick Actions
              _buildHeroBottom(context),

              const SizedBox(height: 32),

              // 4. Popular Brands
              _buildSection(
                title: 'Our Most Popular Brands',
                child: _isLoading ? _shimmerGrid(3) : _productGrid(_bestSellers, context),
              ),

              const SizedBox(height: 32),

              // 5. Categories
              _buildSection(
                title: 'Top Categories',
                trailing: GestureDetector(
                  onTap: () => _goSearch(context),
                  child: Row(
                    children: [
                      Text('EXPLORE ALL', style: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.w900, color: SahimedColors.primary)),
                      const Icon(LucideIcons.chevronRight, size: 14, color: SahimedColors.primary),
                    ],
                  ),
                ),
                child: _isLoading ? _shimmerGrid(9) : _categoryGrid(context),
              ),

              const SizedBox(height: 32),

              // 6. Delivery Banner
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: _buildDeliveryBanner(context),
              ),

              const SizedBox(height: 32),

              // 7. Best Sellers
              _buildSection(
                title: 'Best Sellers',
                child: _isLoading ? _shimmerHScroll() : _horizontalProductScroll(context),
              ),

              const SizedBox(height: 120),
            ],
          ),
        ),
      ),
    );
  Widget _buildImageHero(BuildContext context) {
    return Container(
      width: double.infinity,
      color: const Color(0xFFFFF9F9), // Subtle warm bg like image
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 24),
      child: Column(
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Badge: TRUSTED BY 10L+ USERS
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(100),
                        border: Border.all(color: const Color(0xFFF1F5F9)),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.02),
                            blurRadius: 4,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(LucideIcons.checkCircle, size: 14, color: Color(0xFF22C55E)),
                          const SizedBox(width: 6),
                          Text(
                            'TRUSTED BY 10L+ USERS',
                            style: GoogleFonts.outfit(
                              fontSize: 9,
                              fontWeight: FontWeight.w900,
                              color: const Color(0xFF1E293B),
                              letterSpacing: 0.5,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    // Title: AFFORDABLE SOLUTIONS FOR EVERYDAY CARE
                    RichText(
                      text: TextSpan(
                        style: GoogleFonts.outfit(
                          fontSize: 28,
                          fontWeight: FontWeight.w900,
                          height: 1.1,
                          color: const Color(0xFF0F172A),
                        ),
                        children: [
                          const TextSpan(text: 'AFFORDABLE\n'),
                          const TextSpan(text: 'SOLUTIONS FOR\n'),
                          TextSpan(
                            text: 'EVERYDAY CARE',
                            style: GoogleFonts.outfit(
                              color: SahimedColors.primary,
                              fontStyle: FontStyle.italic,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              // Doctor Image in Frame (Restored as per latest reference)
              Container(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: Colors.white, width: 4),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.1),
                      blurRadius: 20,
                      offset: const Offset(0, 10),
                    ),
                  ],
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(20),
                  child: Hero(
                    tag: 'doctor_hero',
                    child: CachedNetworkImage(
                      imageUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=300&auto=format&fit=crop',
                      width: 130,
                      height: 130,
                      fit: BoxFit.cover,
                      placeholder: (ctx, _) => _shimmerBox(radius: 20),
                      errorWidget: (ctx, _, __) => const Icon(LucideIcons.user, size: 40),
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 32),
          // Search Bar with Blue Button
          GestureDetector(
            onTap: () => _goSearch(context),
            child: Container(
              height: 56,
              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(100),
                boxShadow: [
                  BoxShadow(
                    color: SahimedColors.primary.withValues(alpha: 0.08),
                    blurRadius: 20,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: Row(
                children: [
                  const SizedBox(width: 20),
                  Text(
                    'SEARCH MEDICINES...',
                    style: GoogleFonts.outfit(
                      color: const Color(0xFF94A3B8),
                      fontSize: 14,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 1,
                    ),
                  ),
                  const Spacer(),
                  Container(
                    width: 48,
                    height: 48,
                    decoration: const BoxDecoration(
                      color: SahimedColors.primary,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(LucideIcons.search, color: Colors.white, size: 20),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeroBottom(BuildContext context) {
    return Container(
      color: const Color(0xFFFFF9F9),
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 20),
      child: Row(
        children: [
          _quickAction(
            label: 'Upload Rx',
            iconBg: SahimedColors.primary,
            tileBg: _lavender,
            icon: const Icon(LucideIcons.fileText, size: 18, color: Colors.white),
            onTap: () async {
              if (await PermissionService.requestStorage(context)) {
                if (mounted) {
                  Navigator.push(context, MaterialPageRoute(builder: (_) => const PrescriptionScreen()));
                }
              }
            },
          ),
          const SizedBox(width: 10),
          _quickAction(
            label: 'WhatsApp',
            iconBg: _waGreen,
            tileBg: const Color(0xFFF0FDF4),
            icon: const Icon(LucideIcons.messageCircle, size: 18, color: Colors.white),
            onTap: () => _launch('https://wa.me/917349499898'),
          ),
          const SizedBox(width: 10),
          _quickAction(
            label: 'Call Us',
            iconBg: Colors.red,
            tileBg: _sahiPink,
            icon: const Icon(LucideIcons.phone, size: 18, color: Colors.white),
            onTap: () async {
              if (await PermissionService.requestPhone(context)) {
                _launch('tel:+917349499898');
              }
            },
          ),
        ],
      ),
    );
  }

  Widget _quickAction({required String label, required Color iconBg, required Color tileBg, required Widget icon, required VoidCallback onTap}) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: BoxDecoration(color: tileBg, borderRadius: BorderRadius.circular(16)),
          child: Column(
            children: [
              Container(width: 36, height: 36, decoration: BoxDecoration(color: iconBg, borderRadius: BorderRadius.circular(12)), child: Center(child: icon)),
              const SizedBox(height: 6),
              Text(label.toUpperCase(), style: GoogleFonts.outfit(fontSize: 8, fontWeight: FontWeight.w900)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSection({required String title, required Widget child, Widget? trailing}) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(title.toUpperCase(), style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.w900, color: SahimedColors.primary)),
              if (trailing != null) trailing,
            ],
          ),
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }

  Widget _productGrid(List<ProductModel> products, BuildContext context) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 2, crossAxisSpacing: 12, mainAxisSpacing: 12, childAspectRatio: 0.68),
      itemCount: products.length,
      itemBuilder: (_, i) => SahimedProductCard(product: products[i]),
    );
  }

  Widget _categoryGrid(BuildContext context) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 3, crossAxisSpacing: 12, mainAxisSpacing: 16, childAspectRatio: 0.85),
      itemCount: _categories.take(9).length,
      itemBuilder: (_, i) => GestureDetector(
        onTap: () => _openCategory(context, _categories[i]),
        child: Column(
          children: [
            Container(width: 74, height: 74, decoration: BoxDecoration(color: _catBg(i), shape: BoxShape.circle), child: ClipOval(child: CachedNetworkImage(imageUrl: _categories[i].imageUrl, fit: BoxFit.cover))),
            const SizedBox(height: 6),
            Text(_categories[i].name.toUpperCase(), textAlign: TextAlign.center, style: GoogleFonts.outfit(fontSize: 7, fontWeight: FontWeight.w900)),
          ],
        ),
      ),
    );
  }

  Widget _buildDeliveryBanner(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(gradient: const LinearGradient(colors: [Colors.orange, Colors.red]), borderRadius: BorderRadius.circular(28)),
      child: Text('FREE DELIVERY ON ALL ORDERS ABOVE ₹499', style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.w900)),
    );
  }

  Widget _horizontalProductScroll(BuildContext context) {
    return SizedBox(
      height: 245,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: _medicines.length,
        separatorBuilder: (_, __) => const SizedBox(width: 12),
        itemBuilder: (_, i) => SizedBox(width: 155, child: SahimedProductCard(product: _medicines[i])),
      ),
    );
  }

  // BUG-05 FIX: Real shimmer placeholders instead of empty Container()
  Widget _shimmerGrid(int count) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: count == 9 ? 3 : 2,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: count == 9 ? 0.85 : 0.68,
      ),
      itemCount: count,
      itemBuilder: (_, __) => _shimmerBox(radius: 16),
    );
  }

  Widget _shimmerHScroll() {
    return SizedBox(
      height: 245,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: 4,
        separatorBuilder: (_, __) => const SizedBox(width: 12),
        itemBuilder: (_, __) => SizedBox(width: 155, child: _shimmerBox(radius: 16)),
      ),
    );
  }

  Widget _shimmerBox({double radius = 12}) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFFE2E8F0),
        borderRadius: BorderRadius.circular(radius),
      ),
    );
  }

  Color _catBg(int i) => [_lavender, _sahiPink, _sahiBlue, _sahiGreen][i % 4];
}

