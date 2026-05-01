import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../core/theme/colors.dart';
import '../../../core/services/api_service.dart';
import '../../../shared/models/models.dart';
import '../../../core/widgets/screen_with_nav.dart';
import '../widgets/product_card.dart';
import 'product_detail_screen.dart';

// ── colour tokens matching website ────────────────────────────────────────────
const _lavender = Color(0xFFEDE9FE);
const _sahiPink = Color(0xFFFFF1F2);
const _sahiBlue = Color(0xFFEFF6FF);
const _sahiGreen = Color(0xFFECFDF5);
const _bgPage = Color(0xFFF8FAFC);

Color _catBg(int i) => [_lavender, _sahiPink, _sahiBlue, _sahiGreen][i % 4];

class CategoryProductsScreen extends StatefulWidget {
  final CategoryModel category;
  const CategoryProductsScreen({super.key, required this.category});

  @override
  State<CategoryProductsScreen> createState() => _CategoryProductsScreenState();
}

class _CategoryProductsScreenState extends State<CategoryProductsScreen> {
  final ApiService _apiService = ApiService();
  List<ProductModel> _products = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchProducts();
  }

  Future<void> _fetchProducts() async {
    final products = await _apiService.getProductsByCategory(
      widget.category.id,
      categoryName: widget.category.name,
    );
    if (mounted) {
      setState(() {
        _products = products;
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return ScreenWithNav(
      child: Scaffold(
        backgroundColor: _bgPage,
        body: CustomScrollView(
          slivers: [
            // ── Header — matches website Categories page header ──────────────
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 56, 16, 20),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    // Back button — round white pill exactly like website
                    GestureDetector(
                      onTap: () => Navigator.pop(context),
                      child: Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          shape: BoxShape.circle,
                          border: Border.all(color: const Color(0xFFF1F5F9)),
                          boxShadow: const [
                            BoxShadow(
                              color: Color(0x14000000),
                              blurRadius: 12,
                              offset: Offset(0, 4),
                            ),
                          ],
                        ),
                        child: const Icon(
                          LucideIcons.arrowLeft,
                          size: 18,
                          color: Color(0xFF0F172A),
                        ),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.category.name.toUpperCase(),
                          style: GoogleFonts.outfit(
                            fontSize: 22,
                            fontWeight: FontWeight.w900,
                            color: const Color(0xFF0F172A),
                            letterSpacing: -0.5,
                          ),
                        ),
                        Text(
                          'THERAPEUTIC SEGMENTS',
                          style: GoogleFonts.outfit(
                            fontSize: 8,
                            fontWeight: FontWeight.w900,
                            color: SahimedColors.primary,
                            letterSpacing: 2,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),

            // ── Category image hero card ───────────────────────────────────
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 20),
                child: Container(
                  height: 140,
                  decoration: BoxDecoration(
                    color: _catBg(0),
                    borderRadius: BorderRadius.circular(28),
                    border: Border.all(color: Colors.white, width: 2),
                    boxShadow: const [
                      BoxShadow(
                        color: Color(0x14000000),
                        blurRadius: 16,
                        offset: Offset(0, 6),
                      ),
                    ],
                  ),
                  clipBehavior: Clip.antiAlias,
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      CachedNetworkImage(
                        imageUrl: widget.category.imageUrl,
                        fit: BoxFit.cover,
                        errorWidget: (c, u, e) => const Icon(
                          LucideIcons.pill,
                          color: SahimedColors.primary,
                          size: 48,
                        ),
                      ),
                      // Gradient overlay
                      Container(
                        decoration: const BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.centerLeft,
                            end: Alignment.centerRight,
                            colors: [Color(0xCC000000), Color(0x00000000)],
                          ),
                        ),
                      ),
                      Positioned(
                        left: 20,
                        bottom: 20,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              widget.category.name.toUpperCase(),
                              style: GoogleFonts.outfit(
                                fontSize: 18,
                                fontWeight: FontWeight.w900,
                                color: Colors.white,
                                letterSpacing: -0.3,
                              ),
                            ),
                            if (!_isLoading)
                              Text(
                                '${_products.length} PRODUCTS',
                                style: GoogleFonts.outfit(
                                  fontSize: 9,
                                  fontWeight: FontWeight.w900,
                                  color: Colors.white.withOpacity(0.7),
                                  letterSpacing: 1,
                                ),
                              ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),

            // ── Products grid or empty state ───────────────────────────────
            if (_isLoading)
              SliverPadding(
                padding: const EdgeInsets.all(16),
                sliver: SliverGrid(
                  delegate: SliverChildBuilderDelegate(
                    (_, _) => Container(
                      decoration: BoxDecoration(
                        color: const Color(0xFFE2E8F0),
                        borderRadius: BorderRadius.circular(20),
                      ),
                    ),
                    childCount: 6,
                  ),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    crossAxisSpacing: 10,
                    mainAxisSpacing: 10,
                    childAspectRatio: 0.88,
                  ),
                ),
              )
            else if (_products.isEmpty)
              SliverFillRemaining(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      width: 80,
                      height: 80,
                      decoration: BoxDecoration(
                        color: const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(24),
                      ),
                      child: const Icon(
                        LucideIcons.packageX,
                        color: Color(0xFF94A3B8),
                        size: 36,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'NO PRODUCTS FOUND',
                      style: GoogleFonts.outfit(
                        fontSize: 16,
                        fontWeight: FontWeight.w900,
                        color: const Color(0xFF64748B),
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'We are updating our inventory.',
                      style: GoogleFonts.outfit(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: const Color(0xFF94A3B8),
                      ),
                    ),
                  ],
                ),
              )
            else
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 200),
                sliver: SliverGrid(
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                    childAspectRatio: 0.68,
                  ),
                  delegate: SliverChildBuilderDelegate(
                    (context, i) => GestureDetector(
                      onTap: () => Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => ProductDetailScreen(product: _products[i]),
                        ),
                      ),
                      child: SahimedProductCard(product: _products[i]),
                    ),
                    childCount: _products.length,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
