import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/colors.dart';
import '../../../core/services/api_service.dart';
import '../../../shared/models/models.dart';
import 'product_detail_screen.dart';

class BrandStoreScreen extends StatefulWidget {
  final String brandName;
  const BrandStoreScreen({super.key, required this.brandName});

  @override
  State<BrandStoreScreen> createState() => _BrandStoreScreenState();
}

class _BrandStoreScreenState extends State<BrandStoreScreen> {
  final ApiService _apiService = ApiService();
  List<ProductModel> _products = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchProducts();
  }

  Future<void> _fetchProducts() async {
    final products = await _apiService.getProductsByMarketer(widget.brandName);
    if (mounted) {
      setState(() {
        _products = products;
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: SahimedColors.background,
      body: CustomScrollView(
        slivers: [
          _buildSliverAppBar(),
          if (_isLoading)
            const SliverFillRemaining(
              child: Center(child: CircularProgressIndicator(color: SahimedColors.primary)),
            )
          else if (_products.isEmpty)
            _buildEmptyState()
          else
            _buildProductGrid(),
        ],
      ),
    );
  }

  Widget _buildSliverAppBar() {
    return SliverAppBar(
      expandedHeight: 200,
      pinned: true,
      backgroundColor: SahimedColors.white,
      elevation: 0,
       leading: IconButton(
        icon: const Icon(Icons.arrow_back_ios_new_rounded, color: SahimedColors.primary, size: 20),
        onPressed: () => Navigator.pop(context),
      ),
      flexibleSpace: FlexibleSpaceBar(
        centerTitle: true,
        title: Text(
          widget.brandName.toUpperCase(),
          style: GoogleFonts.outfit(
            fontSize: 16,
            fontWeight: FontWeight.w900,
            color: SahimedColors.slate950,
            letterSpacing: 2,
          ),
        ),
        background: Container(
          decoration: BoxDecoration(
            color: SahimedColors.white,
            gradient: LinearGradient(
              colors: [
                SahimedColors.sahiPink.withValues(alpha: 0.3),
                SahimedColors.white,
                SahimedColors.white,
              ],
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
            ),
          ),
          child: Center(
            child: Opacity(
              opacity: 0.05,
              child: Text(
                widget.brandName,
                textAlign: TextAlign.center,
                style: GoogleFonts.outfit(
                  fontSize: 120,
                  fontWeight: FontWeight.w900,
                  color: SahimedColors.primary,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildProductGrid() {
    return SliverPadding(
      padding: const EdgeInsets.all(12),
      sliver: SliverGrid(
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          crossAxisSpacing: 10,
          mainAxisSpacing: 10,
          childAspectRatio: 0.62,
        ),
        delegate: SliverChildBuilderDelegate(
          (context, index) => _ProductCard(product: _products[index]),
          childCount: _products.length,
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return SliverFillRemaining(
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.business_rounded, size: 80, color: SahimedColors.slate200),
            const SizedBox(height: 16),
            Text(
              'BRAND COLLECTION COMING SOON',
              style: GoogleFonts.outfit(
                fontSize: 18,
                fontWeight: FontWeight.w900,
                color: SahimedColors.slate400,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'We are adding more products from ${widget.brandName}.',
              textAlign: TextAlign.center,
              style: GoogleFonts.inter(
                fontSize: 14,
                color: SahimedColors.slate400,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ProductCard extends StatelessWidget {
  final ProductModel product;
  const _ProductCard({required this.product});

  @override
  Widget build(BuildContext context) {
    final accentColor = product.isGeneric ? SahimedColors.accent : SahimedColors.primary;
    final savingsPct = product.mrp > product.price 
        ? (((product.mrp - product.price) / product.mrp) * 100).round() 
        : 0;

    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => ProductDetailScreen(product: product),
          ),
        );
      },
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: SahimedColors.slate100),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.03),
              blurRadius: 15,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Stack(
              children: [
                Container(
                  height: 120,
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  decoration: const BoxDecoration(
                    color: SahimedColors.background,
                    borderRadius: BorderRadius.only(
                      topLeft: Radius.circular(24),
                      topRight: Radius.circular(24),
                    ),
                  ),
                  child: Hero(
                    tag: 'product_brand_${product.id}',
                    child: Image.network(
                      product.imageUrl,
                      fit: BoxFit.contain,
                      errorBuilder: (c, e, s) => Icon(Icons.medication_rounded, color: accentColor, size: 40),
                    ),
                  ),
                ),
                if (savingsPct > 0)
                  Positioned(
                    top: 8,
                    left: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: SahimedColors.accent,
                        borderRadius: BorderRadius.circular(100),
                      ),
                      child: Text(
                        'SAVE $savingsPct%',
                        style: GoogleFonts.outfit(
                          fontSize: 9,
                          fontWeight: FontWeight.w900,
                          color: Colors.white,
                        ),
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
                    product.name.toUpperCase(),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.outfit(
                      fontSize: 12,
                      fontWeight: FontWeight.w900,
                      color: SahimedColors.slate950,
                      height: 1.2,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '₹${product.price.round()}',
                            style: GoogleFonts.outfit(
                              fontSize: 18,
                              fontWeight: FontWeight.w900,
                              color: SahimedColors.primary,
                            ),
                          ),
                          if (savingsPct > 0)
                            Text(
                              '₹${product.mrp.round()}',
                              style: GoogleFonts.inter(
                                fontSize: 10,
                                color: SahimedColors.slate400,
                                decoration: TextDecoration.lineThrough,
                              ),
                            ),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: SahimedColors.primary,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(Icons.add_shopping_cart_rounded, color: Colors.white, size: 16),
                      ),
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
