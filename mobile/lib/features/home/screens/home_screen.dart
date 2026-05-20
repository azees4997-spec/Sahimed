import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:url_launcher/url_launcher.dart';
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
  List<ProductModel> _topSelections = [];
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
    // Non-blocking request for notifications and location on app start
    await Future.delayed(const Duration(seconds: 2));
    if (mounted) {
      PermissionService.requestNotifications(context);
      PermissionService.requestLocation(context);
    }
  }

  // BUG-02 FIX: Renamed from _loadInitialData to _load (consistent naming)
  Future<void> _load() async {
    try {
      final results = await Future.wait([
        _api.getCategories(),
        _api.getProducts(isBestSeller: true),
        _api.getProducts(isTopSelection: true),
        _api.getProducts(),
      ]);
      if (mounted) {
        setState(() {
          _categories = (results[0] as List<CategoryModel>?) ?? [];
          _bestSellers = (results[1] as List<ProductModel>?)?.take(10).toList() ?? [];
          _topSelections = (results[2] as List<ProductModel>?)?.take(10).toList() ?? [];
          _medicines = (results[3] as List<ProductModel>?)?.take(20).toList() ?? [];
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
      body: RefreshIndicator(
        // BUG-02 FIX: Changed _loadInitialData() to _load()
        onRefresh: _load,
        color: SahimedColors.primary,
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(
            parent: BouncingScrollPhysics(),
          ),
          // BUG-01 FIX: Corrected all bracket nesting
          slivers: [
            const SliverToBoxAdapter(child: HomeHeader()),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.only(top: 10),
                child: _buildHeroTop(context),
              ),
            ),
            SliverPersistentHeader(
              pinned: true,
              delegate: _StickySearchDelegate(onTap: () => _goSearch(context)),
            ),
            SliverToBoxAdapter(child: _buildHeroBottom(context)),
            SliverPadding(
              padding: const EdgeInsets.symmetric(vertical: 20),
              sliver: SliverList(
                delegate: SliverChildListDelegate([
                  if (_isLoading || _bestSellers.isNotEmpty) ...[
                    _buildSection(
                      title: 'Most Popular Brands',
                      child: _isLoading ? _shimmerHScroll() : _horizontalPopularBrands(context),
                    ),
                    const SizedBox(height: 28),
                  ],
                  if (_isLoading || _categories.isNotEmpty) ...[
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
                    const SizedBox(height: 28),
                  ],
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: _buildDeliveryBanner(context),
                  ),
                  const SizedBox(height: 28),
                  if (_isLoading || _topSelections.isNotEmpty) ...[
                    _buildSection(
                      title: 'Top Selections',
                      trailing: Badge(
                        label: Text('CURATED', style: GoogleFonts.outfit(fontSize: 7, fontWeight: FontWeight.w900, color: SahimedColors.primary)),
                        backgroundColor: SahimedColors.primary.withOpacity(0.1),
                      ),
                      child: _isLoading ? _shimmerHScroll() : _horizontalTopSelections(context),
                    ),
                    const SizedBox(height: 28),
                  ],
                  if (_isLoading || _medicines.isNotEmpty) ...[
                    _buildSection(
                      title: 'Featured Medicines',
                      child: _isLoading ? _shimmerHScroll() : _horizontalProductScroll(context),
                    ),
                  ],
                  const SizedBox(height: 120),
                ]),
              ),
            ),
          ],
        ),
      ),
/*
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          HapticFeedback.heavyImpact();
          Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const SahiAIScreen()),
          );
        },
        backgroundColor: SahimedColors.textPrimary,
        child: const Icon(LucideIcons.bot, color: Colors.white),
      ),
*/
    );
  }

  Widget _buildHeroTop(BuildContext context) {
    return Container(
      color: const Color(0xFFFFF9F9),
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(100),
                    border: Border.all(color: Colors.black.withOpacity(0.05)),
                    boxShadow: [
                      BoxShadow(
                        color: SahimedColors.primary.withOpacity(0.1),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 12,
                        height: 12,
                        decoration: const BoxDecoration(color: _waGreen, shape: BoxShape.circle),
                        child: const Icon(LucideIcons.shieldCheck, size: 8, color: Colors.white),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        'TRUSTED QUALITY',
                        style: GoogleFonts.outfit(fontSize: 7, fontWeight: FontWeight.w900, color: Colors.black, letterSpacing: 1),
                      ),
                    ],
                  ),
                ).animate().fadeIn(duration: 400.ms).slideX(begin: -0.2),
                const SizedBox(height: 16),
                RichText(
                  text: TextSpan(
                    style: GoogleFonts.outfit(fontSize: 30, fontWeight: FontWeight.w900, height: 1.0, color: const Color(0xFF0F172A)),
                    children: [
                      const TextSpan(text: 'AFFORDABLE\nMEDICINES\n'),
                      TextSpan(
                        text: 'FOR HEALTH',
                        style: GoogleFonts.outfit(color: SahimedColors.primary, fontStyle: FontStyle.italic),
                      ),
                    ],
                  ),
                ).animate().fadeIn(duration: 600.ms, delay: 200.ms).slideY(begin: 0.1),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(28),
              boxShadow: [
                BoxShadow(
                  color: SahimedColors.primary.withOpacity(0.15),
                  blurRadius: 40,
                  offset: const Offset(0, 20),
                ),
              ],
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(22),
              child: CachedNetworkImage(
                imageUrl: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=2070&auto=format&fit=crop',
                width: 120,
                height: 140,
                fit: BoxFit.cover,
                alignment: Alignment.topCenter,
                errorWidget: (ctx, _, _) => Container(
                  width: 120,
                  height: 140,
                  color: _lavender,
                  child: const Icon(LucideIcons.stethoscope, color: SahimedColors.primary, size: 40),
                ),
              ),
            ),
          ).animate().fadeIn(duration: 800.ms, delay: 400.ms).scale(begin: const Offset(0.8, 0.8)),
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
            icon: SvgPicture.asset(
              'assets/icons/whatsapp.svg', 
              width: 20, 
              height: 20, 
              colorFilter: const ColorFilter.mode(Colors.white, BlendMode.srcIn),
            ),
            onTap: () => _launch('https://wa.me/917349499898'),
          ),
          const SizedBox(width: 10),
          _quickAction(
            label: 'Order on Call',
            iconBg: const Color(0xFFF43F5E), // rose-500
            tileBg: _sahiPink,
            icon: const Icon(LucideIcons.phoneCall, size: 18, color: Colors.white),
            onTap: () async {
              if (await PermissionService.requestPhone(context)) {
                _launch('tel:+917349499898');
              }
            },
          ),
        ],
      ).animate().fadeIn(duration: 600.ms, delay: 600.ms).slideY(begin: 0.2),
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
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 24,
                    height: 3,
                    decoration: BoxDecoration(
                      color: SahimedColors.primary,
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    title.toUpperCase(),
                    style: GoogleFonts.outfit(
                      fontSize: 16,
                      fontWeight: FontWeight.w900,
                      color: const Color(0xFF0F172A),
                      letterSpacing: 0.5,
                    ),
                  ),
                ],
              ),
              if (trailing != null) trailing,
            ],
          ),
          const SizedBox(height: 16),
          child.animate().fadeIn(duration: 800.ms).slideY(begin: 0.05, curve: Curves.easeOutCubic),
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
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 3, crossAxisSpacing: 12, mainAxisSpacing: 16, childAspectRatio: 0.82),
      itemCount: _categories.take(12).length,
      itemBuilder: (_, i) => GestureDetector(
        onTap: () => _openCategory(context, _categories[i]),
        child: Column(
          children: [
            Container(
              width: 78,
              height: 78,
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(color: Colors.white, shape: BoxShape.circle, border: Border.all(color: Colors.black.withOpacity(0.05)), boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 5))]),
              child: Container(
                decoration: BoxDecoration(color: _catBg(i), shape: BoxShape.circle),
                child: ClipOval(child: CachedNetworkImage(imageUrl: _categories[i].imageUrl, fit: BoxFit.cover, errorWidget: (c,u,e) => const Icon(LucideIcons.pill, size: 20))),
              ),
            ),
            const SizedBox(height: 6),
            Text(_categories[i].name.toUpperCase(), textAlign: TextAlign.center, style: GoogleFonts.outfit(fontSize: 8, fontWeight: FontWeight.w900, color: Colors.black87)),
          ],
        ),
      ),
    );
  }

  Widget _horizontalPopularBrands(BuildContext context) {
    return SizedBox(
      height: 245,
      child: ListView.separated(
        padding: const EdgeInsets.only(bottom: 10),
        scrollDirection: Axis.horizontal,
        itemCount: _bestSellers.length,
        separatorBuilder: (_, _) => const SizedBox(width: 12),
        itemBuilder: (_, i) => SizedBox(width: 165, child: SahimedProductCard(product: _bestSellers[i])),
      ),
    );
  }

  Widget _buildDeliveryBanner(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFFBBF24), Color(0xFFF97316), Color(0xFFE11D48)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(32),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFFF97316).withOpacity(0.3),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Stack(
        children: [
          Positioned(
            right: -10,
            top: -10,
            child: Icon(LucideIcons.package, size: 80, color: Colors.white.withOpacity(0.1)),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'PAN INDIA\nFREE DELIVERY',
                style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w900, color: Colors.white, height: 1.1),
              ),
              const SizedBox(height: 4),
              Text(
                'ABOVE ₹499',
                style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white.withOpacity(0.9)),
              ),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(100)),
                child: Text(
                  'SHOP NOW',
                  style: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.w900, color: const Color(0xFFF97316), letterSpacing: 1),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _horizontalProductScroll(BuildContext context) {
    return SizedBox(
      height: 245,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: _medicines.length,
        separatorBuilder: (_, _) => const SizedBox(width: 12),
        itemBuilder: (_, i) => SizedBox(width: 155, child: SahimedProductCard(product: _medicines[i])),
      ),
    );
  }

  Widget _horizontalTopSelections(BuildContext context) {
    return SizedBox(
      height: 245,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: _topSelections.length,
        separatorBuilder: (_, _) => const SizedBox(width: 12),
        itemBuilder: (_, i) => SizedBox(width: 155, child: SahimedProductCard(product: _topSelections[i])),
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
      itemBuilder: (_, _) => _shimmerBox(radius: 16),
    );
  }

  Widget _shimmerHScroll() {
    return SizedBox(
      height: 245,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: 4,
        separatorBuilder: (_, _) => const SizedBox(width: 12),
        itemBuilder: (_, _) => SizedBox(width: 155, child: _shimmerBox(radius: 16)),
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

class _StickySearchDelegate extends SliverPersistentHeaderDelegate {
  final VoidCallback onTap;
  _StickySearchDelegate({required this.onTap});
  @override
  double get minExtent => 80;
  @override
  double get maxExtent => 80;
  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      color: _bgPage,
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          height: 60,
          padding: const EdgeInsets.symmetric(horizontal: 20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(28),
            boxShadow: [
              BoxShadow(
                color: SahimedColors.primary.withOpacity(0.08),
                blurRadius: 30,
                offset: const Offset(0, 10),
              ),
            ],
            border: Border.all(color: SahimedColors.primary.withOpacity(0.05), width: 2),
          ),
          child: Row(
            children: [
              Icon(LucideIcons.search, size: 20, color: SahimedColors.primary.withOpacity(0.6)),
              const SizedBox(width: 16),
              Expanded(
                child: Text(
                  'Search 10,000+ medicines...',
                  style: GoogleFonts.outfit(
                    fontWeight: FontWeight.w600,
                    color: const Color(0xFF94A3B8),
                    fontSize: 15,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: SahimedColors.primary.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(100),
                ),
                child: Text(
                  'FIND',
                  style: GoogleFonts.outfit(
                    fontSize: 10,
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
    );
  }
  @override
  bool shouldRebuild(covariant SliverPersistentHeaderDelegate oldDelegate) => false;
}
