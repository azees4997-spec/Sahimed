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

  @override
  void initState() {
    super.initState();
    _fetchGenericAlternative();
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
    final isRx = widget.product.rxRequired || widget.product.prescriptionRequired;

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

                // Side-by-Side Comparison
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
                                  label: 'BRANDED',
                                  isGenericAlt: false,
                                ),
                              ),
                              if (hasGeneric) ...[
                                const SizedBox(width: 8),
                                Expanded(
                                  child: _ComparisonCard(
                                    product: _genericAlt!,
                                    label: 'SAHI GENERIC',
                                    isGenericAlt: true,
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
          
          // Sticky Bottom Checkout Interaction
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
    final accentColor = isGeneric ? SahimedColors.accent : SahimedColors.primary;
    final discount = product.mrp > 0 ? (((product.mrp - product.price) / product.mrp) * 100).round() : 0;

    return Container(
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
            style: GoogleFonts.outfit(fontSize: 11, fontWeight: FontWeight.w900, color: SahimedColors.slate950, height: 1.1),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 4),
          Text(
            (product.brand.isNotEmpty ? product.brand : 'SAHIMED').toUpperCase(),
            style: GoogleFonts.outfit(fontSize: 8, color: SahimedColors.slate400, fontWeight: FontWeight.bold),
            maxLines: 1,
            overflow: TextOverflow.ellipsis
          ),
          const Spacer(),
          const SizedBox(height: 12),
          if (discount > 0)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: Colors.green.shade50,
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                'SAVE $discount%',
                style: GoogleFonts.outfit(fontSize: 8, fontWeight: FontWeight.w900, color: Colors.green.shade700),
              ),
            ),
          const SizedBox(height: 4),
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
    );
  }
}

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
