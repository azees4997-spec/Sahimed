import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/colors.dart';
import '../../../core/services/api_service.dart';
import '../../../core/providers/cart_provider.dart';
import '../../../shared/models/models.dart';
import 'product_detail_screen.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final ApiService _apiService = ApiService();
  final TextEditingController _searchController = TextEditingController();
  List<ProductModel> _results = [];
  bool _isLoading = false;
  String _currentQuery = '';

  @override
  void initState() {
    super.initState();
    _searchController.addListener(() {
      final query = _searchController.text.trim();
      if (_currentQuery != query) {
        setState(() => _currentQuery = query);
        if (query.length >= 3 && query.length <= 40) {
          _performSearch(query);
        } else if (query.isEmpty) {
          setState(() {
            _results = [];
          });
        }
      }
    });
  }

  Future<void> _performSearch(String query) async {
    if (query.isEmpty) return;
    setState(() => _isLoading = true);
    final results = await _apiService.searchProducts(query);
    if (mounted) {
      if (results.isNotEmpty || query.length >= 5) {
        _apiService.logSearch(query, results.length);
      }
      setState(() {
        _results = results;
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final isValidLength = _currentQuery.length >= 3 && _currentQuery.length <= 40;
    final isSearching = _currentQuery.isNotEmpty;

    return Scaffold(
      backgroundColor: SahimedColors.background,
      appBar: AppBar(
        backgroundColor: SahimedColors.white,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: SahimedColors.primary, size: 18),
          onPressed: () => Navigator.pop(context),
        ),
        title: Container(
          height: 48,
          decoration: BoxDecoration(
            color: SahimedColors.background,
            borderRadius: BorderRadius.circular(100),
            border: Border.all(color: SahimedColors.slate100),
          ),
          child: TextField(
            controller: _searchController,
            autofocus: true,
            maxLength: 40,
            style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.bold),
            decoration: InputDecoration(
              counterText: '',
              hintText: 'Search medicines (min 3 chars)..',
              hintStyle: GoogleFonts.outfit(color: SahimedColors.slate400, fontWeight: FontWeight.normal),
              border: InputBorder.none,
              enabledBorder: InputBorder.none,
              focusedBorder: InputBorder.none,
              prefixIcon: const Icon(Icons.search_rounded, color: SahimedColors.slate400),
              suffixIcon: isSearching ? IconButton(
                icon: const Icon(Icons.close_rounded, color: SahimedColors.slate400, size: 20),
                onPressed: () {
                  _searchController.clear();
                },
              ) : null,
              contentPadding: const EdgeInsets.symmetric(vertical: 12),
            ),
          ),
        ),
      ),
      body: isSearching 
          ? (!isValidLength 
              ? _buildInvalidLengthState() 
              : _buildSearchResults())
          : _buildDiscoveryLanding(),
    );
  }

  Widget _buildInvalidLengthState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.keyboard_alt_outlined, size: 48, color: SahimedColors.slate200),
          const SizedBox(height: 16),
          Text(
            'Keep typing...',
            style: GoogleFonts.outfit(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: SahimedColors.slate400,
            ),
          ),
          Text(
            'Please enter at least 3 characters.',
            style: GoogleFonts.outfit(
              fontSize: 12,
              color: SahimedColors.slate400,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchResults() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator(color: SahimedColors.primary));
    }
    
    if (_results.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.search_off_rounded, size: 80, color: SahimedColors.slate200),
            const SizedBox(height: 16),
            Text(
              'NO RESULTS FOUND',
              style: GoogleFonts.outfit(
                fontSize: 18,
                fontWeight: FontWeight.w900,
                color: SahimedColors.slate400,
              ),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _results.length,
      itemBuilder: (context, index) {
        final product = _results[index];
        return _SearchResultTile(product: product);
      },
    );
  }

  Widget _buildDiscoveryLanding() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: SahimedColors.primary.withValues(alpha: 0.05),
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: SahimedColors.primary.withValues(alpha: 0.1)),
        ),
        child: Column(
          children: [
            const Icon(Icons.manage_search_rounded, size: 48, color: SahimedColors.primary),
            const SizedBox(height: 16),
            Text(
              'Live Database Search',
              style: GoogleFonts.outfit(
                fontSize: 16,
                fontWeight: FontWeight.w900,
                color: SahimedColors.primary,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Search by item name, molecules name, or brand to pull real-time availability and prices from our datastore.',
              textAlign: TextAlign.center,
              style: GoogleFonts.outfit(
                fontSize: 12,
                color: SahimedColors.slate500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SearchResultTile extends StatelessWidget {
  final ProductModel product;
  const _SearchResultTile({required this.product});

  @override
  Widget build(BuildContext context) {
    final discount = product.mrp > 0 ? (((product.mrp - product.price) / product.mrp) * 100).round() : 0;
    
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
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: SahimedColors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: SahimedColors.slate100),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.02),
              blurRadius: 10,
              offset: const Offset(0, 4),
            )
          ]
        ),
        child: Row(
          children: [
            // Compact Image
            Container(
              width: 44,
              height: 44,
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: SahimedColors.background,
                borderRadius: BorderRadius.circular(8),
              ),
              child: CachedNetworkImage(
                imageUrl: product.imageUrl,
                fit: BoxFit.contain,
                errorWidget: (c, u, e) => const Icon(Icons.medication_rounded, color: SahimedColors.primary, size: 20),
              ),
            ),
            const SizedBox(width: 12),
            
            // Name & Molecule
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    product.name.toUpperCase(),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.outfit(
                      fontSize: 12,
                      fontWeight: FontWeight.w900,
                      color: SahimedColors.slate950,
                      letterSpacing: -0.2,
                    ),
                  ),
                  Row(
                    children: [
                      Flexible(
                        child: Text(
                          (product.molName ?? product.brand).toUpperCase(),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: GoogleFonts.outfit(
                            fontSize: 9,
                            fontWeight: FontWeight.w700,
                            color: SahimedColors.slate400,
                          ),
                        ),
                      ),
                      const SizedBox(width: 4),
                      if (discount > 0)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                          decoration: BoxDecoration(
                            color: SahimedColors.emerald500.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            '$discount% OFF',
                            style: GoogleFonts.outfit(
                              fontSize: 8,
                              fontWeight: FontWeight.w900,
                              color: SahimedColors.emerald500,
                            ),
                          ),
                        ),
                    ],
                  ),
                ],
              ),
            ),
            
            // Prices
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  '₹${product.price.toStringAsFixed(0)}',
                  style: GoogleFonts.outfit(
                    fontSize: 14,
                    fontWeight: FontWeight.w900,
                    color: SahimedColors.slate950,
                  ),
                ),
                if (product.mrp > product.price)
                  Text(
                    '₹${product.mrp.toStringAsFixed(0)}',
                    style: TextStyle(
                      fontSize: 10,
                      decoration: TextDecoration.lineThrough,
                      color: SahimedColors.slate300,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
              ],
            ),
            const SizedBox(width: 12),
            
            // Add Button
            GestureDetector(
              onTap: () {
                final cartProvider = Provider.of<CartProvider>(context, listen: false);
                cartProvider.addItem(product);
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    duration: const Duration(seconds: 1),
                    backgroundColor: SahimedColors.primary,
                    content: Text('Added ${product.name} to Cart', style: GoogleFonts.outfit()),
                  ),
                );
              },
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: SahimedColors.primary,
                  borderRadius: BorderRadius.circular(8),
                  boxShadow: [
                    BoxShadow(
                      color: SahimedColors.primary.withValues(alpha: 0.2),
                      blurRadius: 8,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Text(
                  'ADD',
                  style: GoogleFonts.outfit(
                    fontSize: 10,
                    fontWeight: FontWeight.w900,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
