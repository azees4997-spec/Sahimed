import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/colors.dart';

import '../../../core/providers/navigation_provider.dart';
import '../../../core/services/api_service.dart';
import '../../../core/services/permission_service.dart';
import '../../../shared/models/models.dart';

import 'prescription_screen.dart';
import '../../products/screens/category_products_screen.dart';


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
  String _edd = '';
  String _pincode = '560001';

  @override
  void initState() {
    super.initState();
    _load();
    _loadEDD();
    _requestInitialPermissions();
  }

  Future<void> _requestInitialPermissions() async {
    // Non-blocking request for notifications on app start
    await Future.delayed(const Duration(seconds: 2));
    if (mounted) {
      PermissionService.requestNotifications(context);
    }
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

  Future<void> _loadEDD() async {
    try {
      final edd = await _api.getShipwayEDD(_pincode);
      if (mounted && edd != null) {
        final date = DateTime.parse(edd);
        final months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        final formatted = '${months[date.month - 1]} ${date.day.toString().padLeft(2, '0')}';
        setState(() => _edd = formatted);
      }

    } catch (e) {
      debugPrint('Error loading EDD: $e');
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
    context.read<NavigationProvider>().switchTab(1);
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
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(),
        slivers: [
          const SliverToBoxAdapter(child: HomeHeader()),
          SliverToBoxAdapter(child: _buildDeliveryInfo(context)),
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
                _buildSection(
                  title: 'Our Most Popular Brands',
                  child: _isLoading ? _shimmerGrid(3) : _productGrid(_bestSellers, context),
                ),
                const SizedBox(height: 28),
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
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: _buildDeliveryBanner(context),
                ),
                const SizedBox(height: 28),
                _buildSection(
                  title: 'Best Sellers',
                  child: _isLoading ? _shimmerHScroll() : _horizontalProductScroll(context),
                ),
                const SizedBox(height: 120),
              ]),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeroTop(BuildContext context) {
    return Container(
      color: const Color(0xFFFFF9F9),
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Affordable\nSolutions for\nEveryday Care',
                  style: GoogleFonts.outfit(fontSize: 24, fontWeight: FontWeight.w900, height: 1.1),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          ClipRRect(
            borderRadius: BorderRadius.circular(16),
            child: CachedNetworkImage(
              imageUrl: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=200',
              width: 110,
              height: 110,
              fit: BoxFit.cover,
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
        separatorBuilder: (_, _) => const SizedBox(width: 12),
        itemBuilder: (_, i) => SizedBox(width: 155, child: SahimedProductCard(product: _medicines[i])),
      ),
    );
  }

  Widget _shimmerGrid(int count) => Container();
  Widget _shimmerHScroll() => Container();

  Widget _buildDeliveryInfo(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(100), border: Border.all(color: SahimedColors.slate100)),
      child: Row(
        children: [
          const Icon(LucideIcons.mapPin, size: 14, color: SahimedColors.primary),
          const SizedBox(width: 8),
          Text('DELIVERING TO $_pincode', style: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.w900)),
          const Spacer(),
          Text(_edd.isEmpty ? 'FETCHING...' : 'DELIVERY BY $_edd', style: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.green)),
        ],
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
      padding: const EdgeInsets.all(16),
      color: Colors.white,
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          decoration: BoxDecoration(color: const Color(0xFFF1F5F9), borderRadius: BorderRadius.circular(100)),
          child: Row(
            children: [
              const Icon(LucideIcons.search, size: 18),
              const SizedBox(width: 12),
              Text('Search Medicines...', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: Colors.grey)),
            ],
          ),
        ),
      ),
    );
  }
  @override
  bool shouldRebuild(covariant SliverPersistentHeaderDelegate oldDelegate) => false;
}
