import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:carousel_slider/carousel_slider.dart';
import 'package:lucide_icons_flutter/lucide_icons_flutter.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/theme/colors.dart';
import '../../../core/services/api_service.dart';
import '../../../shared/models/models.dart';
import '../widgets/home_header.dart';
import '../../products/screens/category_products_screen.dart';
import '../../products/screens/product_detail_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final ApiService _apiService = ApiService();
  List<CategoryModel> _categories = [];
  List<BannerModel> _banners = [];
  List<ProductModel> _bestSellers = [];
  bool _isLoading = true;
  int _currentBannerIndex = 0;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      final banners = await _apiService.getBanners();
      final categories = await _apiService.getCategories();
      final products = await _apiService.getProducts(isBestSeller: true);
      
      if (mounted) {
        setState(() {
          _banners = banners;
          _categories = categories;
          _bestSellers = products;
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Error loading home data: $e');
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _launchWhatsApp() async {
    final url = Uri.parse('https://wa.me/918985969860');
    if (await canLaunchUrl(url)) {
      await launchUrl(url, mode: LaunchMode.externalApplication);
    }
  }

  void _makeCall() async {
    final url = Uri.parse('tel:+918985969860');
    if (await canLaunchUrl(url)) {
      await launchUrl(url);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        backgroundColor: SahimedColors.background,
        body: Center(
          child: CircularProgressIndicator(
            color: SahimedColors.primary,
            strokeWidth: 3,
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: SahimedColors.background,
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _loadData,
          color: SahimedColors.primary,
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            slivers: [
              // Sticky Header
              const SliverToBoxAdapter(child: HomeHeader()),

              // Hero Banners
              if (_banners.isNotEmpty)
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    child: Column(
                      children: [
                        CarouselSlider(
                          options: CarouselOptions(
                            height: 180,
                            viewportFraction: 0.92,
                            autoPlay: true,
                            enlargeCenterPage: true,
                            onPageChanged: (index, reason) {
                              setState(() => _currentBannerIndex = index);
                            },
                          ),
                          items: _banners.map((banner) {
                            return Container(
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(24),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withValues(alpha: 0.1),
                                    blurRadius: 20,
                                    offset: const Offset(0, 10),
                                  ),
                                ],
                              ),
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(24),
                                child: CachedNetworkImage(
                                  imageUrl: banner.imageUrl,
                                  fit: BoxFit.cover,
                                  placeholder: (context, url) => Container(color: SahimedColors.slate100),
                                ),
                              ),
                            );
                          }).toList(),
                        ),
                        const SizedBox(height: 12),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: _banners.asMap().entries.map((entry) {
                            return Container(
                              width: _currentBannerIndex == entry.key ? 16 : 6,
                              height: 6,
                              margin: const EdgeInsets.symmetric(horizontal: 3),
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(3),
                                color: _currentBannerIndex == entry.key
                                    ? SahimedColors.primary
                                    : SahimedColors.slate200,
                              ),
                            );
                          }).toList(),
                        ),
                      ],
                    ),
                  ),
                ),

              // Action Tiles
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      _buildActionTile(
                        'Upload Rx',
                        LucideIcons.filePlus2,
                        SahimedColors.primary,
                        () {},
                      ),
                      const SizedBox(width: 12),
                      _buildActionTile(
                        'WhatsApp',
                        LucideIcons.messageCircle,
                        const Color(0xFF25D366),
                        _launchWhatsApp,
                      ),
                      const SizedBox(width: 12),
                      _buildActionTile(
                        'Call Now',
                        LucideIcons.phoneCall,
                        SahimedColors.accent,
                        _makeCall,
                      ),
                    ],
                  ),
                ),
              ),

              // Categories Header
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 8, 20, 16),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Shop by Category',
                        style: GoogleFonts.outfit(
                          fontSize: 18,
                          fontWeight: FontWeight.w900,
                          color: SahimedColors.primary,
                          letterSpacing: -0.5,
                        ),
                      ),
                      TextButton(
                        onPressed: () {},
                        child: Text(
                          'View All',
                          style: GoogleFonts.outfit(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: SahimedColors.accent,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // 4-Column Category Grid
              SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                sliver: SliverGrid(
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 4,
                    mainAxisSpacing: 16,
                    crossAxisSpacing: 8,
                    childAspectRatio: 0.72,
                  ),
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final category = _categories[index];
                      return GestureDetector(
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => CategoryProductsScreen(category: category),
                            ),
                          );
                        },
                        child: Column(
                          children: [
                            Container(
                              height: 75,
                              width: double.infinity,
                              decoration: BoxDecoration(
                                color: SahimedColors.white,
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(color: SahimedColors.slate100),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withValues(alpha: 0.03),
                                    blurRadius: 10,
                                    offset: const Offset(0, 4),
                                  ),
                                ],
                              ),
                              child: Padding(
                                padding: const EdgeInsets.all(8),
                                child: CachedNetworkImage(
                                  imageUrl: category.imageUrl,
                                  fit: BoxFit.contain,
                                ),
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              category.name,
                              textAlign: TextAlign.center,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: GoogleFonts.outfit(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                color: SahimedColors.primary.withValues(alpha: 0.8),
                                height: 1.1,
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                    childCount: _categories.length > 8 ? 8 : _categories.length,
                  ),
                ),
              ),

              // Best Sellers Header
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 32, 20, 16),
                  child: Text(
                    'Trending Now',
                    style: GoogleFonts.outfit(
                      fontSize: 18,
                      fontWeight: FontWeight.w900,
                      color: SahimedColors.primary,
                      letterSpacing: -0.5,
                    ),
                  ),
                ),
              ),

              // Horizontal Best Sellers
              SliverToBoxAdapter(
                child: SizedBox(
                  height: 240,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: _bestSellers.length,
                    itemBuilder: (context, index) {
                      final product = _bestSellers[index];
                      return _buildTrendingCard(product);
                    },
                  ),
                ),
              ),

              const SliverToBoxAdapter(child: SizedBox(height: 100)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildActionTile(String title, IconData icon, Color color, VoidCallback onTap) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 16),
          decoration: BoxDecoration(
            color: SahimedColors.white,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: SahimedColors.slate100),
            boxShadow: [
              BoxShadow(
                color: color.withValues(alpha: 0.08),
                blurRadius: 20,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Column(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, color: color, size: 22),
              ),
              const SizedBox(height: 8),
              Text(
                title,
                textAlign: TextAlign.center,
                style: GoogleFonts.outfit(
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                  color: SahimedColors.primary,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTrendingCard(ProductModel product) {
    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(builder: (context) => ProductDetailScreen(product: product)),
        );
      },
      child: Container(
        width: 160,
        margin: const EdgeInsets.only(right: 16, bottom: 8),
        decoration: BoxDecoration(
          color: SahimedColors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: SahimedColors.slate100),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 15,
              offset: const Offset(0, 5),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Stack(
              children: [
                ClipRRect(
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                  child: AspectRatio(
                    aspectRatio: 1.1,
                    child: CachedNetworkImage(
                      imageUrl: product.imageUrls.isNotEmpty ? product.imageUrls[0] : '',
                      fit: BoxFit.cover,
                      placeholder: (context, url) => Container(color: SahimedColors.slate50),
                    ),
                  ),
                ),
                Positioned(
                  top: 8,
                  right: 8,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: SahimedColors.accent,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      'SAVE ${(((product.liveData?.mrp ?? 1) - (product.liveData?.price ?? 0)) / (product.liveData?.mrp ?? 1) * 100).round()}%',
                      style: const TextStyle(color: Colors.white, fontSize: 8, fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
              ],
            ),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    product.molName,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.bold, color: SahimedColors.primary),
                  ),
                  Text(
                    product.company,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.outfit(fontSize: 10, color: SahimedColors.slate400),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '₹${product.liveData?.price}',
                            style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.w900, color: SahimedColors.primary),
                          ),
                          Text(
                            '₹${product.liveData?.mrp}',
                            style: TextStyle(
                              fontSize: 10,
                              decoration: TextDecoration.lineThrough,
                              color: SahimedColors.slate300,
                            ),
                          ),
                        ],
                      ),
                      const Icon(LucideIcons.plusCircle, color: SahimedColors.primary, size: 24),
                    ],
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
