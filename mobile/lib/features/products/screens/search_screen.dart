import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:geolocator/geolocator.dart';
import '../../../core/theme/colors.dart';
import '../../../core/services/api_service.dart';
import '../../../core/providers/cart_provider.dart';
import 'product_detail_screen.dart';
import 'brand_store_screen.dart';
import '../../../shared/models/models.dart';
import '../widgets/product_card.dart';

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
  double? _lat;
  double? _lng;
  List<CategoryModel> _categories = [];

  @override
  void initState() {
    super.initState();
    _loadHistory();
    _initLocation();
    _loadCategories();
    _searchController.addListener(_onSearchChanged);
  }

  Future<void> _loadCategories() async {
    final cats = await _apiService.getCategories();
    if (mounted) setState(() => _categories = cats);
  }

  Future<void> _initLocation() async {
    try {
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.whileInUse ||
          permission == LocationPermission.always) {
        final pos = await Geolocator.getCurrentPosition();
        setState(() {
          _lat = pos.latitude;
          _lng = pos.longitude;
        });
      }
    } catch (e) {
      debugPrint('Location error in SearchScreen: $e');
    }
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
      _apiService.logSearch(query, lat: _lat, lng: _lng);

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
    return Container(
      color: const Color(0xFFF8FAFC),
      child: Column(
        children: [
          _buildSearchHeader(),
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
            icon: const Icon(
              Icons.arrow_back_ios_new_rounded,
              color: SahimedColors.primary,
              size: 20,
            ),
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
                  const Icon(
                    LucideIcons.search,
                    size: 18,
                    color: Color(0xFF94A3B8),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextField(
                      controller: _searchController,
                      autofocus: true,
                      style: GoogleFonts.outfit(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: const Color(0xFF0F172A),
                      ),
                      decoration: InputDecoration(
                        hintText: 'Search Medicines, Health Products...',
                        hintStyle: GoogleFonts.inter(
                          fontSize: 13,
                          color: const Color(0xFF94A3B8),
                          fontWeight: FontWeight.w500,
                        ),
                        border: InputBorder.none,
                        isDense: true,
                      ),
                    ),
                  ),
                  if (_isLoading)
                    const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: SahimedColors.primary,
                      ),
                    )
                  else if (_currentQuery.isNotEmpty)
                    GestureDetector(
                      onTap: () => _searchController.clear(),
                      child: const Icon(
                        Icons.cancel_rounded,
                        size: 20,
                        color: Color(0xFFCBD5E1),
                      ),
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
    final filters = [
      'In Stock',
      'Best Seller',
      'Smart CHOICE',
      'Standard Brand',
    ];
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
                style: GoogleFonts.outfit(
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                  color: const Color(0xFF64748B),
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildSmartBanner() {
    final original = _results.first;
    final savingsAmt = (original.price - _smartAlternative!.price).round();
    final savingsPct = original.price > 0
        ? ((savingsAmt / original.price) * 100).round()
        : 0;

    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) =>
                ProductDetailScreen(product: _smartAlternative!),
          ),
        );
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
            BoxShadow(
              color: const Color(0xFF2563EB).withOpacity(0.2),
              blurRadius: 20,
              offset: const Offset(0, 10),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.2),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(
                Icons.auto_awesome_rounded,
                color: Colors.white,
                size: 20,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'SAHI RECOMMENDED CHOICE',
                    style: GoogleFonts.outfit(
                      fontSize: 8,
                      fontWeight: FontWeight.w900,
                      color: Colors.white.withOpacity(0.8),
                      letterSpacing: 2,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    savingsPct > 0
                        ? 'YOU ARE MISSING ₹$savingsAmt IN SAVINGS'
                        : 'SAHI RECOMMENDED BRAND AVAILABLE',
                    style: GoogleFonts.outfit(
                      fontSize: 12,
                      fontWeight: FontWeight.w900,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
            ),
            const Icon(
              Icons.arrow_forward_ios_rounded,
              color: Colors.white,
              size: 14,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRecentSearches() {
    final topCategories = [
      {
        'name': 'Stomach Care',
        'img': 'https://sahimed.com/assets/categories/stomach.jpg',
      },
      {
        'name': 'Derma Care',
        'img': 'https://sahimed.com/assets/categories/derma.jpg',
      },
      {
        'name': 'Diabetes',
        'img': 'https://sahimed.com/assets/categories/diabetes.jpg',
      },
      {
        'name': 'Heart Care',
        'img': 'https://sahimed.com/assets/categories/heart.jpg',
      },
      {
        'name': 'Liver Care',
        'img': 'https://sahimed.com/assets/categories/liver.jpg',
      },
      {
        'name': 'Respicare',
        'img': 'https://sahimed.com/assets/categories/respicare.jpg',
      },
    ];

    final popularBrands = [
      'GSK',
      'Cipla',
      'Abbott',
      'Sun Pharma',
      'Lupin',
      'Cadila',
    ];
    final popularMolecules = [
      'Metformin',
      'Vildagliptin',
      'Sitagliptin',
      'Atorvastatin',
      'Amlodipine',
      'Telmisartan',
    ];

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (_searchHistory.isNotEmpty) ...[
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'RECENT SEARCHES',
                  style: GoogleFonts.outfit(
                    fontSize: 12,
                    fontWeight: FontWeight.w900,
                    color: SahimedColors.primary,
                    letterSpacing: 1,
                  ),
                ),
                GestureDetector(
                  onTap: () async {
                    final prefs = await SharedPreferences.getInstance();
                    await prefs.remove('search_history');
                    setState(() => _searchHistory = []);
                  },
                  child: Text(
                    'CLEAR',
                    style: GoogleFonts.outfit(
                      fontSize: 10,
                      fontWeight: FontWeight.w900,
                      color: SahimedColors.slate400,
                      letterSpacing: 1,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _searchHistory
                  .map((h) => _buildSuggestionPill(h))
                  .toList(),
            ),
            const SizedBox(height: 32),
          ],

          Text(
            'TOP CATEGORIES',
            style: GoogleFonts.outfit(
              fontSize: 12,
              fontWeight: FontWeight.w900,
              color: SahimedColors.primary,
              letterSpacing: 1,
            ),
          ),
          const SizedBox(height: 16),
          _categories.isEmpty
              ? const SizedBox(
                  height: 100,
                  child: Center(
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: SahimedColors.primary,
                    ),
                  ),
                )
              : GridView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 3,
                    mainAxisSpacing: 16,
                    crossAxisSpacing: 12,
                    childAspectRatio: 0.8,
                  ),
                  itemCount: _categories.length.clamp(0, 6),
                  itemBuilder: (context, i) {
                    final cat = _categories[i];
                    return GestureDetector(
                      onTap: () {
                        // Navigate to category filtering
                      },
                      child: Column(
                        children: [
                          Container(
                            height: 80,
                            width: 80,
                            decoration: BoxDecoration(
                              color: Colors.white,
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: const Color(0xFFF1F5F9),
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.04),
                                  blurRadius: 10,
                                ),
                              ],
                            ),
                            child: ClipOval(
                              child: CachedNetworkImage(
                                imageUrl: cat.imageUrl,
                                fit: BoxFit.cover,
                                errorWidget: (c, u, e) => const Icon(
                                  LucideIcons.pill,
                                  color: SahimedColors.primary,
                                  size: 24,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            cat.name.toUpperCase(),
                            textAlign: TextAlign.center,
                            style: GoogleFonts.outfit(
                              fontSize: 9,
                              fontWeight: FontWeight.bold,
                              color: const Color(0xFF1E293B),
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),

          const SizedBox(height: 32),
          Text(
            'MOST SEARCHED BRANDS',
            style: GoogleFonts.outfit(
              fontSize: 12,
              fontWeight: FontWeight.w900,
              color: SahimedColors.primary,
              letterSpacing: 1,
            ),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: popularBrands
                .map((b) => _buildSuggestionPill(b))
                .toList(),
          ),

          const SizedBox(height: 32),
          Text(
            'MOST SEARCHED MOLECULES',
            style: GoogleFonts.outfit(
              fontSize: 12,
              fontWeight: FontWeight.w900,
              color: SahimedColors.primary,
              letterSpacing: 1,
            ),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: popularMolecules
                .map((m) => _buildSuggestionPill(m))
                .toList(),
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
        child: Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 11,
            fontWeight: FontWeight.w700,
            color: const Color(0xFF64748B),
          ),
        ),
      ),
    );
  }

  Widget _buildSearchResults(Function(String) onSaltTap) {
    if (_results.isEmpty && !_isLoading && _currentQuery.length >= 3) {
      return _buildNoResults();
    }

    return GridView.builder(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 200),
      itemCount: _results.length,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        crossAxisSpacing: 10,
        mainAxisSpacing: 10,
        childAspectRatio: 0.58,
      ),
      itemBuilder: (context, index) {
        final product = _results[index];
        return GestureDetector(
          onTap: () => Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => ProductDetailScreen(product: product),
            ),
          ),
          child: SahimedProductCard(product: product),
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
          Text(
            'No matches for "$_currentQuery"',
            style: GoogleFonts.outfit(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: SahimedColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }
}
