import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../core/theme/colors.dart';
import '../../../core/providers/cart_provider.dart';
import '../../../core/services/api_service.dart';
import '../../../shared/models/models.dart';
import 'checkout_screen.dart';
import '../../../core/providers/navigation_provider.dart';

class CartScreen extends StatefulWidget {
  const CartScreen({super.key});

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  final ApiService _apiService = ApiService();
  List<PromoModel> _promos = [];
  bool _promosLoaded = false;

  Future<void> _loadPromos() async {
    if (_promosLoaded) return;
    try {
      final promos = await _apiService.getPromos();
      if (mounted) {
        setState(() {
          _promos = promos;
          _promosLoaded = true;
        });
      }
    } catch (_) {
      _promosLoaded = true;
    }
  }

  void _showPromoSheet(BuildContext context, CartProvider cart) async {
    await _loadPromos();
    if (!context.mounted) return;
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _PromoSheet(
        promos: _promos,
        cart: cart,
        onApply: (promo) {
          cart.applyPromo(promo);
          Navigator.pop(context);
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                'Coupon ${promo.code} applied!',
                style: GoogleFonts.outfit(fontWeight: FontWeight.w900),
              ),
              backgroundColor: SahimedColors.primary,
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
            ),
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final cart = context.watch<CartProvider>();

    if (cart.items.isEmpty) return _EmptyCart();

    final totalSavings = cart.totalSavings;

    return Container(
      color: const Color(0xFFF8FAFC),
      child: Stack(
        children: [
          // ── scrollable content ──────────────────────────────────────────
          ListView(
            padding: const EdgeInsets.fromLTRB(16, 56, 16, 220),
            children: [
              // Header
              Row(
                children: [
                  Text(
                    'YOUR CART',
                    style: GoogleFonts.outfit(
                      fontSize: 22,
                      fontWeight: FontWeight.w900,
                      color: const Color(0xFF0F172A),
                      letterSpacing: -0.5,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 3,
                    ),
                    decoration: BoxDecoration(
                      color: SahimedColors.primary.withOpacity(0.08),
                      borderRadius: BorderRadius.circular(100),
                      border: Border.all(
                        color: SahimedColors.primary.withOpacity(0.15),
                      ),
                    ),
                    child: Text(
                      '${cart.items.length} ITEMS',
                      style: GoogleFonts.outfit(
                        fontSize: 9,
                        fontWeight: FontWeight.w900,
                        color: SahimedColors.primary,
                        letterSpacing: 1,
                      ),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 16),

              // ── Cart Items ─────────────────────────────────────────────
              ...cart.items.map(
                (item) => _CartItemTile(item: item, cart: cart),
              ),

              const SizedBox(height: 16),

              // ── Loss Avoidance Alert (Sahi Recommended) ─────────────────
              _SahiRecsSection(cart: cart, apiService: _apiService),

              const SizedBox(height: 16),

              // ── Coupon row ────────────────────────────────────────────
              GestureDetector(
                onTap: () => _showPromoSheet(context, cart),
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: cart.appliedPromo != null
                        ? SahimedColors.primary
                        : Colors.white,
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(
                      color: cart.appliedPromo != null
                          ? SahimedColors.primary
                          : const Color(0xFFF1F5F9),
                    ),
                    boxShadow: const [
                      BoxShadow(
                        color: Color(0x0A000000),
                        blurRadius: 12,
                        offset: Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Icon(
                          LucideIcons.ticket,
                          size: 18,
                          color: SahimedColors.primary,
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Text(
                          cart.appliedPromo != null
                              ? 'COUPON: ${cart.appliedPromo!.code}'
                              : 'APPLY COUPON',
                          style: GoogleFonts.outfit(
                            fontSize: 10,
                            fontWeight: FontWeight.w900,
                            color: cart.appliedPromo != null
                                ? Colors.white
                                : const Color(0xFF1E293B),
                            letterSpacing: 1,
                          ),
                        ),
                      ),
                      if (cart.appliedPromo != null)
                        GestureDetector(
                          onTap: () => cart.removePromo(),
                          child: Text(
                            '[REVOKE]',
                            style: GoogleFonts.outfit(
                              fontSize: 8,
                              fontWeight: FontWeight.w900,
                              color: Colors.white,
                              letterSpacing: 1,
                            ),
                          ),
                        )
                      else
                        Icon(
                          LucideIcons.chevronRight,
                          size: 18,
                          color: const Color(0xFF94A3B8),
                        ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 16),

              // ── Order Summary ────────────────────────────────────────
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(28),
                  border: Border.all(color: const Color(0xFFF1F5F9)),
                  boxShadow: const [
                    BoxShadow(
                      color: Color(0x0A000000),
                      blurRadius: 16,
                      offset: Offset(0, 6),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'ORDER SUMMARY',
                      style: GoogleFonts.outfit(
                        fontSize: 9,
                        fontWeight: FontWeight.w900,
                        color: const Color(0xFF94A3B8),
                        letterSpacing: 2,
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Total MRP
                    _SummaryRow(
                      label: 'Total MRP',
                      value: '₹${cart.subtotal.toStringAsFixed(2)}',
                      valueColor: const Color(0xFF64748B),
                    ),

                    // Price Discount
                    if (cart.subtotal > cart.total)
                      _SummaryRow(
                        label: 'Price Discount',
                        value:
                            '-₹${(cart.subtotal - cart.total).toStringAsFixed(2)}',
                        valueColor: SahimedColors.primary,
                      ),

                    // Coupon savings
                    if (cart.appliedPromo != null && cart.promoDiscount > 0)
                      _SummaryRow(
                        label: 'Coupon Savings',
                        value: '-₹${cart.promoDiscount.toStringAsFixed(2)}',
                        valueColor: SahimedColors.primary,
                      ),

                    // Delivery fee
                    _SummaryRow(
                      label: 'Delivery Fee',
                      value: cart.deliveryFee > 0
                          ? '₹${cart.deliveryFee.toStringAsFixed(2)}'
                          : 'FREE',
                      valueColor: cart.deliveryFee > 0
                          ? const Color(0xFF64748B)
                          : const Color(0xFF059669),
                    ),

                    // Packing
                    if (cart.packingFee > 0)
                      _SummaryRow(
                        label: 'Packing Fee',
                        value: '₹${cart.packingFee.toStringAsFixed(2)}',
                        valueColor: const Color(0xFF64748B),
                      ),

                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 12),
                      child: Divider(color: Color(0xFFF1F5F9), height: 1),
                    ),

                    // Net Payable
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          'NET PAYABLE',
                          style: GoogleFonts.outfit(
                            fontSize: 10,
                            fontWeight: FontWeight.w900,
                            color: const Color(0xFF0F172A),
                            letterSpacing: 1,
                          ),
                        ),
                        Text(
                          '₹${cart.finalTotal.toStringAsFixed(2)}',
                          style: GoogleFonts.outfit(
                            fontSize: 28,
                            fontWeight: FontWeight.w900,
                            color: const Color(0xFF0F172A),
                            height: 1,
                            letterSpacing: -1,
                          ),
                        ),
                      ],
                    ),

                    // Total Savings green badge
                    if (totalSavings > 0) ...[
                      const SizedBox(height: 10),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 8,
                        ),
                        decoration: BoxDecoration(
                          color: const Color(0xFFECFDF5),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: const Color(0xFFD1FAE5)),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'TOTAL SAVINGS',
                              style: GoogleFonts.outfit(
                                fontSize: 9,
                                fontWeight: FontWeight.w900,
                                color: const Color(0xFF059669),
                                letterSpacing: 1,
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 2,
                              ),
                              decoration: BoxDecoration(
                                color: const Color(0xFFD1FAE5),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                '₹${totalSavings.toStringAsFixed(2)}',
                                style: GoogleFonts.outfit(
                                  fontSize: 9,
                                  fontWeight: FontWeight.w900,
                                  color: const Color(0xFF059669),
                                  letterSpacing: 1,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),

          // ── Sticky Checkout bar (bottom) — exactly as website ──────────
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Container(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.95),
                borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(36),
                ),
                border: Border.all(
                  color: SahimedColors.primary.withOpacity(0.05),
                ),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x18000000),
                    blurRadius: 40,
                    offset: Offset(0, -12),
                  ),
                ],
              ),
              child: Row(
                children: [
                  // Left: price + savings
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        'NET PAYABLE',
                        style: GoogleFonts.outfit(
                          fontSize: 8,
                          fontWeight: FontWeight.w900,
                          color: const Color(0xFF94A3B8),
                          letterSpacing: 1.5,
                        ),
                      ),
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            '₹${cart.finalTotal.toStringAsFixed(2)}',
                            style: GoogleFonts.outfit(
                              fontSize: 22,
                              fontWeight: FontWeight.w900,
                              color: const Color(0xFF0F172A),
                              height: 1,
                              letterSpacing: -0.5,
                            ),
                          ),
                          const SizedBox(width: 6),
                          Text(
                            '(${cart.items.length})',
                            style: GoogleFonts.outfit(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color: const Color(0xFF94A3B8),
                            ),
                          ),
                        ],
                      ),
                      if (totalSavings > 0)
                        Container(
                          margin: const EdgeInsets.only(top: 3),
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xFFECFDF5),
                            borderRadius: BorderRadius.circular(100),
                            border: Border.all(color: const Color(0xFFD1FAE5)),
                          ),
                          child: Text(
                            'SAVED ₹${totalSavings.toStringAsFixed(0)}',
                            style: GoogleFonts.outfit(
                              fontSize: 8,
                              fontWeight: FontWeight.w900,
                              color: const Color(0xFF059669),
                              letterSpacing: 0.5,
                            ),
                          ),
                        ),
                    ],
                  ),

                  const SizedBox(width: 16),

                  // Right: Checkout button
                  Expanded(
                    child: GestureDetector(
                      onTap: () {
                        HapticFeedback.mediumImpact();
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => const CheckoutScreen(),
                          ),
                        );
                      },
                      child: Container(
                        height: 52,
                        decoration: BoxDecoration(
                          color: SahimedColors.primary,
                          borderRadius: BorderRadius.circular(100),
                          boxShadow: [
                            BoxShadow(
                              color: SahimedColors.primary.withOpacity(0.35),
                              blurRadius: 20,
                              offset: const Offset(0, 8),
                            ),
                          ],
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              'CHECKOUT',
                              style: GoogleFonts.outfit(
                                fontSize: 11,
                                fontWeight: FontWeight.w900,
                                color: Colors.white,
                                letterSpacing: 1.5,
                              ),
                            ),
                            const SizedBox(width: 8),
                            const Icon(
                              LucideIcons.chevronRight,
                              size: 16,
                              color: Colors.white,
                            ),
                          ],
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

// ─── Cart Item Tile ───────────────────────────────────────────────────────────
class _CartItemTile extends StatelessWidget {
  final CartItem item;
  final CartProvider cart;
  const _CartItemTile({required this.item, required this.cart});

  @override
  Widget build(BuildContext context) {
    final p = item.product;
    final mrp = p.mrp > 0 ? p.mrp : p.price + 20;
    final linePrice = p.price * item.quantity;
    final lineMrp = mrp * item.quantity;
    final savingsAmt = lineMrp - linePrice;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFF1F5F9)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x06000000),
            blurRadius: 8,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Product image
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFF1F5F9)),
            ),
            clipBehavior: Clip.antiAlias,
            child: CachedNetworkImage(
              imageUrl: p.imageUrl,
              fit: BoxFit.contain,
              errorWidget: (c, u, e) => const Icon(
                LucideIcons.pill,
                color: SahimedColors.primary,
                size: 24,
              ),
            ),
          ),

          const SizedBox(width: 12),

          // Info + qty
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Product name
                Text(
                  p.name.toUpperCase(),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.outfit(
                    fontSize: 10,
                    fontWeight: FontWeight.w900,
                    color: const Color(0xFF0F172A),
                    letterSpacing: 0.2,
                  ),
                ),
                // Salt
                Text(
                  (p.saltComposition ?? p.molName ?? '').toUpperCase(),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.outfit(
                    fontSize: 7,
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFF94A3B8),
                    letterSpacing: 1,
                  ),
                ),
                const SizedBox(height: 6),
                // Qty stepper
                Row(
                  children: [
                    _QtyBtn(
                      icon: LucideIcons.minus,
                      onTap: () => cart.updateQuantity(p.id, -1),
                    ),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      child: Text(
                        '${item.quantity}',
                        style: GoogleFonts.outfit(
                          fontSize: 13,
                          fontWeight: FontWeight.w900,
                          color: const Color(0xFF0F172A),
                        ),
                      ),
                    ),
                    _QtyBtn(
                      icon: LucideIcons.plus,
                      onTap: () => cart.updateQuantity(p.id, 1),
                    ),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(width: 10),

          // Price + savings + delete
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '₹${linePrice.toStringAsFixed(2)}',
                style: GoogleFonts.outfit(
                  fontSize: 14,
                  fontWeight: FontWeight.w900,
                  color: const Color(0xFF0F172A),
                  height: 1,
                ),
              ),
              Text(
                '₹${lineMrp.toStringAsFixed(2)}',
                style: GoogleFonts.outfit(
                  fontSize: 9,
                  fontWeight: FontWeight.bold,
                  color: const Color(0xFF94A3B8),
                  decoration: TextDecoration.lineThrough,
                ),
              ),
              if (savingsAmt > 0)
                Container(
                  margin: const EdgeInsets.only(top: 2),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 5,
                    vertical: 1,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xFFECFDF5),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    'SAVE ₹${savingsAmt.toStringAsFixed(0)}',
                    style: GoogleFonts.outfit(
                      fontSize: 7,
                      fontWeight: FontWeight.w900,
                      color: const Color(0xFF059669),
                    ),
                  ),
                ),
              const SizedBox(height: 8),
              // Delete button
              GestureDetector(
                onTap: () => cart.removeItem(p.id),
                child: Container(
                  width: 30,
                  height: 30,
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFF1F2),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(
                    LucideIcons.trash2,
                    size: 14,
                    color: Color(0xFFE11D48),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ─── Qty stepper button ───────────────────────────────────────────────────────
class _QtyBtn extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  const _QtyBtn({required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        onTap();
      },
      child: Container(
        width: 28,
        height: 28,
        decoration: BoxDecoration(
          color: Colors.white,
          shape: BoxShape.circle,
          border: Border.all(color: const Color(0xFFF1F5F9)),
          boxShadow: const [BoxShadow(color: Color(0x08000000), blurRadius: 4)],
        ),
        child: Icon(icon, size: 12, color: SahimedColors.primary),
      ),
    );
  }
}

// ─── Summary Row ─────────────────────────────────────────────────────────────
class _SummaryRow extends StatelessWidget {
  final String label;
  final String value;
  final Color valueColor;
  const _SummaryRow({
    required this.label,
    required this.value,
    required this.valueColor,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label.toUpperCase(),
            style: GoogleFonts.outfit(
              fontSize: 9,
              fontWeight: FontWeight.bold,
              color: const Color(0xFF64748B),
              letterSpacing: 1,
            ),
          ),
          Text(
            value,
            style: GoogleFonts.outfit(
              fontSize: 9,
              fontWeight: FontWeight.w900,
              color: valueColor,
              letterSpacing: 0.5,
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Empty Cart ───────────────────────────────────────────────────────────────
class _EmptyCart extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(32),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x14000000),
                    blurRadius: 40,
                    offset: Offset(0, 16),
                  ),
                ],
              ),
              child: const Icon(
                LucideIcons.shoppingCart,
                size: 44,
                color: Color(0xFFCBD5E1),
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'YOUR CART IS EMPTY',
              style: GoogleFonts.outfit(
                fontSize: 20,
                fontWeight: FontWeight.w900,
                color: const Color(0xFF0F172A),
                letterSpacing: -0.5,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              'ADD MEDICINES TO START YOUR ORDER',
              style: GoogleFonts.outfit(
                fontSize: 9,
                fontWeight: FontWeight.bold,
                color: const Color(0xFF94A3B8),
                letterSpacing: 1.5,
              ),
            ),
            const SizedBox(height: 32),
            GestureDetector(
              onTap: () {
                HapticFeedback.mediumImpact();
                context.read<NavigationProvider>().switchTab(0);
              },
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 36,
                  vertical: 16,
                ),
                decoration: BoxDecoration(
                  color: SahimedColors.primary,
                  borderRadius: BorderRadius.circular(100),
                  boxShadow: [
                    BoxShadow(
                      color: SahimedColors.primary.withOpacity(0.35),
                      blurRadius: 20,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: Text(
                  'START SHOPPING',
                  style: GoogleFonts.outfit(
                    fontSize: 11,
                    fontWeight: FontWeight.w900,
                    color: Colors.white,
                    letterSpacing: 1.5,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Promo Bottom Sheet ────────────────────────────────────────────────────────
class _PromoSheet extends StatelessWidget {
  final List<PromoModel> promos;
  final CartProvider cart;
  final void Function(PromoModel) onApply;

  const _PromoSheet({
    required this.promos,
    required this.cart,
    required this.onApply,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(40)),
      ),
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.75,
      ),
      child: Column(
        children: [
          // Handle
          Container(
            margin: const EdgeInsets.only(top: 12),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: const Color(0xFFE2E8F0),
              borderRadius: BorderRadius.circular(2),
            ),
          ),

          // Header — green bar like website
          Container(
            width: double.infinity,
            padding: const EdgeInsets.fromLTRB(24, 20, 24, 20),
            decoration: const BoxDecoration(
              color: SahimedColors.primary,
              borderRadius: BorderRadius.vertical(top: Radius.circular(40)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'APPLY COUPON',
                  style: GoogleFonts.outfit(
                    fontSize: 22,
                    fontWeight: FontWeight.w900,
                    color: Colors.white,
                    letterSpacing: -0.5,
                  ),
                ),
                Text(
                  'SELECT A DISCOUNT CODE TO SAVE ON YOUR ORDER',
                  style: GoogleFonts.outfit(
                    fontSize: 8,
                    fontWeight: FontWeight.w900,
                    color: Colors.white.withOpacity(0.6),
                    letterSpacing: 1,
                  ),
                ),
              ],
            ),
          ),

          // Promo list
          Expanded(
            child: promos.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(
                          LucideIcons.ticket,
                          size: 48,
                          color: Color(0xFFE2E8F0),
                        ),
                        const SizedBox(height: 12),
                        Text(
                          'NO ACTIVE REWARDS AVAILABLE',
                          style: GoogleFonts.outfit(
                            fontSize: 9,
                            fontWeight: FontWeight.w900,
                            color: const Color(0xFF94A3B8),
                            letterSpacing: 1.5,
                          ),
                        ),
                      ],
                    ),
                  )
                : ListView.separated(
                    padding: const EdgeInsets.all(20),
                    itemCount: promos.length,
                    separatorBuilder: (_, _) => const SizedBox(height: 12),
                    itemBuilder: (_, i) {
                      final promo = promos[i];
                      
                      final rules = promo.rules;
                      final scope = promo.scope ?? 'global';
                      
                      final hasEligibleItems = cart.items.any((item) {
                        bool isEligible = true;
                        final isItemGeneric = item.product.isGeneric;
                        
                        if (scope == 'branded' || (rules != null && rules['isBrandedOnly'] == true)) {
                          if (isItemGeneric) isEligible = false;
                        } else if (scope == 'generic' || (rules != null && rules['isGenericOnly'] == true)) {
                          if (!isItemGeneric) isEligible = false;
                        }
                        
                        final allowedCats = rules != null && rules['categories'] != null 
                          ? List<String>.from(rules['categories']) 
                          : <String>[];
                        if (scope == 'category' || allowedCats.isNotEmpty) {
                          final cats = [...allowedCats];
                          if (scope == 'category' && promo.scopeValue != null) cats.add(promo.scopeValue!);
                          if (!cats.contains(item.product.category)) isEligible = false;
                        }
                        
                        final allowedProds = rules != null && rules['products'] != null 
                          ? List<String>.from(rules['products']) 
                          : <String>[];
                        if (scope == 'product' || allowedProds.isNotEmpty) {
                          final prods = [...allowedProds];
                          if (scope == 'product' && promo.scopeValue != null) prods.add(promo.scopeValue!);
                          if (!prods.contains(item.product.name)) isEligible = false;
                        }
                        
                        return isEligible;
                      });

                      final isValueMet = cart.total >= promo.minOrderValue;
                      final isApplicable = isValueMet && hasEligibleItems;

                      String restrictionMessage = "";
                      if (!hasEligibleItems) {
                        if (scope == 'branded' || (rules != null && rules['isBrandedOnly'] == true)) {
                          restrictionMessage = "APPLICABLE TO BRANDED ITEMS ONLY";
                        } else if (scope == 'generic' || (rules != null && rules['isGenericOnly'] == true)) {
                          restrictionMessage = "APPLICABLE TO GENERIC ITEMS ONLY";
                        } else if (scope == 'category' || (rules != null && (rules['categories'] as List?)?.isNotEmpty == true)) {
                          restrictionMessage = "APPLICABLE TO SPECIFIC CATEGORIES ONLY";
                        } else if (scope == 'product' || (rules != null && (rules['products'] as List?)?.isNotEmpty == true)) {
                          restrictionMessage = "APPLICABLE TO SPECIFIC ITEMS ONLY";
                        }
                      }

                      final progressPct = promo.minOrderValue > 0
                          ? (cart.total / promo.minOrderValue).clamp(0.0, 1.0)
                          : 1.0;
                      return GestureDetector(
                        onTap: isApplicable ? () => onApply(promo) : null,
                        child: Opacity(
                          opacity: isApplicable ? 1.0 : 0.5,
                          child: Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(24),
                              border: Border.all(
                                color: isApplicable
                                    ? const Color(0xFFF1F5F9)
                                    : const Color(0xFFE2E8F0),
                                width: isApplicable ? 1.5 : 1,
                              ),
                              boxShadow: isApplicable
                                  ? const [
                                      BoxShadow(
                                        color: Color(0x08000000),
                                        blurRadius: 12,
                                        offset: Offset(0, 4),
                                      ),
                                    ]
                                  : null,
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment:
                                      MainAxisAlignment.spaceBetween,
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 10,
                                        vertical: 4,
                                      ),
                                      decoration: BoxDecoration(
                                        color: SahimedColors.primary.withOpacity(0.4),
                                        borderRadius: BorderRadius.circular(
                                          100,
                                        ),
                                      ),
                                      child: Text(
                                        promo.code,
                                        style: GoogleFonts.outfit(
                                          fontSize: 10,
                                          fontWeight: FontWeight.w900,
                                          color: SahimedColors.primary,
                                          letterSpacing: 1,
                                        ),
                                      ),
                                    ),
                                    Text(
                                      promo.discountType == 'percentage'
                                          ? '${promo.discountValue.toStringAsFixed(0)}% OFF'
                                          : '₹${promo.discountValue.toStringAsFixed(0)} OFF',
                                      style: GoogleFonts.outfit(
                                        fontSize: 16,
                                        fontWeight: FontWeight.w900,
                                        color: SahimedColors.primary,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  promo.description.toUpperCase(),
                                  style: GoogleFonts.outfit(
                                    fontSize: 8,
                                    fontWeight: FontWeight.bold,
                                    color: const Color(0xFF64748B),
                                    letterSpacing: 0.5,
                                  ),
                                ),
                                if (!isValueMet) ...[
                                  const SizedBox(height: 10),
                                  Row(
                                    children: [
                                      Expanded(
                                        child: ClipRRect(
                                          borderRadius: BorderRadius.circular(
                                            100,
                                          ),
                                          child: LinearProgressIndicator(
                                            value: progressPct,
                                            minHeight: 6,
                                            backgroundColor: const Color(
                                              0xFFE2E8F0,
                                            ),
                                            valueColor: AlwaysStoppedAnimation(
                                              SahimedColors.primary,
                                            ),
                                          ),
                                        ),
                                      ),
                                      const SizedBox(width: 10),
                                      Text(
                                        'ADD ₹${(promo.minOrderValue - cart.total).toStringAsFixed(0)} MORE',
                                        style: GoogleFonts.outfit(
                                          fontSize: 8,
                                          fontWeight: FontWeight.w900,
                                          color: SahimedColors.primary,
                                          letterSpacing: 0.5,
                                        ),
                                      ),
                                    ],
                                  ),
                                ] else if (!hasEligibleItems) ...[
                                  const SizedBox(height: 10),
                                  Row(
                                    children: [
                                      const Icon(LucideIcons.alertCircle, size: 10, color: Color(0xFFE11D48)),
                                      const SizedBox(width: 4),
                                      Text(
                                        restrictionMessage,
                                        style: GoogleFonts.outfit(
                                          fontSize: 8,
                                          fontWeight: FontWeight.w900,
                                          color: const Color(0xFFE11D48),
                                          letterSpacing: 0.5,
                                        ),
                                      ),
                                    ],
                                  ),
                                ] else ...[
                                  const SizedBox(height: 6),
                                  Text(
                                    'APPLY COUPON NOW',
                                    style: GoogleFonts.outfit(
                                      fontSize: 8,
                                      fontWeight: FontWeight.w900,
                                      color: SahimedColors.primary.withOpacity(0.4),
                                      letterSpacing: 1,
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ),
                        ),
                      );
                    },

                  ),
          ),
        ],
      ),
    );
  }
}

// ─── Sahi Recommended Section (Loss Aversion) ─────────────────────────────
class _SahiRecsSection extends StatefulWidget {
  final CartProvider cart;
  final ApiService apiService;
  const _SahiRecsSection({required this.cart, required this.apiService});

  @override
  State<_SahiRecsSection> createState() => _SahiRecsSectionState();
}

class _SahiRecsSectionState extends State<_SahiRecsSection> {
  List<Map<String, dynamic>> _recs = [];
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _findRecs();
  }

  @override
  void didUpdateWidget(_SahiRecsSection oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.cart.items.length != widget.cart.items.length) {
      _findRecs();
    }
  }

  Future<void> _findRecs() async {
    final brandedItems = widget.cart.items
        .where((i) => !i.product.isGeneric)
        .toList();
    if (brandedItems.isEmpty) {
      if (mounted) setState(() => _recs = []);
      return;
    }

    if (mounted) setState(() => _loading = true);

    List<Map<String, dynamic>> found = [];
    for (var item in brandedItems) {
      if (item.product.moleculeId != null) {
        final alt = await widget.apiService.getGenericAlternative(
          item.product.moleculeId!,
        );
        if (alt != null && alt.id != item.product.id) {
          final loss = (item.product.mrp - alt.price).clamp(0, double.infinity);
          if (loss > 0) {
            found.add({
              'original': item.product,
              'recommended': alt,
              'loss': loss * item.quantity,
            });
          }
        }
      }
    }

    if (mounted) {
      setState(() {
        _recs = found;
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(20),
          child: CircularProgressIndicator(strokeWidth: 2),
        ),
      );
    }
    if (_recs.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 12),
          child: Row(
            children: [
              const Icon(
                LucideIcons.sparkles,
                size: 16,
                color: SahimedColors.primary,
              ),
              const SizedBox(width: 8),
              Text(
                'SMART SAVINGS RECOMMENDATION',
                style: GoogleFonts.outfit(
                  fontSize: 12,
                  fontWeight: FontWeight.w900,
                  color: SahimedColors.primary,
                  letterSpacing: 1.2,
                ),
              ),
            ],
          ),
        ),
        ..._recs.map(
          (rec) => _LossAlertCard(
            original: rec['original'],
            recommended: rec['recommended'],
            loss: rec['loss'],
            onSwap: () {
              widget.cart.removeItem(rec['original'].id);
              widget.cart.addItem(rec['recommended']);
              _findRecs();
            },
          ),
        ),
      ],
    );
  }
}

class _LossAlertCard extends StatelessWidget {
  final ProductModel original;
  final ProductModel recommended;
  final double loss;
  final VoidCallback onSwap;

  const _LossAlertCard({
    required this.original,
    required this.recommended,
    required this.loss,
    required this.onSwap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFFFF1F2), Colors.white],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(28),
        border: Border.all(
          color: SahimedColors.primary.withOpacity(0.2),
          width: 1.5,
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFFE11D48).withOpacity(0.05),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Loss Icon
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: SahimedColors.primary,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: const Icon(
                    LucideIcons.sparkles,
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
                        'SAVE ₹${loss.toStringAsFixed(0)} BY SWITCHING',
                        style: GoogleFonts.outfit(
                          fontSize: 16,
                          fontWeight: FontWeight.w900,
                          color: SahimedColors.primary,
                          letterSpacing: -0.5,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'SMART CHOICE: SAME COMPOSITION, BETTER PRICE',
                        style: GoogleFonts.outfit(
                          fontSize: 8,
                          fontWeight: FontWeight.w900,
                          color: SahimedColors.primary.withOpacity(0.7),
                          letterSpacing: 0.5,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: const Color(0xFFF1F5F9)),
              ),
              child: Row(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: CachedNetworkImage(
                      imageUrl: recommended.imageUrl,
                      width: 44,
                      height: 44,
                      fit: BoxFit.contain,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          recommended.name.toUpperCase(),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: GoogleFonts.outfit(
                            fontSize: 10,
                            fontWeight: FontWeight.w900,
                            color: const Color(0xFF0F172A),
                          ),
                        ),
                        Text(
                          'SAME COMPOSITION • SAVE ₹${(original.mrp - recommended.price).toStringAsFixed(0)}',
                          style: GoogleFonts.outfit(
                            fontSize: 7,
                            fontWeight: FontWeight.bold,
                            color: SahimedColors.primary,
                          ),
                        ),
                      ],
                    ),
                  ),
                  GestureDetector(
                    onTap: onSwap,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 8,
                      ),
                      decoration: BoxDecoration(
                        color: SahimedColors.primary,
                        borderRadius: BorderRadius.circular(100),
                        boxShadow: [
                          BoxShadow(
                            color: SahimedColors.primary.withOpacity(0.3),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Text(
                        'SWAP',
                        style: GoogleFonts.outfit(
                          fontSize: 9,
                          fontWeight: FontWeight.w900,
                          color: Colors.white,
                          letterSpacing: 1,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
