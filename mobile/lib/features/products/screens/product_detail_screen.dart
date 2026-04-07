import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../core/theme/colors.dart';
import '../../../core/services/api_service.dart';
import '../../../shared/models/models.dart';

class ProductDetailScreen extends StatefulWidget {
  final ProductModel product;
  const ProductDetailScreen({super.key, required this.product});

  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen> with SingleTickerProviderStateMixin {
  final ApiService _apiService = ApiService();
  ProductModel? _genericAlt;
  bool _isLoading = true;
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _fetchGenericAlternative();
  }

  @override
  void dispose() {
    _tabController.dispose();
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

  @override
  Widget build(BuildContext context) {
    final hasGeneric = _genericAlt != null;
    final switchSavings = hasGeneric
        ? (widget.product.mrp - _genericAlt!.price).round()
        : 0;

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
              style: GoogleFonts.outfit(fontSize: 9, fontWeight: FontWeight.w900, color: SahimedColors.slate400, letterSpacing: 2),
            ),
            const SizedBox(height: 2),
            Text(
              (widget.product.saltComposition ?? 'FORMULA INFO').toUpperCase(),
              style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.w900, color: SahimedColors.slate950, letterSpacing: -0.5),
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
      body: SingleChildScrollView(
        child: Column(
          children: [
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
                        SahimedColors.primary.withValues(alpha: 0.8),
                        SahimedColors.accent.withValues(alpha: 0.8),
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
                      const Icon(Icons.auto_awesome_rounded, color: Colors.white, size: 16),
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

            // Comparison Cards
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: _isLoading
                  ? const Center(child: CircularProgressIndicator(color: SahimedColors.primary))
                  : Column(
                      children: [
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(
                              child: _ComparisonCard(
                                product: widget.product,
                                label: 'BRANDED',
                                isGenericAlt: false,
                              ),
                            ),
                            if (hasGeneric) ...[
                              const SizedBox(width: 12),
                              Expanded(
                                child: _ComparisonCard(
                                  product: _genericAlt!,
                                  label: 'SH-GENERIC',
                                  isGenericAlt: true,
                                ),
                              ),
                            ],
                          ],
                        ),
                        if (!hasGeneric && !widget.product.isGeneric)
                          const SizedBox.shrink(), // No comparison available
                      ],
                    ),
            ),

            // Info Tabs
            const SizedBox(height: 8),
            _InfoSection(product: widget.product),
            const SizedBox(height: 100),
          ],
        ),
      ),
    );
  }
}

class _ComparisonCard extends StatelessWidget {
  final ProductModel product;
  final String label;
  final bool isGenericAlt;

  const _ComparisonCard({
    required this.product,
    required this.label,
    required this.isGenericAlt,
  });

  @override
  Widget build(BuildContext context) {
    final isGeneric = product.isGeneric || isGenericAlt;
    final cardBg = isGeneric ? SahimedColors.sahiPink : SahimedColors.sahiBlue;
    final accentColor = isGeneric ? SahimedColors.accent : SahimedColors.primary;

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: accentColor.withValues(alpha: 0.15),
          width: isGeneric ? 1.5 : 1,
        ),
        boxShadow: [
          BoxShadow(
            color: accentColor.withValues(alpha: 0.05),
            blurRadius: 12,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: accentColor,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              label,
              style: GoogleFonts.outfit(
                fontSize: 8,
                fontWeight: FontWeight.w900,
                color: Colors.white,
                letterSpacing: 1,
              ),
            ),
          ),
          const SizedBox(height: 12),
          AspectRatio(
            aspectRatio: 1,
            child: Container(
              decoration: BoxDecoration(
                color: SahimedColors.white.withValues(alpha: 0.6),
                borderRadius: BorderRadius.circular(16),
              ),
              padding: const EdgeInsets.all(12),
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
            style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.w900, color: SahimedColors.slate950),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 4),
          if (product.brand.isNotEmpty)
            Text(product.brand, style: GoogleFonts.outfit(fontSize: 10, color: SahimedColors.slate400)),
          const SizedBox(height: 12),
          Text(
            '₹${product.price.round()}',
            style: GoogleFonts.outfit(
              fontSize: 24,
              fontWeight: FontWeight.w900,
              color: SahimedColors.slate950,
              letterSpacing: -1,
            ),
          ),
          Text(
            'M.R.P. ₹${product.mrp.round()}',
            style: GoogleFonts.outfit(
              fontSize: 10,
              fontWeight: FontWeight.bold,
              color: SahimedColors.slate400,
              decoration: TextDecoration.lineThrough,
            ),
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: () {},
            style: ElevatedButton.styleFrom(
              backgroundColor: accentColor,
              minimumSize: const Size(double.infinity, 40),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              elevation: 0,
              shadowColor: accentColor.withValues(alpha: 0.3),
            ),
            child: Text(
              'ADD TO CART',
              style: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 0.5, color: Colors.white),
            ),
          ),
        ],
      ),
    );
  }
}

class _InfoSection extends StatelessWidget {
  final ProductModel product;
  const _InfoSection({required this.product});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: SahimedColors.white,
        borderRadius: BorderRadius.circular(40),
        border: Border.all(color: SahimedColors.slate100),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.info_outline_rounded, color: SahimedColors.primary, size: 20),
              const SizedBox(width: 12),
              Text('CLINICAL INFORMATION', style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.w900, color: SahimedColors.slate950, letterSpacing: -0.5)),
            ],
          ),
          const SizedBox(height: 20),
          _InfoTile(
            color: SahimedColors.lavender,
            icon: Icons.assignment_outlined,
            title: 'MEDICAL USES',
            body: 'This medication is commonly used for clinical conditions. Always consult your physician before use.',
          ),
          const SizedBox(height: 12),
          _InfoTile(
            color: SahimedColors.sahiBlue,
            icon: Icons.info_outlined,
            title: 'PRODUCT INFO',
            body: 'Contains ${product.saltComposition ?? "active pharmaceutical ingredients"}. Store in a cool, dry place away from direct sunlight.',
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              const Icon(Icons.warning_amber_rounded, color: SahimedColors.accent, size: 20),
              const SizedBox(width: 12),
              Text('SAFETY ADVICE', style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.w900, color: SahimedColors.slate950, letterSpacing: -0.5)),
            ],
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(color: SahimedColors.sahiPink, borderRadius: BorderRadius.circular(28)),
            child: Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14)),
                  child: const Icon(Icons.warning_rounded, color: SahimedColors.accent, size: 22),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Text(
                    'Always consult your doctor before taking any medication. Do not exceed the recommended dose.',
                    style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold, color: SahimedColors.accent, height: 1.4),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(color: SahimedColors.sahiBlue, borderRadius: BorderRadius.circular(28)),
            child: Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14)),
                  child: const Icon(Icons.local_hospital_outlined, color: SahimedColors.primary, size: 22),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Text(
                    'Take as directed by your doctor or pharmacist. Keep all medicines out of the reach of children.',
                    style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold, color: SahimedColors.primary, height: 1.4),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _InfoTile extends StatelessWidget {
  final Color color;
  final IconData icon;
  final String title;
  final String body;

  const _InfoTile({
    required this.color,
    required this.icon,
    required this.title,
    required this.body,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(24)),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: SahimedColors.primary, size: 20),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: GoogleFonts.outfit(fontSize: 11, fontWeight: FontWeight.w900, color: SahimedColors.primary, letterSpacing: 1)),
                const SizedBox(height: 6),
                Text(body, style: GoogleFonts.inter(fontSize: 12, color: SahimedColors.slate500, height: 1.5)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
