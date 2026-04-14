import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/colors.dart';
import '../../../core/services/api_service.dart';
import '../../../core/providers/cart_provider.dart';
import '../../../shared/models/models.dart';

class ProductDetailScreen extends StatefulWidget {
  final ProductModel product;
  const ProductDetailScreen({super.key, required this.product});

  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen> {
  final ApiService _apiService = ApiService();
  ProductModel? _genericAlt;
  bool _isLoading = true;
  int _currentImageIndex = 0;
  late final PageController _pageController;

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
    _fetchGenericAlternative();
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  Future<void> _fetchGenericAlternative() async {
    if (widget.product.moleculeId == null || widget.product.isGeneric) {
      if (mounted) setState(() => _isLoading = false);
      return;
    }

    try {
      final generic = await _apiService.getGenericAlternative(widget.product.moleculeId!);
      if (mounted) {
        setState(() {
          _genericAlt = generic;
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Error fetching generic alternative: $e');
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
    final hasGeneric = _genericAlt != null;
    final switchSavings = hasGeneric
        ? (widget.product.mrp - _genericAlt!.price).round()
        : 0;
    final isRx = widget.product.rxRequired || widget.product.prescriptionRequired;
    final images = _allImages;

    return Scaffold(
      backgroundColor: SahimedColors.background,
      appBar: AppBar(
        backgroundColor: SahimedColors.white,
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
              style: GoogleFonts.outfit(fontSize: 8, fontWeight: FontWeight.w900, color: SahimedColors.slate400, letterSpacing: 1),
            ),
            const SizedBox(height: 2),
            Text(
              (widget.product.molName ?? widget.product.saltComposition ?? 'FORMULA INFO').toUpperCase(),
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
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
                    color: const Color(0xFFFFF7ED),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.description_rounded, color: Color(0xFFC2410C), size: 14),
                        const SizedBox(width: 8),
                        Text(
                          'PRESCRIPTION REQUIRED FOR THIS MEDICINE',
                          style: GoogleFonts.outfit(fontSize: 9, fontWeight: FontWeight.w900, color: const Color(0xFFC2410C), letterSpacing: 0.5),
                        ),
                      ],
                    ),
                  ),

                const SizedBox(height: 16),

                // ── Image Carousel ──────────────────────────────────────
                SizedBox(
                  height: 220,
                  child: Stack(
                    children: [
                      PageView.builder(
                        controller: _pageController,
                        itemCount: images.length,
                        onPageChanged: (i) => setState(() => _currentImageIndex = i),
                        itemBuilder: (ctx, i) {
                          return GestureDetector(
                            onTap: () => _showFullScreen(ctx, images[i]),
                            child: Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 16),
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(24),
                                child: CachedNetworkImage(
                                  imageUrl: images[i],
                                  fit: BoxFit.contain,
                                  errorWidget: (c, u, e) => Icon(Icons.medication_rounded, color: SahimedColors.primary, size: 60),
                                ),
                              ),
                            ),
                          );
                        },
                      ),
                      // Page indicator dots
                      if (images.length > 1)
                        Positioned(
                          bottom: 8,
                          left: 0,
                          right: 0,
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: List.generate(images.length, (i) => AnimatedContainer(
                              duration: const Duration(milliseconds: 200),
                              margin: const EdgeInsets.symmetric(horizontal: 3),
                              width: _currentImageIndex == i ? 16 : 6,
                              height: 6,
                              decoration: BoxDecoration(
                                color: _currentImageIndex == i ? SahimedColors.primary : SahimedColors.slate200,
                                borderRadius: BorderRadius.circular(3),
                              ),
                            )),
                          ),
                        ),
                      // Tap-to-expand hint
                      Positioned(
                        top: 8,
                        right: 24,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.black.withValues(alpha: 0.3),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text('TAP TO EXPAND', style: GoogleFonts.outfit(fontSize: 7, color: Colors.white, fontWeight: FontWeight.w900)),
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 16),

                // Switch & Save Banner
                if (hasGeneric && switchSavings > 0)
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            SahimedColors.primary,
                            const Color(0xFF7C3AED),
                            const Color(0xFFDB2777),
                            SahimedColors.accent,
                          ],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [
                          BoxShadow(
                            color: SahimedColors.accent.withValues(alpha: 0.2),
                            blurRadius: 15,
                            offset: const Offset(0, 5),
                          ),
                        ],
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.workspace_premium_rounded, color: Colors.white, size: 16),
                          const SizedBox(width: 10),
                          Text(
                            'SWITCH AND SAVE ₹$switchSavings • SAME FORMULA',
                            style: GoogleFonts.outfit(
                              fontSize: 10,
                              fontWeight: FontWeight.w900,
                              color: Colors.white,
                              letterSpacing: 0.8,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                // ── Comparison Cards ─────────────────────────────────────
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  child: _isLoading
                      ? const Center(child: CircularProgressIndicator(color: SahimedColors.primary))
                      : IntrinsicHeight(
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              Expanded(
                                child: _ComparisonCard(
                                  product: widget.product,
                                  label: 'YOUR CHOICE',
                                  isGenericAlt: false,
                                ),
                              ),
                              if (hasGeneric) ...[
                                const SizedBox(width: 8),
                                Expanded(
                                  child: _ComparisonCard(
                                    product: _genericAlt!,
                                    label: 'SAHI RECOMMEND',
                                    isGenericAlt: true,
                                    savingsAmount: switchSavings,
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                ),

                // Detailed molecule section
                const SizedBox(height: 8),
                _MoleculeDetails(product: widget.product),
                
                // Extra Space for sticky bottom and padding
                const SizedBox(height: 120),
              ],
            ),
          ),
          
          // Sticky Bottom Checkout
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Container(
              padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
                boxShadow: [
                  BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 20, offset: const Offset(0, -5)),
                ],
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'TOTAL PAYABLE',
                          style: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.w900, color: SahimedColors.slate400, letterSpacing: 1),
                        ),
                        Text(
                          '₹${(hasGeneric ? _genericAlt!.price : widget.product.price).round()}',
                          style: GoogleFonts.outfit(fontSize: 24, fontWeight: FontWeight.w900, color: SahimedColors.slate950),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 24),
                  Expanded(
                    flex: 2,
                    child: SizedBox(
                      height: 56,
                      child: ElevatedButton(
                        onPressed: () {
                          final cart = Provider.of<CartProvider>(context, listen: false);
                          cart.addItem(hasGeneric ? _genericAlt! : widget.product);
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('Added to your medicinal cart'),
                              backgroundColor: SahimedColors.primary,
                              behavior: SnackBarBehavior.floating,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            )
                          );
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: SahimedColors.primary,
                          foregroundColor: Colors.white,
                          elevation: 8,
                          shadowColor: SahimedColors.primary.withValues(alpha: 0.3),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        ),
                        child: Text(
                          'ADD TO CART',
                          style: GoogleFonts.outfit(fontWeight: FontWeight.w900, fontSize: 14, letterSpacing: 1.2),
                        ),
                      ),
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
}

// ── Full-Screen Viewer ──────────────────────────────────────────────────────
class _FullScreenImageViewer extends StatelessWidget {
  final String imageUrl;
  final ProductModel product;

  const _FullScreenImageViewer({required this.imageUrl, required this.product});

  @override
  Widget build(BuildContext context) {
    final savings = (product.mrp - product.price).round();
    return Scaffold(
      backgroundColor: Colors.black,
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.close_rounded, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Stack(
        children: [
          // Zoomable image
          Center(
            child: InteractiveViewer(
              minScale: 0.5,
              maxScale: 4.0,
              child: CachedNetworkImage(
                imageUrl: imageUrl,
                fit: BoxFit.contain,
                errorWidget: (c, u, e) => Icon(Icons.medication_rounded, color: Colors.white54, size: 80),
              ),
            ),
          ),

          // Frosted glass data overlay at bottom
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: ClipRRect(
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
                child: Container(
                  padding: const EdgeInsets.fromLTRB(24, 20, 24, 40),
                  color: Colors.white.withValues(alpha: 0.15),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        product.name.toUpperCase(),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: GoogleFonts.outfit(
                          fontSize: product.name.length > 20 ? 14 : 16,
                          fontWeight: FontWeight.w900,
                          color: Colors.white,
                          height: 1.2,
                        ),
                      ),
                      const SizedBox(height: 14),
                      Row(
                        children: [
                          _DataChip(label: 'MRP', value: '₹${product.mrp.round()}', color: Colors.white54),
                          const SizedBox(width: 12),
                          _DataChip(label: 'SAHI PRICE', value: '₹${product.price.round()}', color: Colors.white),
                          const SizedBox(width: 12),
                          if (savings > 0)
                            _DataChip(
                              label: 'SAVINGS',
                              value: '₹$savings',
                              color: const Color(0xFF4ADE80),
                              highlighted: true,
                            ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _DataChip extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  final bool highlighted;

  const _DataChip({
    required this.label,
    required this.value,
    required this.color,
    this.highlighted = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: highlighted ? const Color(0xFF4ADE80).withValues(alpha: 0.2) : Colors.white.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: highlighted ? Border.all(color: const Color(0xFF4ADE80).withValues(alpha: 0.5)) : null,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(label, style: GoogleFonts.outfit(fontSize: 7, fontWeight: FontWeight.w900, color: color.withValues(alpha: 0.7), letterSpacing: 1)),
          const SizedBox(height: 2),
          Text(value, style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.w900, color: color)),
        ],
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

  @override
  Widget build(BuildContext context) {
    final isGeneric = product.isGeneric || isGenericAlt;
    final accentColor = isGeneric ? SahimedColors.accent : SahimedColors.primary;
    final nameStyle = GoogleFonts.outfit(
      fontSize: product.name.length > 20 ? 9 : 11,
      fontWeight: FontWeight.w900,
      color: SahimedColors.slate950,
      height: 1.1,
    );

    return Stack(
      clipBehavior: Clip.none,
      children: [
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(
              color: accentColor.withValues(alpha: 0.1),
              width: 1.5,
            ),
            boxShadow: [
              BoxShadow(
                color: accentColor.withValues(alpha: 0.04),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: accentColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  label,
                  style: GoogleFonts.outfit(
                    fontSize: 8,
                    fontWeight: FontWeight.w900,
                    color: accentColor,
                    letterSpacing: 0.5,
                  ),
                ),
              ),
              const SizedBox(height: 12),
              Center(
                child: AspectRatio(
                  aspectRatio: 1,
                  child: CachedNetworkImage(
                    imageUrl: product.imageUrl,
                    fit: BoxFit.contain,
                    errorWidget: (c, u, e) => Icon(Icons.medication_rounded, color: accentColor, size: 40),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              Text(
                product.name.toUpperCase(),
                style: nameStyle,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 4),
              Text(
                (product.brand.isNotEmpty ? product.brand : 'SAHIMED').toUpperCase(),
                style: GoogleFonts.outfit(fontSize: 8, color: SahimedColors.slate400, fontWeight: FontWeight.bold),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              const Spacer(),
              const SizedBox(height: 12),
              Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    '₹${product.price.round()}',
                    style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w900, color: SahimedColors.slate950),
                  ),
                  if (product.mrp > product.price) ...[
                    const SizedBox(width: 4),
                    Text(
                      '₹${product.mrp.round()}',
                      style: GoogleFonts.outfit(fontSize: 10, color: SahimedColors.slate300, decoration: TextDecoration.lineThrough, fontWeight: FontWeight.bold),
                    ),
                  ],
                ],
              ),
            ],
          ),
        ),

        // Savings ribbon — top-right, only on "Sahi Recommend" card
        if (isGenericAlt && savingsAmount != null && savingsAmount! > 0)
          Positioned(
            top: -6,
            right: -6,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
              decoration: BoxDecoration(
                color: Colors.green.shade500,
                borderRadius: BorderRadius.circular(10),
                boxShadow: [
                  BoxShadow(color: Colors.green.withValues(alpha: 0.35), blurRadius: 8, offset: const Offset(0, 3)),
                ],
              ),
              child: Text(
                'SAVE ₹$savingsAmount',
                style: GoogleFonts.outfit(fontSize: 8, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: 0.3),
              ),
            ),
          ),
      ],
    );
  }
}

// ── Molecule Details ──────────────────────────────────────────────────────
class _MoleculeDetails extends StatelessWidget {
  final ProductModel product;
  const _MoleculeDetails({required this.product});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 12),
            child: Text(
              'CLINICAL DETAILS',
              style: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.w900, color: SahimedColors.slate400, letterSpacing: 2),
            ),
          ),
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(32),
              border: Border.all(color: SahimedColors.slate100),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _DetailRow(
                  icon: Icons.science_rounded,
                  title: 'SALT COMPOSITION',
                  value: (product.molName ?? product.saltComposition ?? 'Pharmaceutical Mix').toUpperCase(),
                ),
                const Divider(height: 32),
                _DetailRow(
                  icon: Icons.factory_rounded,
                  title: 'MANUFACTURER',
                  value: (product.company ?? 'Certified Producer').toUpperCase(),
                ),
                const Divider(height: 32),
                _DetailRow(
                  icon: Icons.inventory_2_rounded,
                  title: 'PACKAGING',
                  value: (product.packSize ?? 'Standard Unit').toUpperCase(),
                ),
                const Divider(height: 32),
                _DetailRow(
                  icon: Icons.info_rounded,
                  title: 'USAGE INFO',
                  value: 'Consult with your clinical practitioner for exact dosage and therapeutic protocols.',
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  final IconData icon;
  final String title;
  final String value;

  const _DetailRow({required this.icon, required this.title, required this.value});

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(color: SahimedColors.primary.withValues(alpha: 0.05), borderRadius: BorderRadius.circular(12)),
          child: Icon(icon, size: 18, color: SahimedColors.primary),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: GoogleFonts.outfit(fontSize: 8, fontWeight: FontWeight.w900, color: SahimedColors.slate400, letterSpacing: 1)),
              const SizedBox(height: 4),
              Text(value, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.bold, color: SahimedColors.slate950, height: 1.4)),
            ],
          ),
        ),
      ],
    );
  }
}
