import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:geolocator/geolocator.dart';
import '../../../core/theme/colors.dart';
import '../../../core/services/api_service.dart';
import 'product_detail_screen.dart';
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
  List<Map<String, dynamic>> _moleculeResults = [];
  
  // Filter state
  String? _selectedCategory;
  bool _isGenericOnly = false;
  bool _isBestSellerOnly = false;


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
    _debounce = Timer(const Duration(milliseconds: 300), () {
      final query = _searchController.text.trim();
      if (_currentQuery != query) {
        setState(() {
          _currentQuery = query;
          _showSmartBanner = false;
          _smartAlternative = null;
        });
        
        if (query.length >= 2) {
          _fetchSuggestions(query);
        } else {
          setState(() {
            _moleculeResults = [];
            _results = [];
            _smartAlternative = null;
            _showSmartBanner = false;
          });
        }
      }
    });
  }

  Future<void> _fetchSuggestions(String query) async {
    // Only fetch minimal suggestions for the overlay
    try {
      final results = await Future.wait([
        _apiService.searchProducts(query, limit: 5),
        _apiService.searchMolecules(query),
      ]);
      
      if (mounted && _currentQuery == query) {
        setState(() {
          _results = results[0] as List<ProductModel>;
          _moleculeResults = results[1] as List<Map<String, dynamic>>;
        });
      }
    } catch (e) {
      debugPrint('Error fetching suggestions: $e');
    }
  }


  Future<void> _performSearch(String query) async {
    if (query.length < 2) return;
    
    setState(() => _isLoading = true);
    
    // Fetch both products and molecules in parallel
    final results = await Future.wait([
      _apiService.searchProducts(
        query,
        category: _selectedCategory,
        isGeneric: _isGenericOnly ? true : null,
        isBestSeller: _isBestSellerOnly ? true : null,
      ),
      _apiService.searchMolecules(query),
    ]);
    
    final products = results[0] as List<ProductModel>;
    final molecules = results[1] as List<Map<String, dynamic>>;


    if (mounted && _currentQuery == query) {
      _results = products;
      _moleculeResults = molecules;
      
      _apiService.logSearch(
        query, 
        lat: _lat, 
        lng: _lng,
        resultsCount: products.length + molecules.length,
      );

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
    final bool canPop = Navigator.of(context).canPop();

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Stack(
          children: [
            Column(
              children: [
                _buildSearchHeader(canPop),
                // Filter Chips (Website Parity)
                if (_results.isNotEmpty || _currentQuery.isNotEmpty)
                  _buildFilterBar(),
    
                Expanded(
                  child: Stack(
                    children: [
                      _currentQuery.isEmpty
                          ? _buildRecentSearches()
                          : _buildSearchResults(_searchBySalt),
                      
                      // Intelligence Switch Banner at the bottom of the results area
                      if (_showSmartBanner && _smartAlternative != null)
                        Positioned(
                          top: 0,
                          left: 0,
                          right: 0,
                          child: _buildSmartBanner(),
                        ),
                    ],
                  ),
                ),
              ],
            ),

            // Suggestions Overlay
            if (_currentQuery.isNotEmpty && (_moleculeResults.isNotEmpty || _results.isNotEmpty) && !_isLoading && _results.length > 3)
               _buildSuggestionsOverlay(),

            if (_isLoading)
              const Positioned.fill(
                child: Center(
                  child: CircularProgressIndicator(color: SahimedColors.primary),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildSuggestionsOverlay() {
    if (_currentQuery.isEmpty) return const SizedBox.shrink();

    return Positioned(
      top: 60, // Below search bar
      left: 16,
      right: 16,
      child: Container(
        constraints:
            BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.6),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.12),
              blurRadius: 30,
              offset: const Offset(0, 10),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(24),
          child: IntrinsicHeight(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Left Column: Molecules (Salts)
                Expanded(
                  flex: 5,
                  child: Container(
                    color: const Color(0xFFF8FAFC),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          child: Row(
                            children: [
                              Container(
                                width: 6,
                                height: 6,
                                decoration: const BoxDecoration(
                                  color: SahimedColors.primary,
                                  shape: BoxShape.circle,
                                ),
                              ),
                              const SizedBox(width: 8),
                              Text(
                                'MOLECULES',
                                style: GoogleFonts.outfit(
                                  fontSize: 9,
                                  fontWeight: FontWeight.w900,
                                  color: const Color(0xFF94A3B8),
                                  letterSpacing: 1.5,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 12),
                        if (_moleculeResults.isEmpty)
                          Padding(
                            padding: const EdgeInsets.all(16),
                            child: Text(
                              'NO SALTS FOUND',
                              style: GoogleFonts.inter(
                                  fontSize: 10, color: const Color(0xFFCBD5E1)),
                            ),
                          )
                        else
                          Expanded(
                            child: ListView.builder(
                              shrinkWrap: true,
                              padding: EdgeInsets.zero,
                              itemCount: _moleculeResults.length.clamp(0, 8),
                              itemBuilder: (context, index) {
                                final mol = _moleculeResults[index];
                                final name =
                                    mol['molecule'] ?? mol['name'] ?? '';
                                return ListTile(
                                  dense: true,
                                  visualDensity: VisualDensity.compact,
                                  title: Text(
                                    name.toUpperCase(),
                                    style: GoogleFonts.outfit(
                                      fontSize: 11,
                                      fontWeight: FontWeight.bold,
                                      color: const Color(0xFF334155),
                                    ),
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  onTap: () {
                                    HapticFeedback.lightImpact();
                                    _searchController.text = name;
                                    _performSearch(name);
                                  },
                                );
                              },
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
                // Divider
                Container(width: 1, color: const Color(0xFFE2E8F0)),
                // Right Column: Brands (Medicines)
                Expanded(
                  flex: 6,
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          child: Row(
                            children: [
                              Container(
                                width: 6,
                                height: 6,
                                decoration: const BoxDecoration(
                                  color: Color(0xFF10B981),
                                  shape: BoxShape.circle,
                                ),
                              ),
                              const SizedBox(width: 8),
                              Text(
                                'BRANDS',
                                style: GoogleFonts.outfit(
                                  fontSize: 9,
                                  fontWeight: FontWeight.w900,
                                  color: const Color(0xFF94A3B8),
                                  letterSpacing: 1.5,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 12),
                        if (_results.isEmpty)
                          Padding(
                            padding: const EdgeInsets.all(16),
                            child: Text(
                              'NO PRODUCTS FOUND',
                              style: GoogleFonts.inter(
                                  fontSize: 10, color: const Color(0xFFCBD5E1)),
                            ),
                          )
                        else
                          Expanded(
                            child: ListView.builder(
                              shrinkWrap: true,
                              padding: EdgeInsets.zero,
                              itemCount: _results.length.clamp(0, 8),
                              itemBuilder: (context, index) {
                                final prod = _results[index];
                                return ListTile(
                                  dense: true,
                                  visualDensity: VisualDensity.compact,
                                  title: Text(
                                    prod.name.toUpperCase(),
                                    style: GoogleFonts.outfit(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w900,
                                      color: SahimedColors.primary,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  subtitle: Text(
                                    '₹${prod.price}',
                                    style: GoogleFonts.inter(
                                      fontSize: 10,
                                      fontWeight: FontWeight.bold,
                                      color: const Color(0xFF64748B),
                                    ),
                                  ),
                                  onTap: () {
                                    HapticFeedback.lightImpact();
                                    _saveToHistory(prod.name);
                                    Navigator.push(
                                      context,
                                      MaterialPageRoute(
                                        builder: (context) =>
                                            ProductDetailScreen(product: prod),
                                      ),
                                    );
                                  },
                                );
                              },
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSearchHeader(bool canPop) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: [
          if (canPop) ...[
            GestureDetector(
              onTap: () {
                HapticFeedback.lightImpact();
                Navigator.pop(context);
              },
              child: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.white,
                  shape: BoxShape.circle,
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: const Icon(
                  LucideIcons.chevronLeft,
                  size: 20,
                  color: Color(0xFF0F172A),
                ),
              ),
            ),
            const SizedBox(width: 12),
          ],
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
                      onSubmitted: (value) {
                        if (value.trim().isNotEmpty) {
                          _performSearch(value.trim());
                        }
                      },
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
                      onTap: () {
                        HapticFeedback.selectionClick();
                        _searchController.clear();
                      },
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
        ],
      ),
    );
  }

  Widget _buildFilterBar() {
    final filters = [
      {'label': 'Best Seller', 'active': _isBestSellerOnly},
      {'label': 'Smart Choice', 'active': _isGenericOnly},
      if (_selectedCategory != null) {'label': _selectedCategory!, 'active': true},
    ];

    return Container(
      height: 54,
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: filters.length,
        itemBuilder: (ctx, i) {
          final filter = filters[i];
          final bool isActive = filter['active'] as bool;
          final String label = filter['label'] as String;

          return GestureDetector(
            onTap: () {
              HapticFeedback.selectionClick();
              setState(() {
                if (label == 'Best Seller') {
                  _isBestSellerOnly = !_isBestSellerOnly;
                } else if (label == 'Smart Choice') {
                  _isGenericOnly = !_isGenericOnly;
                } else if (_selectedCategory == label) {
                  _selectedCategory = null;
                }
              });
              _performSearch(_searchController.text.trim());
            },
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              margin: const EdgeInsets.only(right: 10),
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
              decoration: BoxDecoration(
                color: isActive ? SahimedColors.primary : Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: isActive ? SahimedColors.primary : const Color(0xFFE2E8F0),
                  width: 1.5,
                ),
                boxShadow: isActive ? [
                  BoxShadow(
                    color: SahimedColors.primary.withOpacity(0.3),
                    blurRadius: 8,
                    offset: const Offset(0, 4),
                  )
                ] : null,
              ),
              child: Row(
                children: [
                  Text(
                    label.toUpperCase(),
                    style: GoogleFonts.outfit(
                      fontSize: 10,
                      fontWeight: FontWeight.w900,
                      color: isActive ? Colors.white : const Color(0xFF64748B),
                      letterSpacing: 0.5,
                    ),
                  ),
                  if (isActive) ...[
                    const SizedBox(width: 6),
                    const Icon(Icons.close, size: 12, color: Colors.white),
                  ],
                ],
              ),
            ),
          );
        },
      ),
    );
  }


  Widget _buildSmartBanner() {
    if (_results.isEmpty || _smartAlternative == null) return const SizedBox.shrink();
    final original = _results.first;
    final savingsAmt = (original.price - _smartAlternative!.price).round();
    final savingsPct = original.price > 0
        ? ((savingsAmt / original.price) * 100).round()
        : 0;

    return GestureDetector(
      onTap: () {
        HapticFeedback.mediumImpact();
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
              color: const Color(0xFF2563EB).withValues(alpha: 0.2),
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
                    HapticFeedback.mediumImpact();
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
                        HapticFeedback.mediumImpact();
                        setState(() {
                          _selectedCategory = cat.name;
                          _searchController.text = cat.name;
                        });
                        _performSearch(cat.name);
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
        HapticFeedback.lightImpact();
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
    if (_results.isEmpty && _moleculeResults.isEmpty && !_isLoading && _currentQuery.length >= 2) {
      return _buildNoResults();
    }

    return ListView(
      padding: const EdgeInsets.fromLTRB(0, 16, 0, 200),
      children: [
        if (_moleculeResults.isNotEmpty) _buildMoleculeSuggestions(),
        if (_results.isNotEmpty)
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: _results.length,
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: 0.68,
            ),
            itemBuilder: (context, index) {
              final product = _results[index];
              return GestureDetector(
                onTap: () {
                  HapticFeedback.lightImpact();
                  _saveToHistory(_currentQuery);
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => ProductDetailScreen(product: product),
                    ),
                  );
                },
                child: SahimedProductCard(product: product),
              );
            },
          ),
      ],
    );
  }

  Widget _buildMoleculeSuggestions() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Text(
            'SUGGESTED MOLECULES / SALTS',
            style: GoogleFonts.outfit(
              fontSize: 10,
              fontWeight: FontWeight.w900,
              color: SahimedColors.slate400,
              letterSpacing: 1.5,
            ),
          ),
        ),
        SizedBox(
          height: 45,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: _moleculeResults.length,
            itemBuilder: (context, index) {
              final mol = _moleculeResults[index];
              final name = mol['molecule'] ?? mol['name'] ?? 'Unknown';
              return GestureDetector(
                onTap: () {
                  _searchController.text = name;
                  _performSearch(name);
                },
                child: Container(
                  margin: const EdgeInsets.only(right: 8),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: SahimedColors.primary.withOpacity(0.05),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: SahimedColors.primary.withOpacity(0.1)),
                  ),
                  child: Row(
                    children: [
                      const Icon(LucideIcons.flaskConical, size: 14, color: SahimedColors.primary),
                      const SizedBox(width: 8),
                      Text(
                        name.toUpperCase(),
                        style: GoogleFonts.outfit(
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                          color: SahimedColors.primary,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
        const SizedBox(height: 16),
        const Divider(height: 1, color: Color(0xFFF1F5F9)),
        const SizedBox(height: 16),
      ],
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
