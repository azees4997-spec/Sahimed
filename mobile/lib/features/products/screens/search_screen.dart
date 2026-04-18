import 'dart:async';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../core/theme/colors.dart';
import '../../../core/services/api_service.dart';
import '../../../core/providers/cart_provider.dart';
import '../../../shared/models/models.dart';
import 'product_detail_screen.dart';
import 'brand_store_screen.dart';

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
  ProductModel? _smartAlternative;
  bool _showSmartBanner = false;
  Timer? _debounce;
  List<String> _searchHistory = [];

  @override
  void initState() {
    super.initState();
    _loadHistory();
    _searchController.addListener(_onSearchChanged);
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _searchController.removeListener(_onSearchChanged);
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadHistory() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _searchHistory = prefs.getStringList('search_history') ?? [];
    });
  }

  Future<void> _saveToHistory(String query) async {
    if (query.isEmpty) return;
    final prefs = await SharedPreferences.getInstance();
    _searchHistory.remove(query); // Remove duplicate
    _searchHistory.insert(0, query); // Add to top
    if (_searchHistory.length > 5) _searchHistory.removeLast(); // Keep only 5
    await prefs.setStringList('search_history', _searchHistory);
    setState(() {});
  }

  void _onSearchChanged() {
    if (_debounce?.isActive ?? false) _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 500), () {
      final query = _searchController.text.trim();
      if (_currentQuery != query) {
        setState(() {
          _currentQuery = query;
          _showSmartBanner = false;
          _smartAlternative = null;
        });
        if (query.length >= 3) {
          _performSearch(query);
        } else {
          setState(() => _results = []);
        }
      }
    });
  }

  Future<void> _performSearch(String query) async {
    _saveToHistory(query);
    setState(() => _isLoading = true);
    final results = await _apiService.searchProducts(query);
    
    if (mounted && _currentQuery == query) {
      _results = results;
      
      // Intelligence Switch logic: If first result is branded, find generic alt
      if (_results.isNotEmpty) {
        final firstProduct = _results.first;
        if (!firstProduct.isGeneric && firstProduct.moleculeId != null) {
          _fetchSmartAlternative(firstProduct);
        }
      }
      
      setState(() => _isLoading = false);
    }
  }

  Future<void> _fetchSmartAlternative(ProductModel original) async {
    try {
      final alt = await _apiService.getGenericAlternative(original.moleculeId!);
      if (alt != null && alt.id != original.id && mounted) {
        setState(() {
          _smartAlternative = alt;
          _showSmartBanner = true;
        });
      }
    } catch (e) {
      debugPrint('Error fetching smart alternative: $e');
    }
  }

  void _searchBySalt(String salt) {
    _searchController.text = salt;
    _performSearch(salt);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        automaticallyImplyLeading: false,
        titleSpacing: 0,
        title: _buildSearchHeader(),
      ),
      body: Column(
        children: [
          // Filter Chips (Website Parity)
          if (_results.isNotEmpty || _currentQuery.isNotEmpty)
            _buildFilterBar(),

          // Smart "Save More" Banner (The Intelligence Switch)
          if (_showSmartBanner && _smartAlternative != null)
            _buildSmartBanner(),

          Expanded(
            child: _currentQuery.isEmpty
                ? _buildRecentSearches()
                : _buildSearchResults(_searchBySalt),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchHeader() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: [
          IconButton(
            icon: const Icon(Icons.arrow_back_ios_new_rounded, color: SahimedColors.primary, size: 20),
            onPressed: () => Navigator.pop(context),
          ),
          Expanded(
            child: Container(
              height: 48,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                color: const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Row(
                children: [
                  const Icon(LucideIcons.search, size: 18, color: Color(0xFF94A3B8)),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextField(
                      controller: _searchController,
                      autofocus: true,
                      style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.bold, color: const Color(0xFF0F172A)),
                      decoration: InputDecoration(
                        hintText: 'Search Medicines, Health Products...',
                        hintStyle: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF94A3B8), fontWeight: FontWeight.w500),
                        border: InputBorder.none,
                        isDense: true,
                      ),
                    ),
                  ),
                  if (_isLoading)
                    const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: SahimedColors.primary))
                  else if (_currentQuery.isNotEmpty)
                    GestureDetector(
                      onTap: () => _searchController.clear(),
                      child: const Icon(Icons.cancel_rounded, size: 20, color: Color(0xFFCBD5E1)),
                    ),
                ],
              ),
            ),
          ),
          const SizedBox(width: 12),
        ],
      ),
    );
  }

  Widget _buildFilterBar() {
    final filters = ['In Stock', 'Best Seller', 'Smart CHOICE', 'Standard Brand'];
    return Container(
      height: 50,
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: filters.length,
        itemBuilder: (ctx, i) {
          return Container(
            margin: const EdgeInsets.only(right: 8),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Center(
              child: Text(
                filters[i],
                style: GoogleFonts.outfit(fontSize: 11, fontWeight: FontWeight.w800, color: const Color(0xFF64748B)),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildSmartBanner() {
    final savings = ((_results.first.price - _smartAlternative!.price) / _results.first.price * 100).round();
    return GestureDetector(
      onTap: () {
        Navigator.push(context, MaterialPageRoute(builder: (context) => ProductDetailScreen(product: _smartAlternative!)));
      },
      child: Container(
        width: double.infinity,
        margin: const EdgeInsets.fromLTRB(16, 8, 16, 16),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFF2563EB), Color(0xFF7C3AED), Color(0xFFDB2777)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: Colors.white, width: 2),
          boxShadow: [
            BoxShadow(color: const Color(0xFF2563EB).withOpacity(0.2), blurRadius: 20, offset: const Offset(0, 10)),
          ],
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(12)),
              child: const Icon(Icons.auto_awesome_rounded, color: Colors.white, size: 20),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'INTELLIGENCE SWITCH',
                    style: GoogleFonts.outfit(fontSize: 8, fontWeight: FontWeight.w900, color: Colors.white.withOpacity(0.8), letterSpacing: 2),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    'SAVE $savings% WITH SMART CHOICE',
                    style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.w900, color: Colors.white),
                  ),
                ],
              ),
            ),
            const Icon(Icons.arrow_forward_ios_rounded, color: Colors.white, size: 14),
          ],
        ),
      ),
    );
  }

  Widget _buildRecentSearches() {
    final topCategories = [
      {'name': 'Stomach Care', 'img': 'https://sahimed.com/assets/categories/stomach.jpg'},
      {'name': 'Derma Care', 'img': 'https://sahimed.com/assets/categories/derma.jpg'},
      {'name': 'Diabetes', 'img': 'https://sahimed.com/assets/categories/diabetes.jpg'},
      {'name': 'Heart Care', 'img': 'https://sahimed.com/assets/categories/heart.jpg'},
      {'name': 'Liver Care', 'img': 'https://sahimed.com/assets/categories/liver.jpg'},
      {'name': 'Respicare', 'img': 'https://sahimed.com/assets/categories/respicare.jpg'},
    ];

    final popularBrands = ['GSK', 'Cipla', 'Abbott', 'Sun Pharma', 'Lupin', 'Cadila'];
    final popularMolecules = ['Metformin', 'Vildagliptin', 'Sitagliptin', 'Atorvastatin', 'Amlodipine', 'Telmisartan'];

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (_searchHistory.isNotEmpty) ...[
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('RECENT SEARCHES', style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.w900, color: SahimedColors.primary, letterSpacing: 1)),
                GestureDetector(
                  onTap: () async {
                    final prefs = await SharedPreferences.getInstance();
                    await prefs.remove('search_history');
                    setState(() => _searchHistory = []);
                  },
                  child: Text('CLEAR', style: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.w900, color: SahimedColors.slate400, letterSpacing: 1)),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _searchHistory.map((h) => _buildSuggestionPill(h)).toList(),
            ),
            const SizedBox(height: 32),
          ],
          
          Text('TOP CATEGORIES', style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.w900, color: SahimedColors.primary, letterSpacing: 1)),
          const SizedBox(height: 16),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 3,
              mainAxisSpacing: 16,
              crossAxisSpacing: 12,
              childAspectRatio: 0.8,
            ),
            itemCount: topCategories.length,
            itemBuilder: (context, i) {
              return Column(
                children: [
                  Container(
                    height: 80,
                    width: 80,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      shape: BoxShape.circle,
                      border: Border.all(color: const Color(0xFFF1F5F9)),
                      boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 10)],
                    ),
                    child: ClipOval(
                      child: CachedNetworkImage(
                        imageUrl: topCategories[i]['img']!,
                        fit: BoxFit.cover,
                        errorWidget: (c, u, e) => const Icon(LucideIcons.pill, color: SahimedColors.primary, size: 24),
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(topCategories[i]['name']!, textAlign: TextAlign.center, style: GoogleFonts.outfit(fontSize: 9, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B))),
                ],
              );
            },
          ),
          
          const SizedBox(height: 32),
          Text('MOST SEARCHED BRANDS', style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.w900, color: SahimedColors.primary, letterSpacing: 1)),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: popularBrands.map((b) => _buildSuggestionPill(b)).toList(),
          ),

          const SizedBox(height: 32),
          Text('MOST SEARCHED MOLECULES', style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.w900, color: SahimedColors.primary, letterSpacing: 1)),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: popularMolecules.map((m) => _buildSuggestionPill(m)).toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildSuggestionPill(String label) {
    return GestureDetector(
      onTap: () {
        _searchController.text = label;
        _performSearch(label);
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(100),
          border: Border.all(color: const Color(0xFFF1F5F9)),
        ),
        child: Text(label, style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w700, color: const Color(0xFF64748B))),
      ),
    );
  }

  Widget _buildSearchResults(Function(String) onSaltTap) {
    if (_results.isEmpty && !_isLoading && _currentQuery.length >= 3) {
      return _buildNoResults();
    }

    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      itemCount: _results.length,
      itemBuilder: (context, index) {
        final product = _results[index];
        return _SearchEntryTile(
          product: product,
          onSaltTap: onSaltTap,
        );
      },
    );
  }

  Widget _buildNoResults() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(LucideIcons.searchX, size: 48, color: Color(0xFFF1F5F9)),
          const SizedBox(height: 16),
          Text('No matches for "$_currentQuery"', style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.bold, color: const Color(0xFF94A3B8))),
        ],
      ),
    );
  }
}

class _SearchEntryTile extends StatelessWidget {
  final ProductModel product;
  final Function(String)? onSaltTap;
  const _SearchEntryTile({required this.product, this.onSaltTap});

  @override
  Widget build(BuildContext context) {
    final savingsAmount = (product.mrp - product.price).round();
    final discount = product.mrp > 0 ? ((savingsAmount / product.mrp) * 100).round() : 0;

    return GestureDetector(
      onTap: () {
        Navigator.push(context, MaterialPageRoute(builder: (context) => ProductDetailScreen(product: product)));
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(28),
          boxShadow: [
            BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 20, offset: const Offset(0, 8)),
          ],
        ),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Premium Floating Image Container
              Stack(
                children: [
                  Container(
                    width: 90,
                    height: 90,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF1FDF9), // Production Mint tint
                      borderRadius: BorderRadius.circular(24),
                    ),
                    child: Hero(
                      tag: 'product_${product.id}',
                      child: CachedNetworkImage(
                        imageUrl: product.imageUrl,
                        fit: BoxFit.contain,
                        errorWidget: (c, u, e) => const Icon(LucideIcons.pill, color: SahimedColors.primary, size: 32),
                      ),
                    ),
                  ),
                  if (discount >= 5)
                    Positioned(
                      top: 0,
                      left: 0,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: const BoxDecoration(
                          color: SahimedColors.success,
                          borderRadius: BorderRadius.only(
                            topLeft: Radius.circular(24),
                            bottomRight: Radius.circular(16),
                          ),
                        ),
                        child: Text(
                          '$discount% OFF',
                          style: GoogleFonts.outfit(fontSize: 8, fontWeight: FontWeight.w900, color: Colors.white),
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(width: 16),
              
              // Name & Detailed Info
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Brand / Manufacturer (Sahimed Pink)
                    GestureDetector(
                      onTap: () {
                        final company = product.company ?? product.brand;
                        if (company.isNotEmpty) {
                          Navigator.push(
                            context,
                            MaterialPageRoute(builder: (context) => BrandStoreScreen(brandName: company)),
                          );
                        }
                      },
                      child: Text(
                        (product.company ?? product.brand).toUpperCase(),
                        style: GoogleFonts.outfit(
                          fontSize: 8, 
                          fontWeight: FontWeight.w900, 
                          color: SahimedColors.accent,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      product.name.toUpperCase(),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.outfit(
                        fontSize: 14, 
                        fontWeight: FontWeight.w900, 
                        color: const Color(0xFF0F172A), 
                        height: 1.1,
                      ),
                    ),
                    const SizedBox(height: 6),
                    
                    // Salt/Molecule (Clickable Link)
                    if ((product.molName ?? product.saltComposition) != null)
                      GestureDetector(
                        onTap: () => onSaltTap?.call(product.molName ?? product.saltComposition!),
                        child: Container(
                          padding: const EdgeInsets.only(bottom: 1),
                          decoration: const BoxDecoration(
                            border: Border(bottom: BorderSide(color: Color(0xFF94A3B8), width: 0.5)),
                          ),
                          child: Text(
                            (product.molName ?? product.saltComposition!).toUpperCase(),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: GoogleFonts.inter(
                              fontSize: 8, 
                              fontWeight: FontWeight.w700, 
                              color: const Color(0xFF64748B),
                            ),
                          ),
                        ),
                      ),
                    
                    const SizedBox(height: 10),
                    
                    // Price and Add Logic
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text(
                                  '₹${product.price.round()}',
                                  style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w900, color: SahimedColors.primary),
                                ),
                                const SizedBox(width: 6),
                                if (product.mrp > product.price)
                                  Text(
                                    '₹${product.mrp.round()}',
                                    style: GoogleFonts.inter(
                                      fontSize: 10, 
                                      color: const Color(0xFFCBD5E1), 
                                      decoration: TextDecoration.lineThrough, 
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                              ],
                            ),
                            if (savingsAmount > 0)
                              Text(
                                'SAVE ₹$savingsAmount',
                                style: GoogleFonts.outfit(
                                  fontSize: 9, 
                                  fontWeight: FontWeight.w900, 
                                  color: SahimedColors.success,
                                ),
                              ),
                          ],
                        ),
                        
                        // Action Button
                        GestureDetector(
                          onTap: () {
                            context.read<CartProvider>().addItem(product);
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text('ADDED TO CART', style: GoogleFonts.outfit(fontWeight: FontWeight.w900, fontSize: 10)),
                                backgroundColor: SahimedColors.primary,
                                behavior: SnackBarBehavior.floating,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                margin: const EdgeInsets.all(20),
                              ),
                            );
                          },
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                            decoration: BoxDecoration(
                              color: SahimedColors.primary,
                              borderRadius: BorderRadius.circular(12),
                              boxShadow: [
                                BoxShadow(color: SahimedColors.primary.withValues(alpha: 0.3), blurRadius: 10, offset: const Offset(0, 4)),
                              ],
                            ),
                            child: Text(
                              'ADD',
                              style: GoogleFonts.outfit(
                                fontSize: 10, 
                                fontWeight: FontWeight.w900, 
                                color: Colors.white, 
                                letterSpacing: 0.5,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
