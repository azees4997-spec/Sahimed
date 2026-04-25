import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/colors.dart';
import '../../../core/services/api_service.dart';
import '../../../core/providers/cart_provider.dart';
import '../../../shared/models/models.dart';
import '../../../core/widgets/screen_with_nav.dart';

// ─── Colors matching the website's Tailwind tokens ──────────────────────────
// primary  = SahimedColors.primary  (green)
// accent   = SahimedColors.accent   (pink)
// lavender = const Color(0xFFEDE9FE)
// sahi-blue = const Color(0xFFEFF6FF)
// sahi-pink = const Color(0xFFFFF1F2)
// sahi-green = const Color(0xFFECFDF5)
// slate-50 = const Color(0xFFF8FAFC)
// slate-100 = const Color(0xFFF1F5F9)

class ProductDetailScreen extends StatefulWidget {
  final ProductModel product;
  const ProductDetailScreen({super.key, required this.product});

  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen>
    with SingleTickerProviderStateMixin {
  final ApiService _apiService = ApiService();
  ProductModel? _genericAlt;
  bool _isLoading = true;
  late final TabController _tabController;

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
    if (widget.product.moleculeId == null) {
      if (mounted) setState(() => _isLoading = false);
      return;
    }
    try {
      final generic = await _apiService.getGenericAlternative(
        widget.product.moleculeId!,
      );
      if (mounted) {
        setState(() {
          // Only set as alt if it is a different product
          if (generic != null && generic.id != widget.product.id) {
            _genericAlt = generic;
          }
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Error fetching alternatives: $e');
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = widget.product;
    final isGeneric = p.isGeneric;
    final isBranded = !isGeneric;
    final hasGenericAlt = isBranded && _genericAlt != null;
    final showComparison = hasGenericAlt;

    final brandedPrice = p.price;
    final brandedMrp = p.mrp > 0 ? p.mrp : brandedPrice + 20;
    final genericPrice = _genericAlt?.price ?? 0.0;
    final switchSavingsAmt = showComparison
        ? (brandedMrp - genericPrice).clamp(0, double.infinity)
        : 0.0;
    final isRx = p.rxRequired || p.prescriptionRequired;

    // Salt composition label (same as website: molData?.molecule || saltComposition || ...)
    final saltLabel =
        p.molName ?? p.saltComposition ?? 'Information coming soon';

    return ScreenWithNav(
      child: Scaffold(
        backgroundColor: const Color(0xFFF8FAFC),
        appBar: AppBar(
          backgroundColor: const Color(0xFFF8FAFC),
          elevation: 0,
          surfaceTintColor: Colors.transparent,
          leading: IconButton(
            icon: const Icon(LucideIcons.arrowLeft, color: Color(0xFF0F172A)),
            onPressed: () => Navigator.pop(context),
          ),
        ),
        body: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(8, 0, 8, 200),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // ── 1. RX Badge (centered, if needed) ──────────────────────────
              if (isRx)
                Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Center(
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFFEF4444),
                        borderRadius: BorderRadius.circular(100),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFFEF4444).withOpacity(0.2),
                            blurRadius: 12,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Text(
                        'RX REQUIRED',
                        style: GoogleFonts.outfit(
                          fontSize: 8,
                          fontWeight: FontWeight.w900,
                          color: Colors.white,
                          letterSpacing: 2,
                        ),
                      ),
                    ),
                  ),
                ),

              // ── 2. Salt Composition centered (exactly as website) ──────────
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                child: Column(
                  children: [
                    Text(
                      'Salt Composition',
                      style: GoogleFonts.outfit(
                        fontSize: 9,
                        fontWeight: FontWeight.w900,
                        color: const Color(0xFF94A3B8),
                        letterSpacing: 2,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      saltLabel.toUpperCase(),
                      textAlign: TextAlign.center,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.outfit(
                        fontSize: 14,
                        fontWeight: FontWeight.w900,
                        color: const Color(0xFF0F172A),
                        letterSpacing: -0.5,
                        height: 1.2,
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 8),

              // ── 3. Switch-and-save banner (only when savings > 0) ──────────
              if (showComparison && switchSavingsAmt > 0) ...[
                Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 4,
                    vertical: 4,
                  ),
                  child: Container(
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [SahimedColors.primary, SahimedColors.accent],
                        begin: Alignment.centerLeft,
                        end: Alignment.centerRight,
                      ),
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(
                          color: SahimedColors.primary.withOpacity(0.25),
                          blurRadius: 12,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    padding: const EdgeInsets.symmetric(
                      vertical: 10,
                      horizontal: 16,
                    ),
                    child: Center(
                      child: Text(
                        'SAHI RECOMMENDED CHOICE: SAVE ₹${switchSavingsAmt.toStringAsFixed(0)}',
                        textAlign: TextAlign.center,
                        style: GoogleFonts.outfit(
                          fontSize: 11,
                          fontWeight: FontWeight.w900,
                          color: Colors.white,
                          letterSpacing: 1,
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 8),
              ],

              // ── 4. Comparison Cards (2 cols) OR single card ────────────────
              if (_isLoading)
                const Padding(
                  padding: EdgeInsets.all(40),
                  child: Center(
                    child: CircularProgressIndicator(
                      color: SahimedColors.primary,
                    ),
                  ),
                )
              else if (showComparison)
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: _ComparisonCard(
                        product: widget.product,
                        label: 'Branded Version',
                        isAlt: false,
                        brandedMrp: brandedMrp,
                        showComparison: true,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: _ComparisonCard(
                        product: _genericAlt!,
                        label: 'Sahi Recommended',
                        isAlt: true,
                        brandedMrp: brandedMrp,
                        showComparison: true,
                      ),
                    ),
                  ],
                )
              else
                Center(
                  child: SizedBox(
                    width: double.infinity,
                    child: _ComparisonCard(
                      product: widget.product,
                      label: isBranded ? 'Branded Quality' : 'Sahi Recommended',
                      isAlt: false,
                      brandedMrp: brandedMrp,
                      showComparison: false,
                    ),
                  ),
                ),

              const SizedBox(height: 16),

              // ── 5. Clinical Tabs (Information / Safety Advice / Interactions)
              _ClinicalTabs(
                product: widget.product,
                tabController: _tabController,
              ),
            ],
          ),
        ),
      ), // Scaffold
    ); // ScreenWithNav
  }
}

// ─── Comparison Card ─────────────────────────────────────────────────────────
// Exact match to website ComparisonCard component
class _ComparisonCard extends StatelessWidget {
  final ProductModel product;
  final String label;
  final bool isAlt;
  final double brandedMrp;
  final bool showComparison;

  const _ComparisonCard({
    required this.product,
    required this.label,
    required this.isAlt,
    required this.brandedMrp,
    required this.showComparison,
  });

  double get _price => product.price;
  double get _mrp => product.mrp > 0 ? product.mrp : product.price + 20;

  int get _displaySavingsPct {
    double savingsAmt;
    double base;
    if (isAlt && showComparison) {
      savingsAmt = (brandedMrp - _price).clamp(0, double.infinity);
      base = brandedMrp;
    } else {
      savingsAmt = (_mrp - _price).clamp(0, double.infinity);
      base = _mrp;
    }
    return base > 0 ? ((savingsAmt / base) * 100).round() : 0;
  }

  double get _unitPrice {
    final sizeStr = product.packSize ?? '10';
    final match = RegExp(r'(\d+)').firstMatch(sizeStr);
    final count = match != null ? double.tryParse(match.group(1)!) ?? 1.0 : 1.0;
    return count > 0 ? _price / count : _price;
  }

  @override
  Widget build(BuildContext context) {
    final cart = context.watch<CartProvider>();
    final inCart = cart.items.any((i) => i.product.id == product.id);
    final displayQty = inCart
        ? cart.items.firstWhere((i) => i.product.id == product.id).quantity
        : 0;

    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: isAlt ? SahimedColors.accent.withOpacity(0.03) : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isAlt
              ? SahimedColors.accent.withOpacity(0.2)
              : const Color(0xFFF1F5F9),
          width: isAlt ? 2 : 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Label row + savings badge
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Flexible(
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 3,
                  ),
                  decoration: BoxDecoration(
                    color: isAlt
                        ? SahimedColors.accent
                        : const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(100),
                  ),
                  child: Text(
                    label.toUpperCase(),
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.outfit(
                      fontSize: 7,
                      fontWeight: FontWeight.w900,
                      color: isAlt ? Colors.white : const Color(0xFF94A3B8),
                      letterSpacing: 1,
                    ),
                  ),
                ),
              ),
              if (_displaySavingsPct > 0)
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 6,
                    vertical: 2,
                  ),
                  decoration: BoxDecoration(
                    color: SahimedColors.primary,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    '-$_displaySavingsPct%',
                    style: GoogleFonts.outfit(
                      fontSize: 7,
                      fontWeight: FontWeight.w900,
                      color: Colors.white,
                    ),
                  ),
                ),
            ],
          ),

          const SizedBox(height: 8),

          // Product image (tappable to fullscreen)
          GestureDetector(
            onTap: () => _showFullImage(context),
            child: Container(
              height: 90,
              width: double.infinity,
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFF1F5F9)),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: Hero(
                  tag: 'prod_${product.id}',
                  child: CachedNetworkImage(
                    imageUrl: product.imageUrl,
                    fit: BoxFit.contain,
                    errorWidget: (c, u, e) => const Icon(
                      LucideIcons.pill,
                      color: SahimedColors.primary,
                      size: 28,
                    ),
                  ),
                ),
              ),
            ),
          ),

          const SizedBox(height: 8),

          // Product Name
          Text(
            product.name.toUpperCase(),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: GoogleFonts.outfit(
              fontSize: 10,
              fontWeight: FontWeight.w900,
              color: const Color(0xFF1E293B),
              height: 1.2,
            ),
          ),

          // Pack size
          Text(
            product.packSize ?? 'N/A',
            style: GoogleFonts.outfit(
              fontSize: 7,
              fontWeight: FontWeight.w900,
              color: const Color(0xFF64748B),
              letterSpacing: 1,
            ),
          ),

          // Manufacturer
          Text(
            (product.company ?? product.brand).toUpperCase(),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: GoogleFonts.outfit(
              fontSize: 7,
              fontWeight: FontWeight.bold,
              color: const Color(0xFF94A3B8),
            ),
          ),

          const SizedBox(height: 8),
          const Divider(height: 1, color: Color(0xFFF1F5F9)),
          const SizedBox(height: 8),

          // Price block
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '₹${_price.toStringAsFixed(0)}',
                style: GoogleFonts.outfit(
                  fontSize: 20,
                  fontWeight: FontWeight.w900,
                  color: SahimedColors.primary,
                  height: 1,
                ),
              ),
              const SizedBox(width: 6),
              if (_mrp > _price)
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '₹${_mrp.toStringAsFixed(0)}',
                      style: GoogleFonts.outfit(
                        fontSize: 9,
                        fontWeight: FontWeight.bold,
                        color: const Color(0xFF94A3B8),
                        decoration: TextDecoration.lineThrough,
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 4,
                        vertical: 1,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFFECFDF5),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        'SAVE ₹${(_mrp - _price).toStringAsFixed(0)}',
                        style: GoogleFonts.outfit(
                          fontSize: 7,
                          fontWeight: FontWeight.w900,
                          color: const Color(0xFF059669),
                        ),
                      ),
                    ),
                  ],
                ),
            ],
          ),

          Text(
            '₹${_unitPrice.toStringAsFixed(2)} / unit',
            style: GoogleFonts.outfit(
              fontSize: 8,
              fontWeight: FontWeight.bold,
              color: const Color(0xFF94A3B8),
            ),
          ),

          const SizedBox(height: 10),

          // ADD / IN CART button (matches website button exactly)
          GestureDetector(
            onTap: () {
              context.read<CartProvider>().addItem(product);
            },
            child: Container(
              width: double.infinity,
              height: 34,
              decoration: BoxDecoration(
                color: isAlt ? SahimedColors.accent : SahimedColors.primary,
                borderRadius: BorderRadius.circular(100),
                boxShadow: [
                  BoxShadow(
                    color:
                        (isAlt ? SahimedColors.accent : SahimedColors.primary)
                            .withOpacity(0.3),
                    blurRadius: 8,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    displayQty > 0 ? 'IN CART ($displayQty)' : 'ADD',
                    style: GoogleFonts.outfit(
                      fontSize: 9,
                      fontWeight: FontWeight.w900,
                      color: Colors.white,
                      letterSpacing: 1,
                    ),
                  ),
                  const SizedBox(width: 6),
                  const Icon(
                    LucideIcons.shoppingCart,
                    size: 12,
                    color: Colors.white,
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _showFullImage(BuildContext context) {
    showDialog(
      context: context,
      builder: (_) => Dialog(
        backgroundColor: Colors.transparent,
        child: Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(32),
          ),
          padding: const EdgeInsets.all(24),
          child: CachedNetworkImage(
            imageUrl: product.imageUrl,
            fit: BoxFit.contain,
            errorWidget: (c, u, e) => const Icon(
              LucideIcons.pill,
              color: SahimedColors.primary,
              size: 80,
            ),
          ),
        ),
      ),
    );
  }
}

// ─── Clinical Tabs ────────────────────────────────────────────────────────────
// Exact match to website: Information / Safety Advice / Interactions
class _ClinicalTabs extends StatelessWidget {
  final ProductModel product;
  final TabController tabController;

  const _ClinicalTabs({required this.product, required this.tabController});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFF1F5F9)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          // Tab bar — rounded pill style matching website
          Padding(
            padding: const EdgeInsets.all(12),
            child: Container(
              height: 40,
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(100),
                border: Border.all(color: const Color(0xFFF1F5F9)),
              ),
              child: TabBar(
                controller: tabController,
                indicator: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(100),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.08),
                      blurRadius: 8,
                    ),
                  ],
                ),
                indicatorSize: TabBarIndicatorSize.tab,
                dividerColor: Colors.transparent,
                labelColor: SahimedColors.primary,
                unselectedLabelColor: const Color(0xFF94A3B8),
                labelStyle: GoogleFonts.outfit(
                  fontSize: 8,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 1,
                ),
                unselectedLabelStyle: GoogleFonts.outfit(
                  fontSize: 8,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 1,
                ),
                tabs: const [
                  Tab(text: 'INFORMATION'),
                  Tab(text: 'SAFETY'),
                  Tab(text: 'INTERACTIONS'),
                ],
              ),
            ),
          ),

          // Tab contents
          SizedBox(
            height: 320,
            child: TabBarView(
              controller: tabController,
              children: [
                // ── Tab 1: Information (Medical Uses + Product Info) ──────
                Padding(
                  padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: _InfoTile(
                          icon: LucideIcons.clipboardList,
                          title: 'Medical Uses',
                          text: product.treatment ?? 'Standard medical use.',
                          bgColor: const Color(0xFFEDE9FE),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: _InfoTile(
                          icon: LucideIcons.info,
                          title: 'Product Info',
                          text: product.description ?? 'Medicine details.',
                          bgColor: const Color(0xFFEFF6FF),
                        ),
                      ),
                    ],
                  ),
                ),

                // ── Tab 2: Safety Advice ───────────────────────────────────
                Padding(
                  padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: _SafetyTile(
                          icon: LucideIcons.triangleAlert,
                          title: 'Safety Advice',
                          text:
                              product.safetyAdvice ??
                              'Follow medical guidance.',
                          iconColor: const Color(0xFFEF4444),
                          bgColor: const Color(0xFFFFF1F2),
                          textColor: const Color(0xFF9F1239),
                          titleColor: const Color(0xFFDC2626),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: _SafetyTile(
                          icon: LucideIcons.stethoscope,
                          title: 'How to Use',
                          text:
                              product.howToUse ??
                              'Take as directed by your doctor.',
                          iconColor: SahimedColors.primary,
                          bgColor: const Color(0xFFEFF6FF),
                          textColor: const Color(0xFF334155),
                          titleColor: SahimedColors.primary,
                        ),
                      ),
                    ],
                  ),
                ),

                // ── Tab 3: Interactions (6 grid items) ───────────────────
                Padding(
                  padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
                  child: GridView.count(
                    physics: const NeverScrollableScrollPhysics(),
                    crossAxisCount: 2,
                    mainAxisSpacing: 8,
                    crossAxisSpacing: 8,
                    childAspectRatio: 1.8,
                    children: [
                      _InteractionTile(
                        icon: LucideIcons.flaskConical,
                        title: 'Composition',
                        text: product.saltComposition,
                        bgColor: const Color(0xFFEDE9FE),
                      ),
                      _InteractionTile(
                        icon: LucideIcons.baby,
                        title: 'Pregnancy',
                        text: product.pregnancyInteraction,
                        bgColor: const Color(0xFFFFF1F2),
                      ),
                      _InteractionTile(
                        icon: LucideIcons.milk,
                        title: 'Lactation',
                        text: product.lactationInteraction,
                        bgColor: const Color(0xFFEFF6FF),
                      ),
                      _InteractionTile(
                        icon: LucideIcons.car,
                        title: 'Driving',
                        text: product.drivingInteraction,
                        bgColor: const Color(0xFFECFDF5),
                      ),
                      _InteractionTile(
                        icon: LucideIcons.package,
                        title: 'Renal',
                        text: product.kidneyInteraction,
                        bgColor: const Color(0xFFEDE9FE),
                      ),
                      _InteractionTile(
                        icon: LucideIcons.shieldAlert,
                        title: 'Hepatic',
                        text: product.liverInteraction,
                        bgColor: const Color(0xFFF8FAFC),
                      ),
                    ],
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

// ── Reusable tile widgets ─────────────────────────────────────────────────────

class _InfoTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String text;
  final Color bgColor;

  const _InfoTile({
    required this.icon,
    required this.title,
    required this.text,
    required this.bgColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white, width: 1.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 14, color: SahimedColors.primary),
              const SizedBox(width: 6),
              Flexible(
                child: Text(
                  title.toUpperCase(),
                  style: GoogleFonts.outfit(
                    fontSize: 9,
                    fontWeight: FontWeight.w900,
                    color: const Color(0xFF1E293B),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            text.toUpperCase(),
            maxLines: 10,
            overflow: TextOverflow.ellipsis,
            style: GoogleFonts.outfit(
              fontSize: 9,
              fontWeight: FontWeight.w900,
              color: const Color(0xFF64748B),
              height: 1.4,
            ),
          ),
        ],
      ),
    );
  }
}

class _SafetyTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String text;
  final Color iconColor;
  final Color bgColor;
  final Color textColor;
  final Color titleColor;

  const _SafetyTile({
    required this.icon,
    required this.title,
    required this.text,
    required this.iconColor,
    required this.bgColor,
    required this.textColor,
    required this.titleColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white, width: 1.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 6),
              ],
            ),
            child: Icon(icon, size: 16, color: iconColor),
          ),
          const SizedBox(height: 8),
          Text(
            title.toUpperCase(),
            style: GoogleFonts.outfit(
              fontSize: 8,
              fontWeight: FontWeight.w900,
              color: titleColor,
              letterSpacing: 1,
            ),
          ),
          const SizedBox(height: 4),
          Expanded(
            child: Text(
              text.toUpperCase(),
              maxLines: 6,
              overflow: TextOverflow.ellipsis,
              style: GoogleFonts.outfit(
                fontSize: 9,
                fontWeight: FontWeight.w900,
                color: textColor.withOpacity(0.6),
                height: 1.4,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _InteractionTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? text;
  final Color bgColor;

  const _InteractionTile({
    required this.icon,
    required this.title,
    required this.text,
    required this.bgColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white, width: 1.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 28,
            height: 28,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: const Color(0xFFF1F5F9)),
            ),
            child: Icon(icon, size: 13, color: SahimedColors.primary),
          ),
          const SizedBox(height: 6),
          Text(
            title.toUpperCase(),
            style: GoogleFonts.outfit(
              fontSize: 7,
              fontWeight: FontWeight.w900,
              color: const Color(0xFF94A3B8),
              letterSpacing: 1,
            ),
          ),
          const SizedBox(height: 2),
          Expanded(
            child: Text(
              (text ?? 'CONSULT DOCTOR').toUpperCase(),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: GoogleFonts.outfit(
                fontSize: 9,
                fontWeight: FontWeight.w900,
                color: const Color(0xFF1E293B),
                height: 1.3,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
