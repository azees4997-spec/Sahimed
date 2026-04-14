import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
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
    _searchController.addListener(_onSearchChanged);
  }

  @override
  void dispose() {
    _searchController.removeListener(_onSearchChanged);
    _searchController.dispose();
    super.dispose();
  }

  void _onSearchChanged() {
    final query = _searchController.text.trim();
    if (_currentQuery != query) {
      setState(() => _currentQuery = query);
      if (query.length >= 3) {
        _performSearch(query);
      } else {
        setState(() => _results = []);
      }
    }
  }

  Future<void> _performSearch(String query) async {
    setState(() => _isLoading = true);
    final results = await _apiService.searchProducts(query);
    if (mounted && _currentQuery == query) {
      setState(() {
        _results = results;
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: Stack(
        children: [
          // 1. Blurred Background (Glassmorphism Overlay)
          GestureDetector(
            onTap: () => Navigator.pop(context),
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 15, sigmaY: 15),
              child: Container(
                color: Colors.white.withOpacity(0.4),
              ),
            ),
          ),

          // 2. Search UI Container
          SafeArea(
            child: Column(
              children: [
                const SizedBox(height: 12),
                _buildSearchInput(),
                Expanded(
                  child: _currentQuery.isEmpty
                      ? _buildSearchDiscovery()
                      : _buildSearchResults(),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchInput() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(100),
        boxShadow: [
          BoxShadow(color: SahimedColors.primary.withOpacity(0.1), blurRadius: 40, offset: const Offset(0, 15))
        ],
      ),
      child: Row(
        children: [
          IconButton(
            icon: const Icon(LucideIcons.arrowLeft, color: SahimedColors.primary, size: 20),
            onPressed: () => Navigator.pop(context),
          ),
          Expanded(
            child: TextField(
              controller: _searchController,
              autofocus: true,
              style: GoogleFonts.outfit(fontSize: 15, fontWeight: FontWeight.bold, color: SahimedColors.textPrimary),
              decoration: InputDecoration(
                hintText: 'Search medicines or generics...',
                hintStyle: GoogleFonts.outfit(color: SahimedColors.slate400, fontWeight: FontWeight.w500),
                border: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(vertical: 0),
              ),
            ),
          ),
          if (_isLoading)
            const Padding(
              padding: EdgeInsets.only(right: 12),
              child: SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2.5, color: SahimedColors.primary)),
            )
          else if (_currentQuery.isNotEmpty)
            IconButton(
              icon: const Icon(LucideIcons.x, color: SahimedColors.slate400, size: 18),
              onPressed: () => _searchController.clear(),
            ),
          const SizedBox(width: 8),
        ],
      ),
    );
  }

  Widget _buildSearchDiscovery() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(color: SahimedColors.primary.withOpacity(0.1), shape: BoxShape.circle),
            child: const Icon(LucideIcons.search, size: 40, color: SahimedColors.primary),
          ),
          const SizedBox(height: 16),
          Text('Search SahiMed Database', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w900, color: SahimedColors.primary)),
          const SizedBox(height: 8),
          Text('Get real-time prices and availability.', style: GoogleFonts.inter(fontSize: 13, color: SahimedColors.slate500)),
        ],
      ),
    );
  }

  Widget _buildSearchResults() {
    if (_results.isEmpty && !_isLoading && _currentQuery.length >= 3) {
      return _buildNoResults();
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _results.length,
      itemBuilder: (context, index) {
        final product = _results[index];
        return _SearchEntryTile(product: product);
      },
    );
  }

  Widget _buildNoResults() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(LucideIcons.circleAlert, size: 48, color: SahimedColors.slate300),
          const SizedBox(height: 16),
          Text('No matches found for "$_currentQuery"', style: GoogleFonts.outfit(fontSize: 15, fontWeight: FontWeight.bold, color: SahimedColors.slate500)),
        ],
      ),
    );
  }
}

class _SearchEntryTile extends StatelessWidget {
  final ProductModel product;
  const _SearchEntryTile({required this.product});

  @override
  Widget build(BuildContext context) {
    final discount = product.mrp > 0 ? (((product.mrp - product.price) / product.mrp) * 100).round() : 0;

    return GestureDetector(
      onTap: () {
        Navigator.push(context, MaterialPageRoute(builder: (context) => ProductDetailScreen(product: product)));
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.8),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.white),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 20, offset: const Offset(0, 8))],
        ),
        child: Row(
          children: [
            // Medicine Image
            Container(
              width: 52,
              height: 52,
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(color: SahimedColors.slate50, borderRadius: BorderRadius.circular(15)),
              child: CachedNetworkImage(
                imageUrl: product.imageUrl,
                fit: BoxFit.contain,
                errorWidget: (c, u, e) => const Icon(LucideIcons.pill, color: SahimedColors.primary, size: 24),
              ),
            ),
            const SizedBox(width: 14),
            
            // Name & Info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    product.name.toUpperCase(),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.outfit(
                      fontSize: product.name.length > 20 ? 11 : 13,
                      fontWeight: FontWeight.w900,
                      color: SahimedColors.textPrimary,
                      letterSpacing: -0.2,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(color: SahimedColors.slate100, borderRadius: BorderRadius.circular(6)),
                        child: Text(
                          (product.brand).toUpperCase(),
                          style: GoogleFonts.outfit(fontSize: 8, fontWeight: FontWeight.bold, color: SahimedColors.slate500),
                        ),
                      ),
                      const SizedBox(width: 6),
                      if (discount > 0)
                        Text(
                          '₹${product.mrp.toStringAsFixed(0)}',
                          style: TextStyle(fontSize: 10, color: SahimedColors.slate300, decoration: TextDecoration.lineThrough, fontWeight: FontWeight.bold),
                        ),
                    ],
                  ),
                ],
              ),
            ),

            // Price & Add
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  '₹${product.price.toStringAsFixed(0)}',
                  style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w900, color: SahimedColors.primary),
                ),
                const SizedBox(height: 6),
                GestureDetector(
                  onTap: () {
                    context.read<CartProvider>().addItem(product);
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('Added ${product.name}', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                        backgroundColor: SahimedColors.primary,
                        behavior: SnackBarBehavior.floating,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                    );
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(color: SahimedColors.primary, borderRadius: BorderRadius.circular(8)),
                    child: Text('ADD', style: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.white)),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
