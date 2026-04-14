import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:carousel_slider/carousel_slider.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/colors.dart';
import '../../../core/providers/cart_provider.dart';
import '../../../core/services/api_service.dart';
import '../../../shared/models/models.dart';
import '../widgets/home_header.dart';
import '../../products/screens/category_products_screen.dart';
import '../../products/screens/product_detail_screen.dart';
import '../../products/screens/search_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final ApiService _apiService = ApiService();
  List<CategoryModel> _categories = [];
  List<BannerModel> _banners = [];
  List<ProductModel> _popularBrands = []; // First 3
  List<ProductModel> _bestSellers = [];   // All others
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      final banners = await _apiService.getBanners();
      final categories = await _apiService.getCategories();
      final popularProducts = await _apiService.getProducts(isBestSeller: true);
      final genericProducts = await _apiService.getProducts();
      
      if (mounted) {
        setState(() {
          _banners = banners;
          _categories = categories;
          _popularBrands = popularProducts; // usually limited in UI
          _bestSellers = genericProducts;
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

              // Mega Banner Hero Section (Website Mirror)
              SliverToBoxAdapter(
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFF9F9),
                    border: Border(
                      bottom: BorderSide(
                        color: Colors.pink.withValues(alpha: 0.05),
                      ),
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Dual Card Row layout like Website
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          Expanded(
                           child: Column(
                             crossAxisAlignment: CrossAxisAlignment.start,
                             children: [
                              // Badge
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                decoration: BoxDecoration(
                                  color: Colors.white.withValues(alpha: 0.8),
                                  borderRadius: BorderRadius.circular(100),
                                  border: Border.all(color: Colors.white),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const Icon(Icons.verified_user, color: Color(0xFF25D366), size: 14),
                                    const SizedBox(width: 8),
                                    Text(
                                      'TRUSTED BY 10L+ USERS',
                                      style: GoogleFonts.outfit(
                                        fontSize: 8,
                                        fontWeight: FontWeight.w900,
                                        letterSpacing: 1.0,
                                        color: SahimedColors.primary,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 16),
                              // Exact Website Copy Title
                              RichText(
                                text: TextSpan(
                                  style: GoogleFonts.outfit(
                                    fontSize: 28,
                                    fontWeight: FontWeight.w900,
                                    height: 1.1,
                                    letterSpacing: -1.0,
                                    color: SahimedColors.primary,
                                  ),
                                  children: [
                                    const TextSpan(text: 'AFFORDABLE\nMEDICINES FOR\n'),
                                    TextSpan(
                                      text: 'EVERY DAY HEALTH',
                                      style: GoogleFonts.outfit(
                                        fontStyle: FontStyle.italic,
                                        color: SahimedColors.accent,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                             ]
                           )
                          ),
                          
                          // Hero Image (Human Photo like website)
                          Container(
                            width: 130,
                            height: 130,
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(24),
                              border: Border.all(color: Colors.white, width: 6),
                              boxShadow: [
                                BoxShadow(
                                  color: SahimedColors.primary.withValues(alpha: 0.1),
                                  blurRadius: 20,
                                  offset: const Offset(0, 10),
                                ),
                              ],
                            ),
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(18),
                              child: CachedNetworkImage(
                                imageUrl: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=2070&auto=format&fit=crop',
                                fit: BoxFit.cover,
                                alignment: Alignment.topCenter,
                                placeholder: (context, url) => const Icon(Icons.person, color: SahimedColors.slate200),
                              ),
                            ),
                          ),
                        ],
                      ),


                      const SizedBox(height: 24),
                      // Search Bar
                      GestureDetector(
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(builder: (context) => const SearchScreen()),
                          );
                        },
                        child: Container(
                          padding: const EdgeInsets.all(4),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(100),
                            boxShadow: [
                              BoxShadow(
                                color: SahimedColors.primary.withValues(alpha: 0.1),
                                blurRadius: 30,
                                offset: const Offset(0, 10),
                              ),
                            ],
                          ),
                          child: Row(
                            children: [
                              const SizedBox(width: 20),
                              Expanded(
                                child: Text(
                                  'SEARCH MEDICINES...',
                                  style: GoogleFonts.outfit(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w700,
                                    color: SahimedColors.slate300,
                                    letterSpacing: 0.5,
                                  ),
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.all(12),
                                decoration: const BoxDecoration(
                                  color: SahimedColors.primary,
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(Icons.search, color: Colors.white, size: 20),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),
                      // Action Buttons
                      Row(
                        children: [
                          _buildModernAction(
                            'Upload Rx',
                            Icons.upload_file_rounded,
                            const Color(0xFFF3F0FF),
                            SahimedColors.primary,
                            () {},
                          ),
                          const SizedBox(width: 12),
                          _buildModernAction(
                            'WhatsApp',
                            Icons.chat_bubble_rounded,
                            const Color(0xFFEFFFF5),
                            const Color(0xFF25D366),
                            _launchWhatsApp,
                          ),
                          const SizedBox(width: 12),
                          _buildModernAction(
                            'Call Now',
                            Icons.phone_rounded,
                            const Color(0xFFFFF0F3),
                            SahimedColors.accent,
                            _makeCall,
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),

              // Banners
              if (_banners.isNotEmpty)
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 20),
                    child: CarouselSlider(
                      options: CarouselOptions(
                        height: 160,
                        viewportFraction: 0.9,
                        autoPlay: true,
                        enlargeCenterPage: true,
                      ),
                      items: _banners.map((banner) {
                        return Container(
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(24),
                            boxShadow: [
                              BoxShadow(color: Colors.black.withValues(alpha: 0.1), blurRadius: 20, offset: const Offset(0, 10)),
                            ],
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
                      }).toList(),
                    ),
                  ),
                ),


              // 1. Most Popular Brands Before Categories
              if (_popularBrands.isNotEmpty)
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 16, 20, 16),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'OUR MOST POPULAR BRANDS',
                          style: GoogleFonts.outfit(
                            fontSize: 16,
                            fontWeight: FontWeight.w900,
                            color: SahimedColors.textPrimary,
                            letterSpacing: 0.5,
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.yellow.shade100,
                            borderRadius: BorderRadius.circular(100),
                          ),
                          child: Text(
                            'BEST SELLERS',
                            style: GoogleFonts.outfit(fontSize: 8, fontWeight: FontWeight.bold, color: Colors.yellow.shade900),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              if (_popularBrands.isNotEmpty)
                SliverToBoxAdapter(
                  child: SizedBox(
                    height: 190,
                    child: ListView.builder(
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      itemCount: _popularBrands.length > 5 ? 5 : _popularBrands.length,
                      itemBuilder: (context, index) {
                        return _buildTrendingCard(_popularBrands[index]);
                      },
                    ),
                  ),
                ),

              // 2. Categories Header
              if (_categories.isNotEmpty)
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 32, 20, 16),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'SHOP BY CATEGORY',
                          style: GoogleFonts.outfit(
                            fontSize: 16,
                            fontWeight: FontWeight.w900,
                            color: SahimedColors.textPrimary,
                            letterSpacing: 0.5,
                          ),
                        ),
                        Text(
                          'EXPLORE ALL',
                          style: GoogleFonts.outfit(
                            fontSize: 12,
                            fontWeight: FontWeight.w900,
                            color: SahimedColors.primary,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

              // 4-Column Category Grid
              if (_categories.isNotEmpty)
                SliverPadding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  sliver: SliverGrid(
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 4,
                      mainAxisSpacing: 16,
                      crossAxisSpacing: 12,
                      childAspectRatio: 0.8,
                    ),
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        final category = _categories[index];
                        final colors = [
                          const Color(0xFFF3F0FF), 
                          const Color(0xFFFFF0F3), 
                          const Color(0xFFEBF8FF), 
                          const Color(0xFFEFFFF5), 
                        ];
                        final bgColor = colors[index % colors.length];

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
                                  color: bgColor,
                                  borderRadius: BorderRadius.circular(24),
                                  border: Border.all(color: Colors.white, width: 2),
                                  boxShadow: [
                                    BoxShadow(
                                      color: bgColor.withValues(alpha: 0.5),
                                      blurRadius: 10,
                                      offset: const Offset(0, 4),
                                    ),
                                  ],
                                ),
                                child: ClipRRect(
                                  borderRadius: BorderRadius.circular(22),
                                  child: CachedNetworkImage(
                                    imageUrl: category.imageUrl,
                                    fit: BoxFit.cover,
                                    placeholder: (context, url) => Container(color: SahimedColors.slate50),
                                  ),
                                ),
                              ),
                              const SizedBox(height: 8),
                              Expanded(
                                child: Text(
                                  category.name.toUpperCase(),
                                  textAlign: TextAlign.center,
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                  style: GoogleFonts.outfit(
                                    fontSize: 9,
                                    fontWeight: FontWeight.w900,
                                    color: SahimedColors.textSecondary,
                                    letterSpacing: 0.1,
                                    height: 1.1,
                                  ),
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

              // 3. Pan India Delivery Strip
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [SahimedColors.accent, Color(0xFFFF4E50)],
                        begin: Alignment.centerLeft,
                        end: Alignment.centerRight,
                      ),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.flash_on_rounded, color: Colors.white, size: 16),
                        const SizedBox(width: 12),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'PAN INDIA FREE DELIVERY ABOVE ₹499',
                              style: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: 0.5),
                            ),
                            Text(
                              'Same day shipping on all orders',
                              style: GoogleFonts.outfit(fontSize: 8, fontWeight: FontWeight.bold, color: Colors.white.withValues(alpha: 0.8)),
                            ),
                          ],
                        ),
                        const Spacer(),
                        const Icon(Icons.arrow_forward_ios_rounded, color: Colors.white, size: 12),
                      ],
                    ),
                  ),
                ),
              ),

              // 4. Regular Best Sellers
              if (_bestSellers.isNotEmpty)
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 24, 20, 16),
                    child: Text(
                      'BEST SELLERS',
                      style: GoogleFonts.outfit(
                        fontSize: 14,
                        fontWeight: FontWeight.w900,
                        color: SahimedColors.textPrimary,
                        letterSpacing: 1.2,
                      ),
                    ),
                  ),
                ),
              if (_bestSellers.isNotEmpty)
                SliverToBoxAdapter(
                  child: SizedBox(
                    height: 220,
                    child: ListView.builder(
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      itemCount: _bestSellers.length,
                      itemBuilder: (context, index) {
                        return _buildTrendingCard(_bestSellers[index]);
                      },
                    ),
                  ),
                ),

              const SliverToBoxAdapter(child: SizedBox(height: 120)), // Space for Bottom Nav
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildModernAction(String title, IconData icon, Color bgColor, Color iconColor, VoidCallback onTap) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 16),
          decoration: BoxDecoration(
            color: bgColor,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: Colors.white, width: 2),
            boxShadow: [
              BoxShadow(
                color: SahimedColors.primary.withValues(alpha: 0.05),
                blurRadius: 20,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          child: Column(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: iconColor,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: Colors.white, size: 18),
              ),
              const SizedBox(height: 8),
              Text(
                title.toUpperCase(),
                style: GoogleFonts.outfit(
                  fontSize: 9,
                  fontWeight: FontWeight.w900,
                  color: SahimedColors.primary,
                  letterSpacing: -0.2,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTrendingCard(ProductModel product) {
    // Simulated Generic Alternative for Comparison (Matching website mission)
    final genericPrice = (product.price * 0.4).roundToDouble(); // Generics are ~60% cheaper
    final savings = product.price - genericPrice;

    return Container(
      width: 320,
      margin: const EdgeInsets.only(right: 18, bottom: 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: SahimedColors.slate100),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 24, offset: const Offset(0, 10))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header: Brand Title
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  product.name.toUpperCase(),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.outfit(
                    fontSize: product.name.length > 20 ? 12 : 14,
                    fontWeight: FontWeight.w900,
                    color: SahimedColors.textPrimary,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(color: Colors.amber[100], borderRadius: BorderRadius.circular(8)),
                child: Text('SWITCH & SAVE', style: GoogleFonts.outfit(fontSize: 8, fontWeight: FontWeight.w900, color: Colors.amber[900])),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Comparison Row
          Row(
            children: [
              // 1. Brand Version (The "Expensive" one)
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(color: SahimedColors.slate50, borderRadius: BorderRadius.circular(20), border: Border.all(color: SahimedColors.slate100)),
                  child: Column(
                    children: [
                      Text('POPULAR BRAND', style: GoogleFonts.outfit(fontSize: 8, fontWeight: FontWeight.bold, color: SahimedColors.slate400)),
                      const SizedBox(height: 8),
                      Text('₹${product.price.toStringAsFixed(0)}', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w900, color: SahimedColors.textSecondary, decoration: TextDecoration.lineThrough)),
                    ],
                  ),
                ),
              ),
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 10),
                child: Icon(LucideIcons.arrowRight, color: SahimedColors.primary, size: 16),
              ),
              // 2. Sahi Generic (The "Value" one)
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: SahimedColors.primary.withOpacity(0.05),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: SahimedColors.primary.withOpacity(0.2)),
                  ),
                  child: Column(
                    children: [
                      Text('SAHI GENERIC', style: GoogleFonts.outfit(fontSize: 8, fontWeight: FontWeight.w900, color: SahimedColors.primary)),
                      const SizedBox(height: 8),
                      Text('₹${genericPrice.toStringAsFixed(0)}', style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.w900, color: SahimedColors.primary)),
                    ],
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 16),

          // Footer: Savings Highlight
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(color: Colors.green[500], borderRadius: BorderRadius.circular(12)),
                child: Text(
                  'TOTAL SAVINGS: ₹${savings.toStringAsFixed(0)}',
                  style: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.white),
                ),
              ),
              GestureDetector(
                onTap: () {
                   context.read<CartProvider>().addItem(product);
                   ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Generic added to cart!'), behavior: SnackBarBehavior.floating));
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(color: SahimedColors.primary, borderRadius: BorderRadius.circular(12), boxShadow: [BoxShadow(color: SahimedColors.primary.withOpacity(0.2), blurRadius: 10, offset: const Offset(0, 4))]),
                  child: Text('ADD +', style: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.white)),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
