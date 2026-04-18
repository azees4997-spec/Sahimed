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
import 'brand_store_screen.dart';

class ProductDetailScreen extends StatefulWidget {
  final ProductModel product;
  const ProductDetailScreen({super.key, required this.product});

  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen> with SingleTickerProviderStateMixin {
  final ApiService _apiService = ApiService();
  ProductModel? _genericAlt;
  List<ProductModel> _similarMedicines = [];
  bool _isLoading = true;
  int _currentImageIndex = 0;
  late final PageController _pageController;
  late final TabController _tabController;

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
    _tabController = TabController(length: 3, vsync: this);
    _fetchGenericAlternative();
  }

  @override
  void dispose() {
    _pageController.dispose();
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _fetchGenericAlternative() async {
    // If already generic, we don't necessarily need an alternative, or we could find another
    if (widget.product.moleculeId == null) {
      if (mounted) setState(() => _isLoading = false);
      return;
    }

    try {
      final generic = await _apiService.getGenericAlternative(widget.product.moleculeId!);
      // Fix: Ensure we don't show the same product as an alternative
      if (generic != null && generic.id == widget.product.id) {
        // If the "generic" is actually this product, look for similar brands instead
        final similar = await _apiService.getSimilarMedicines(widget.product.moleculeId!, excludeId: widget.product.id);
        if (mounted) {
          setState(() {
            _similarMedicines = similar;
            _isLoading = false;
          });
        }
        return;
      }

      if (generic == null) {
        // Fallback: Fetch other brands with same salt
        final similar = await _apiService.getSimilarMedicines(widget.product.moleculeId!, excludeId: widget.product.id);
        if (mounted) {
          setState(() {
            _similarMedicines = similar;
            _isLoading = false;
          });
        }
      } else if (mounted) {
        setState(() {
          _genericAlt = generic;
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Error fetching alternatives: $e');
      if (mounted) setState(() => _isLoading = false);
    }
  }

  List<String> get _allImages {
    final imgs = widget.product.imageUrls.isNotEmpty
        ? widget.product.imageUrls
        : [widget.product.imageUrl];
    return imgs.where((u) => u.isNotEmpty).toList();
  }

  void _showFullScreen(BuildContext context, String imageUrl) {
    Navigator.push(context, MaterialPageRoute(builder: (_) => _FullScreenImageViewer(
      imageUrl: imageUrl,
      product: widget.product,
    )));
  }

  @override
  Widget build(BuildContext context) {
    // Logic for Website Parity
    final isBranded = !widget.product.isGeneric;
    final hasGeneric = isBranded && _genericAlt != null;
    
    // Switch savings calculated based on Branded MRP - Generic Sahi Price
    final switchSavings = hasGeneric
        ? (widget.product.mrp - _genericAlt!.price).round()
        : 0;

    final isRx = widget.product.rxRequired || widget.product.prescriptionRequired;
    final images = _allImages;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: SahimedColors.primary, size: 18),
          onPressed: () => Navigator.pop(context),
        ),
        title: Column(
          children: [
            Text(
              'SALT COMPOSITION',
              style: GoogleFonts.outfit(fontSize: 8, fontWeight: FontWeight.w900, color: SahimedColors.slate400, letterSpacing: 1.5),
            ),
            const SizedBox(height: 2),
            Text(
              (widget.product.molName ?? widget.product.saltComposition ?? 'Pharmaceutical Info').toUpperCase(),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.w900, color: SahimedColors.slate950),
            ),
          ],
        ),
        actions: [
          IconButton(
            onPressed: () {},
            icon: const Icon(Icons.share_rounded, color: SahimedColors.primary),
          ),
        ],
      ),
      body: Stack(
        children: [
          SingleChildScrollView(
            child: Column(
              children: [
                if (isRx)
                  _buildRxBadge(),

                const SizedBox(height: 16),

                // Illustration / Image Carousel (Premium Glass View)
                _buildImageCarousel(images),

                const SizedBox(height: 16),

                // Switch & Save Banner (Website Gradient Style)
                if (hasGeneric && switchSavings > 0)
                  _buildSwitchBanner(switchSavings),

                // ── Comparison Cards (Grid layout) ────────────────────────
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: _isLoading
                      ? const Center(child: Padding(padding: EdgeInsets.all(20), child: CircularProgressIndicator(color: SahimedColors.primary)))
                      : Column(
                          children: [
                            if (hasGeneric)
                              Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Expanded(
                                    child: _ComparisonCard(
                                      product: widget.product,
                                      label: 'STANDARD BRAND',
                                      isGenericAlt: false,
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: _ComparisonCard(
                                      product: _genericAlt!,
                                      label: 'SMART CHOICE',
                                      isGenericAlt: true,
                                      savingsAmount: switchSavings,
                                    ),
                                  ),
                                ],
                              )
                            else ...[
                              Center(
                                child: ConstrainedBox(
                                  constraints: const BoxConstraints(maxWidth: 240),
                                  child: _ComparisonCard(
                                    product: widget.product,
                                    label: widget.product.isGeneric ? 'SMART CHOICE' : 'STANDARD BRAND',
                                    isGenericAlt: false,
                                  ),
                                ),
                              ),
                              if (_similarMedicines.isNotEmpty) ...[
                                const SizedBox(height: 32),
                                _buildSimilarMedicinesHeader(),
                                const SizedBox(height: 16),
                                _buildSimilarMedicinesList(),
                              ],
                            ],
                          ],
                        ),
                ),

                const SizedBox(height: 24),

                // ── Clinical Tabs (Information, Safety, Interactions) ────
                _buildInfoTabs(),
                
                const SizedBox(height: 140), // Spacing for sticky bottom
              ],
            ),
          ),
          
          // Sticky Bottom Checkout
          _buildStickyBottom(context, hasGeneric),
        ],
      ),
    );
  }

  Widget _buildRxBadge() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 16),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF1F2),
        border: Border(bottom: BorderSide(color: Colors.red.withOpacity(0.05))),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.verified_user_rounded, color: Color(0xFFE11D48), size: 12),
          const SizedBox(width: 8),
          Text(
            'RX REQUIRED • VERIFIED PRESCRIPTION NEEDED',
            style: GoogleFonts.outfit(fontSize: 8, fontWeight: FontWeight.w900, color: const Color(0xFFE11D48), letterSpacing: 1),
          ),
        ],
      ),
    );
  }

  Widget _buildImageCarousel(List<String> images) {
    return SizedBox(
      height: 240,
      child: Stack(
        children: [
          PageView.builder(
            controller: _pageController,
            itemCount: images.length,
            onPageChanged: (i) => setState(() => _currentImageIndex = i),
            itemBuilder: (ctx, i) {
              return GestureDetector(
                onTap: () => _showFullScreen(ctx, images[i]),
                child: Container(
                  margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(40),
                    border: Border.all(color: Colors.white, width: 2),
                    boxShadow: [
                      BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 40, offset: const Offset(0, 10)),
                    ],
                  ),
                  child: Hero(
                    tag: i == 0 ? 'product_${widget.product.id}' : 'product_${widget.product.id}_$i',
                    child: CachedNetworkImage(
                      imageUrl: images[i],
                      fit: BoxFit.contain,
                      errorWidget: (c, u, e) => const Icon(Icons.medication_rounded, color: SahimedColors.primary, size: 80),
                    ),
                  ),
                ),
              );
            },
          ),
          if (images.length > 1)
            Positioned(
              bottom: 24,
              left: 0,
              right: 0,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(images.length, (i) => AnimatedContainer(
                  duration: const Duration(milliseconds: 300),
                  margin: const EdgeInsets.symmetric(horizontal: 3),
                  width: _currentImageIndex == i ? 20 : 6,
                  height: 6,
                  decoration: BoxDecoration(
                    color: _currentImageIndex == i ? SahimedColors.primary : SahimedColors.slate200,
                    borderRadius: BorderRadius.circular(3),
                  ),
                )),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildSwitchBanner(int savings) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFF2563EB), Color(0xFF7C3AED), Color(0xFFDB2777)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(color: const Color(0xFF2563EB).withOpacity(0.2), blurRadius: 20, offset: const Offset(0, 8)),
          ],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.trending_down_rounded, color: Colors.white, size: 16),
            const SizedBox(width: 10),
            Text(
              'SWITCH TO SMART CHOICE AND SAVE ₹$savings'.toUpperCase(),
              style: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: 1),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSimilarMedicinesHeader() {
    return Column(
      children: [
        Text(
          'IDENTICAL SALT ALTERNATIVES',
          style: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.w900, color: SahimedColors.slate400, letterSpacing: 2),
        ),
        const SizedBox(height: 4),
        Container(width: 40, height: 2, decoration: BoxDecoration(color: SahimedColors.primary.withOpacity(0.3), borderRadius: BorderRadius.circular(1))),
      ],
    );
  }

  Widget _buildSimilarMedicinesList() {
    return SizedBox(
      height: 240,
      child: ListView.builder(
        padding: const EdgeInsets.symmetric(horizontal: 4),
        scrollDirection: Axis.horizontal,
        itemCount: _similarMedicines.length,
        itemBuilder: (ctx, i) {
          final p = _similarMedicines[i];
          return Padding(
            padding: const EdgeInsets.only(right: 12),
            child: SizedBox(
              width: 160,
              child: InkWell(
                onTap: () => Navigator.pushReplacement(ctx, MaterialPageRoute(builder: (_) => ProductDetailScreen(product: p))),
                child: _ComparisonCard(
                  product: p,
                  label: p.isGeneric ? 'SMART CHOICE' : 'STANDARD BRAND',
                  isGenericAlt: false,
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildInfoTabs() {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Container(
            height: 54,
            width: double.infinity,
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              color: const Color(0xFFF1F5F9),
              borderRadius: BorderRadius.circular(28),
            ),
            child: TabBar(
              controller: _tabController,
              indicator: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 4))],
              ),
              labelColor: SahimedColors.primary,
              unselectedLabelColor: SahimedColors.slate500,
              labelStyle: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1),
              dividerColor: Colors.transparent,
              tabs: const [
                Tab(text: 'INFORMATION'),
                Tab(text: 'SAFETY ADVICE'),
                Tab(text: 'INTERACTIONS'),
              ],
            ),
          ),
        ),
        const SizedBox(height: 24),
        SizedBox(
          height: 480, // Approximate height for content
          child: TabBarView(
            controller: _tabController,
            children: [
              _buildInformationTab(),
              _buildSafetyTab(),
              _buildInteractionsTab(),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildInformationTab() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        children: [
          _buildInfoCard(
            icon: Icons.assignment_rounded,
            title: 'MEDICAL USES',
            content: widget.product.treatment ?? 'Standard therapeutic application for clinical symptoms related to this profile.',
            color: const Color(0xFFEEF2FF),
          ),
          const SizedBox(height: 16),
          _buildInfoCard(
            icon: Icons.info_outline_rounded,
            title: 'PRODUCT DESCRIPTION',
            content: widget.product.description ?? 'Certified pharmaceutical formulation manufactured under strictly controlled clinical standards.',
            color: const Color(0xFFF0FDF4),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoCard({required IconData icon, required String title, required String content, required Color color}) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(32),
        border: Border.all(color: Colors.white, width: 2),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 20, color: SahimedColors.primary),
              const SizedBox(width: 12),
              Text(title, style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.w900, color: const Color(0xFF0F172A), letterSpacing: 1)),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            content.toUpperCase(),
            style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w700, color: const Color(0xFF64748B), height: 1.6),
          ),
        ],
      ),
    );
  }

  Widget _buildSafetyTab() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        children: [
          _buildSafetyCard(
            icon: Icons.warning_amber_rounded,
            title: 'SAFETY ADVICE',
            content: widget.product.safetyAdvice ?? 'Caution: Maintain established clinical dosage. Consult your physician immediately if adverse reactions occur.',
            color: const Color(0xFFFFF1F2),
            iconColor: Colors.redAccent,
          ),
          const SizedBox(height: 16),
          _buildSafetyCard(
            icon: Icons.local_hospital_rounded,
            title: 'HOW TO USE',
            content: widget.product.howToUse ?? 'Administer exactly as directed by your healthcare professional. Do not exceed the prescribed pharmaceutical frequency.',
            color: const Color(0xFFF0F9FF),
            iconColor: SahimedColors.primary,
          ),
        ],
      ),
    );
  }

  Widget _buildSafetyCard({required IconData icon, required String title, required String content, required Color color, required Color iconColor}) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(32),
        border: Border.all(color: Colors.white, width: 2),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
            child: Icon(icon, size: 24, color: iconColor),
          ),
          const SizedBox(width: 20),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.w900, color: iconColor, letterSpacing: 1.5)),
                const SizedBox(height: 8),
                Text(
                  content.toUpperCase(),
                  style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w700, color: const Color(0xFF1E293B), height: 1.5),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInteractionsTab() {
    final List<Map<String, dynamic>> items = [
      {'icon': Icons.science_rounded, 'title': 'COMPOSITION', 'text': widget.product.saltComposition ?? 'CONSULT DOCTOR', 'color': const Color(0xFFF3F4F6)},
      {'icon': Icons.child_care_rounded, 'title': 'PREGNANCY', 'text': widget.product.pregnancyInteraction ?? 'CONSULT DOCTOR', 'color': const Color(0xFFFFF1F2)},
      {'icon': Icons.water_drop_rounded, 'title': 'LACTATION', 'text': widget.product.lactationInteraction ?? 'CONSULT DOCTOR', 'color': const Color(0xFFF0F9FF)},
      {'icon': Icons.directions_car_rounded, 'title': 'DRIVING', 'text': widget.product.drivingInteraction ?? 'CONSULT DOCTOR', 'color': const Color(0xFFECFDF5)},
      {'icon': Icons.inventory_2_rounded, 'title': 'RENAL', 'text': widget.product.kidneyInteraction ?? 'CONSULT DOCTOR', 'color': const Color(0xFFF5F3FF)},
      {'icon': Icons.shield_rounded, 'title': 'HEPATIC', 'text': widget.product.liverInteraction ?? 'CONSULT DOCTOR', 'color': const Color(0xFFF8FAFC)},
    ];

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          childAspectRatio: 1.2,
        ),
        itemCount: items.length,
        itemBuilder: (ctx, i) {
          final item = items[i];
          return Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: item['color'],
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: Colors.white, width: 1.5),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(10), boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 5)]),
                  child: Icon(item['icon'], size: 16, color: SahimedColors.primary),
                ),
                const Spacer(),
                Text(item['title'], style: GoogleFonts.outfit(fontSize: 8, fontWeight: FontWeight.w900, color: const Color(0xFF64748B), letterSpacing: 1.5)),
                const SizedBox(height: 4),
                Text(
                  item['text'].toString().toUpperCase(),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w800, color: const Color(0xFF0F172A), height: 1.1),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildStickyBottom(BuildContext context, bool hasGeneric) {
    final displayProduct = hasGeneric ? _genericAlt! : widget.product;
    return Positioned(
      bottom: 0,
      left: 0,
      right: 0,
      child: Container(
        padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
          boxShadow: [
            BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 30, offset: const Offset(0, -5)),
          ],
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('TOTAL PAYABLE', style: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.w900, color: const Color(0xFF94A3B8), letterSpacing: 2)),
                  Text('₹${displayProduct.price.round()}', style: GoogleFonts.outfit(fontSize: 28, fontWeight: FontWeight.w900, color: const Color(0xFF0F172A))),
                ],
              ),
            ),
            const SizedBox(width: 20),
            Expanded(
              flex: 2,
              child: Container(
                height: 64,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(colors: [SahimedColors.primary, Color(0xFF2563EB)]),
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [BoxShadow(color: SahimedColors.primary.withOpacity(0.3), blurRadius: 20, offset: const Offset(0, 10))],
                ),
                child: ElevatedButton(
                  onPressed: () {
                    final cart = Provider.of<CartProvider>(context, listen: false);
                    cart.addItem(displayProduct);
                    _showGoToCartNotification(context);
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.transparent,
                    shadowColor: Colors.transparent,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.shopping_bag_rounded, color: Colors.white, size: 20),
                      const SizedBox(width: 12),
                      Text('ADD TO CART', style: GoogleFonts.outfit(fontWeight: FontWeight.w900, fontSize: 16, color: Colors.white, letterSpacing: 1.5)),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showGoToCartNotification(BuildContext context) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.check_circle_rounded, color: Colors.white),
            const SizedBox(width: 12),
            Text('ADDED TO CART', style: GoogleFonts.outfit(fontWeight: FontWeight.w900, letterSpacing: 1)),
            const Spacer(),
            TextButton(
              onPressed: () {
                ScaffoldMessenger.of(context).hideCurrentSnackBar();
                Navigator.pushReplacementNamed(context, '/cart');
              },
              child: Text('GO TO CART', style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.w900, decoration: TextDecoration.underline)),
            ),
          ],
        ),
        backgroundColor: SahimedColors.primary,
        behavior: SnackBarBehavior.floating,
        margin: const EdgeInsets.fromLTRB(20, 0, 20, 110),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        duration: const Duration(seconds: 4),
      ),
    );
  }
}

// ── Comparison Card ───────────────────────────────────────────────────────
class _ComparisonCard extends StatelessWidget {
  final ProductModel product;
  final String label;
  final bool isGenericAlt;
  final int? savingsAmount;

  const _ComparisonCard({
    required this.product,
    required this.label,
    required this.isGenericAlt,
    this.savingsAmount,
  });

  double _getPricePerUnit() {
    final packSizeStr = product.packSize ?? '10';
    final regExp = RegExp(r'(\d+)');
    final match = regExp.firstMatch(packSizeStr);
    if (match != null) {
      final size = double.tryParse(match.group(1)!) ?? 10.0;
      return product.price / size;
    }
    return product.price / 10.0;
  }

  @override
  Widget build(BuildContext context) {
    final isGeneric = product.isGeneric || isGenericAlt;
    final accentColor = isGeneric ? SahimedColors.primary : const Color(0xFF64748B);

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFF1F5F9), width: 1.5),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 10, offset: const Offset(0, 4)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(color: isGeneric ? const Color(0xFFF0F9FF) : const Color(0xFFF8FAFC), borderRadius: BorderRadius.circular(8)),
            child: Text(
              label.toUpperCase(),
              style: GoogleFonts.outfit(fontSize: 7, fontWeight: FontWeight.w900, color: accentColor, letterSpacing: 1),
            ),
          ),
          const SizedBox(height: 12),
          Container(
            height: 100,
            width: double.infinity,
            decoration: BoxDecoration(
              color: isGeneric ? const Color(0xFFF1FDF9) : const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Center(
              child: CachedNetworkImage(
                imageUrl: product.imageUrl,
                width: 60,
                height: 60,
                fit: BoxFit.contain,
                placeholder: (c, u) => const Center(child: CircularProgressIndicator(strokeWidth: 1)),
                errorWidget: (c, u, e) => Icon(Icons.medication_rounded, color: accentColor, size: 30),
              ),
            ),
          ),
          const SizedBox(height: 12),
          Text(
            product.name.toUpperCase(),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: GoogleFonts.outfit(fontSize: 11, fontWeight: FontWeight.w900, color: const Color(0xFF1E293B), height: 1.2),
          ),
          const SizedBox(height: 4),
          GestureDetector(
            onTap: () {
              final company = product.company ?? product.brand;
              if (company.isNotEmpty) {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => BrandStoreScreen(brandName: company),
                  ),
                );
              }
            },
            child: Text(
              ((product.company ?? product.brand).isNotEmpty ? (product.company ?? product.brand) : 'SAHIMED').toUpperCase(),
              style: GoogleFonts.inter(
                fontSize: 7, 
                color: SahimedColors.accent, 
                fontWeight: FontWeight.w900,
                decoration: TextDecoration.underline,
                decorationColor: SahimedColors.accent.withValues(alpha: 0.3),
              ),
            ),
          ),
          const Spacer(),
          const SizedBox(height: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
               Text(
                '₹${_getPricePerUnit().toStringAsFixed(2)} PER UNIT',
                style: GoogleFonts.inter(fontSize: 7, fontWeight: FontWeight.w800, color: SahimedColors.slate500),
              ),
              const SizedBox(height: 4),
              Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Text(
                    '₹${product.price.round()}',
                    style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w900, color: isGeneric ? SahimedColors.primary : const Color(0xFF0F172A)),
                  ),
                  const SizedBox(width: 8),
                  if (product.mrp > product.price)
                    Text(
                      '₹${product.mrp.round()}',
                      style: GoogleFonts.inter(fontSize: 10, color: const Color(0xFFCBD5E1), decoration: TextDecoration.lineThrough, fontWeight: FontWeight.w700),
                    ),
                ],
              ),
            ],
          ),
          if (savingsAmount != null && savingsAmount! > 0) ...[
            const SizedBox(height: 8),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [Color(0xFF25D366), Color(0xFF059669)]),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Row(
                children: [
                   const Icon(LucideIcons.sparkles, color: Colors.white, size: 10),
                   const SizedBox(width: 6),
                   Text(
                    'SAVE ₹$savingsAmount',
                    style: GoogleFonts.outfit(fontSize: 9, fontWeight: FontWeight.w900, color: Colors.white),
                   ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}

// ── Full-Screen Viewer (Simplified for concise view) ─────────────────────────
class _FullScreenImageViewer extends StatelessWidget {
  final String imageUrl;
  final ProductModel product;
  const _FullScreenImageViewer({required this.imageUrl, required this.product});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(backgroundColor: Colors.transparent, elevation: 0, leading: IconButton(icon: const Icon(Icons.close, color: Colors.white), onPressed: () => Navigator.pop(context))),
      body: Center(
        child: InteractiveViewer(
          child: CachedNetworkImage(imageUrl: imageUrl, fit: BoxFit.contain),
        ),
      ),
    );
  }
}
