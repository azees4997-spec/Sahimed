import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../core/theme/colors.dart';
import '../../../core/services/api_service.dart';
import '../../../shared/models/models.dart';
import '../../../shared/widgets/sahimed_top_nav.dart';
import 'category_products_screen.dart';

class CategoriesScreen extends StatefulWidget {
  const CategoriesScreen({super.key});

  @override
  State<CategoriesScreen> createState() => _CategoriesScreenState();
}

class _CategoriesScreenState extends State<CategoriesScreen> {
  final ApiService _apiService = ApiService();
  List<CategoryModel> _categories = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadCategories();
  }

  Future<void> _loadCategories() async {
    try {
      final cats = await _apiService.getCategories();
      if (mounted) {
        setState(() {
          _categories = cats;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: SahimedColors.background,
      body: Column(
        children: [
          const SahimedTopNav(showBack: true),
          Expanded(
            child: _isLoading
                ? const Center(
                    child: CircularProgressIndicator(color: SahimedColors.primary),
                  )
                : GridView.builder(
                    padding: const EdgeInsets.all(16),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      crossAxisSpacing: 16,
                      mainAxisSpacing: 16,
                      childAspectRatio: 0.85,
                    ),
                    itemCount: _categories.length,
                    itemBuilder: (context, index) {
                      final category = _categories[index];
                      return _CategoryCard(
                        category: category,
                        onTap: () {
                          HapticFeedback.lightImpact();
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => CategoryProductsScreen(category: category),
                            ),
                          );
                        },
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}

class _CategoryCard extends StatelessWidget {
  final CategoryModel category;
  final VoidCallback onTap;

  const _CategoryCard({required this.category, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: const Color(0xFFF1F5F9)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.03),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          children: [
            Expanded(
              child: Container(
                width: double.infinity,
                margin: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: SahimedColors.background,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(20),
                  child: CachedNetworkImage(
                    imageUrl: category.imageUrl,
                    fit: BoxFit.cover,
                    errorWidget: (c, u, e) => const Icon(
                      LucideIcons.pill,
                      color: SahimedColors.primary,
                      size: 32,
                    ),
                  ),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(8, 0, 8, 16),
              child: Text(
                category.name.toUpperCase(),
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: GoogleFonts.outfit(
                  fontSize: 11,
                  fontWeight: FontWeight.w900,
                  color: const Color(0xFF1E293B),
                  letterSpacing: 0.5,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
