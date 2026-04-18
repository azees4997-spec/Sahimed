import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../core/theme/colors.dart';
import '../../../core/providers/cart_provider.dart';
import '../../../shared/models/models.dart';
import '../../../core/services/api_service.dart';
import 'checkout_screen.dart';

class CartScreen extends StatelessWidget {
  const CartScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final cart = context.watch<CartProvider>();

    return Scaffold(
      backgroundColor: SahimedColors.background,
      appBar: AppBar(
        title: Text(
          'My Cart',
          style: GoogleFonts.outfit(
            fontWeight: FontWeight.w800,
            fontSize: 20,
            color: SahimedColors.textPrimary,
          ),
        ),
        backgroundColor: SahimedColors.white,
        elevation: 0,
        centerTitle: false,
        surfaceTintColor: Colors.transparent,
        leading: IconButton(
          icon: Icon(LucideIcons.chevronLeft, color: SahimedColors.textPrimary),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: cart.items.isEmpty
          ? _buildEmptyCart(context)
          : Stack(
              children: [
                ListView.builder(
                  padding: const EdgeInsets.fromLTRB(20, 10, 20, 150),
                  itemCount: cart.items.length + 1,
                  itemBuilder: (context, index) {
                    if (index == cart.items.length) {
                      return _buildOrderSummary(cart);
                    }
                    final item = cart.items[index];
                    return _buildCartItem(context, cart, item);
                  },
                ),
                Positioned(
                  bottom: 0,
                  left: 0,
                  right: 0,
                  child: _buildGlassCheckoutBar(context, cart),
                ),
              ],
            ),
    );
  }

  Widget _buildEmptyCart(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(30),
            decoration: BoxDecoration(
              color: SahimedColors.primary.withValues(alpha: 0.05),
              shape: BoxShape.circle,
            ),
            child: Icon(
              LucideIcons.shoppingBag,
              size: 60,
              color: SahimedColors.primary.withValues(alpha: 0.5),
            ),
          ),
          const SizedBox(height: 24),
          Text(
            'Your cart is empty',
            style: GoogleFonts.outfit(
              fontSize: 22,
              fontWeight: FontWeight.w800,
              color: SahimedColors.textPrimary,
            ),
          ),
          const SizedBox(height: 12),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 40),
            child: Text(
              'Explore our wide range of medicines and healthcare products.',
              textAlign: TextAlign.center,
              style: GoogleFonts.outfit(
                fontSize: 15,
                color: SahimedColors.textSecondary,
                height: 1.5,
              ),
            ),
          ),
          const SizedBox(height: 32),
          ElevatedButton(
            onPressed: () => Navigator.pop(context),
            style: ElevatedButton.styleFrom(
              backgroundColor: SahimedColors.primary,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              elevation: 4,
              shadowColor: SahimedColors.primary.withValues(alpha: 0.3),
            ),
            child: Text(
              'Start Shopping',
              style: GoogleFonts.outfit(fontWeight: FontWeight.w700),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCartItem(BuildContext context, CartProvider cart, CartItem item) {
    final double price = item.product.price;
    final double mrp = item.product.mrp;
    final double discount = mrp > price ? ((mrp - price) / mrp * 100) : 0;
    final double savingsPerItem = mrp > price ? (mrp - price) : 0;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: SahimedColors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: SahimedColors.slate100),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 15,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(24),
        child: IntrinsicHeight(
          child: Row(
            children: [
              Container(
                width: 100,
                padding: const EdgeInsets.all(12),
                decoration: const BoxDecoration(
                  color: SahimedColors.background,
                ),
                child: CachedNetworkImage(
                  imageUrl: item.product.imageUrl,
                  fit: BoxFit.contain,
                  placeholder: (context, url) => Center(child: CircularProgressIndicator(strokeWidth: 2, color: SahimedColors.primary.withValues(alpha: 0.3))),
                  errorWidget: (context, url, error) => const Icon(LucideIcons.pill, color: Colors.grey),
                ),
              ),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  item.product.name.toUpperCase(),
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                  style: GoogleFonts.outfit(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w900,
                                    color: SahimedColors.textPrimary,
                                  ),
                                ),
                                if (savingsPerItem > 0)
                                  Container(
                                    margin: const EdgeInsets.only(top: 4),
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: Colors.green.shade50,
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    child: Text(
                                      'SAVING ₹${(savingsPerItem * item.quantity).toStringAsFixed(0)} (${discount.toStringAsFixed(0)}%)',
                                      style: GoogleFonts.outfit(
                                        fontSize: 9,
                                        fontWeight: FontWeight.w900,
                                        color: Colors.green.shade700,
                                      ),
                                    ),
                                  ),
                              ],
                            ),
                          ),
                          IconButton(
                            onPressed: () => cart.removeItem(item.product.id),
                            icon: const Icon(LucideIcons.trash2, size: 18, color: SahimedColors.accent),
                            visualDensity: VisualDensity.compact,
                          ),
                        ],
                      ),
                      const Spacer(),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              if (mrp > price)
                                Text(
                                  '₹${mrp.toStringAsFixed(0)}',
                                  style: GoogleFonts.outfit(
                                    fontSize: 11,
                                    color: SahimedColors.slate300,
                                    decoration: TextDecoration.lineThrough,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              Text(
                                '₹${price.toStringAsFixed(2)}',
                                style: GoogleFonts.outfit(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w900,
                                  color: SahimedColors.primary,
                                ),
                              ),
                            ],
                          ),
                          _buildQuantitySelector(cart, item),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildQuantitySelector(CartProvider cart, CartItem item) {
    return Container(
      decoration: BoxDecoration(
        color: SahimedColors.background,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: SahimedColors.slate100),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _qButton(LucideIcons.minus, () => cart.updateQuantity(item.product.id, -1), SahimedColors.slate500),
          Container(
            width: 30,
            alignment: Alignment.center,
            child: Text(
              '${item.quantity}',
              style: GoogleFonts.outfit(
                fontSize: 14,
                fontWeight: FontWeight.w900,
                color: SahimedColors.primary,
              ),
            ),
          ),
          _qButton(LucideIcons.plus, () => cart.updateQuantity(item.product.id, 1), SahimedColors.primary),
        ],
      ),
    );
  }

  Widget _qButton(IconData icon, VoidCallback onTap, Color color) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
        child: Icon(icon, size: 14, color: color),
      ),
    );
  }

  Widget _buildOrderSummary(CartProvider cart) {
    return Column(
      children: [
        // Promo Code Section
        InkWell(
          onTap: () => _showPromoBottomSheet(context, cart),
          borderRadius: BorderRadius.circular(24),
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: cart.appliedPromo != null ? Colors.green.shade50 : Colors.white,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: cart.appliedPromo != null ? Colors.green.withValues(alpha: 0.2) : SahimedColors.slate100),
            ),
            child: Row(
              children: [
                Icon(LucideIcons.ticket, color: cart.appliedPromo != null ? Colors.green : SahimedColors.accent),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        cart.appliedPromo != null ? 'PROMO APPLIED: ${cart.appliedPromo!.code}' : 'APPLY PROMO CODE',
                        style: GoogleFonts.outfit(
                          fontWeight: FontWeight.w900, 
                          fontSize: 13, 
                          letterSpacing: 1, 
                          color: cart.appliedPromo != null ? Colors.green.shade900 : SahimedColors.slate950
                        ),
                      ),
                      if (cart.appliedPromo != null)
                        Text(
                          'You saved ₹${cart.promoDiscount.toStringAsFixed(0)} with this code',
                          style: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.green.shade700),
                        ),
                    ],
                  ),
                ),
                if (cart.appliedPromo != null)
                  IconButton(
                    onPressed: () => cart.removePromo(),
                    icon: const Icon(LucideIcons.xCircle, color: SahimedColors.accent, size: 20),
                    visualDensity: VisualDensity.compact,
                  )
                else
                  const Icon(LucideIcons.chevronRight, color: SahimedColors.slate300),
              ],
            ),
          ),
        ),

        // Massive Billing Attraction
        Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: SahimedColors.white,
            borderRadius: BorderRadius.circular(32),
            border: Border.all(color: SahimedColors.primary.withValues(alpha: 0.1), width: 2),
            boxShadow: [
              BoxShadow(color: SahimedColors.primary.withValues(alpha: 0.05), blurRadius: 20, offset: const Offset(0, 10)),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'BILLING DETAILS',
                    style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.w900, color: SahimedColors.primary, letterSpacing: 2),
                  ),
                  const Icon(LucideIcons.receipt, color: SahimedColors.primary, size: 18),
                ],
              ),
              const SizedBox(height: 24),
              _summaryRow('MRP Total', '₹${cart.subtotal.toStringAsFixed(2)}'),
              _summaryRow('Delivery Fee', cart.deliveryFee == 0 ? 'FREE' : '₹${cart.deliveryFee}', isGreen: cart.deliveryFee == 0),
              _summaryRow('Packing Fee', '₹${cart.packingFee}'),
              if (cart.subtotal - cart.total > 0)
                _summaryRow('Campaign Discount', '- ₹${(cart.subtotal - cart.total).toStringAsFixed(2)}', isGreen: true),
              if (cart.appliedPromo != null)
                _summaryRow('Promocode Saving', '- ₹${cart.promoDiscount.toStringAsFixed(2)}', isGreen: true),
              
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 20),
                child: Divider(height: 1),
              ),
              
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'TOTAL PAYABLE',
                    style: GoogleFonts.outfit(
                      fontSize: 18,
                      fontWeight: FontWeight.w900,
                      color: SahimedColors.textPrimary,
                    ),
                  ),
                  Text(
                    '₹${cart.total.toStringAsFixed(2)}',
                    style: GoogleFonts.outfit(
                      fontSize: 26,
                      fontWeight: FontWeight.w900,
                      color: SahimedColors.primary,
                      letterSpacing: -0.5,
                    ),
                  ),
                ],
              ),
              
              if (cart.totalSavings > 0) ...[
                const SizedBox(height: 24),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        Colors.green.shade50,
                        Colors.blue.shade50,
                      ],
                    ),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: Colors.green.withValues(alpha: 0.1)),
                  ),
                  child: Row(
                    children: [
                      const Icon(LucideIcons.partyPopper, size: 20, color: Colors.green),
                      const SizedBox(width: 12),
                      Expanded(
                        child: RichText(
                          text: TextSpan(
                            style: GoogleFonts.outfit(fontSize: 13, color: Colors.green[900], height: 1.4),
                            children: [
                              const TextSpan(text: 'Congratulations! You are saving '),
                              TextSpan(
                                text: '₹${cart.totalSavings.toStringAsFixed(0)}',
                                style: const TextStyle(fontWeight: FontWeight.w900),
                              ),
                              const TextSpan(text: ' on this order.'),
                            ],
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
    );
  }

  Widget _summaryRow(String label, String value, {bool isGreen = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: GoogleFonts.outfit(
              fontSize: 14,
              color: SahimedColors.textSecondary,
              fontWeight: FontWeight.w500,
            ),
          ),
          Text(
            value,
            style: GoogleFonts.outfit(
              fontSize: 15,
              color: isGreen ? Colors.green : SahimedColors.textPrimary,
              fontWeight: isGreen ? FontWeight.w800 : FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGlassCheckoutBar(BuildContext context, CartProvider cart) {
    return ClipRRect(
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
        child: Container(
          padding: const EdgeInsets.fromLTRB(24, 20, 24, 110), // Increased bottom padding to clear nav bar
          decoration: BoxDecoration(
            color: SahimedColors.white.withValues(alpha: 0.8),
            borderRadius: const BorderRadius.only(
              topLeft: Radius.circular(40),
              topRight: Radius.circular(40),
            ),
            border: Border.all(color: SahimedColors.white.withValues(alpha: 0.3)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.05),
                blurRadius: 30,
                offset: const Offset(0, -10),
              ),
            ],
          ),
          child: Row(
            children: [
              Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Total Payable',
                    style: GoogleFonts.outfit(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: SahimedColors.textSecondary,
                    ),
                  ),
                  Text(
                    '₹${cart.total.toStringAsFixed(2)}',
                    style: GoogleFonts.outfit(
                      fontSize: 22,
                      fontWeight: FontWeight.w900,
                      color: SahimedColors.primary,
                    ),
                  ),
                ],
              ),
              const SizedBox(width: 24),
              Expanded(
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (context) => const CheckoutScreen()),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: SahimedColors.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 18),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                    elevation: 8,
                    shadowColor: SahimedColors.primary.withValues(alpha: 0.4),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        'Checkout Now',
                        style: GoogleFonts.outfit(
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const SizedBox(width: 8),
                      const Icon(LucideIcons.arrowRight, size: 18),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showPromoBottomSheet(BuildContext context, CartProvider cart) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) => _PromoBottomSheet(cart: cart),
    );
  }
}

class _PromoBottomSheet extends StatefulWidget {
  final CartProvider cart;
  const _PromoBottomSheet({required this.cart});

  @override
  State<_PromoBottomSheet> createState() => _PromoBottomSheetState();
}

class _PromoBottomSheetState extends State<_PromoBottomSheet> {
  final ApiService _apiService = ApiService();
  List<PromoModel> _promos = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchPromos();
  }

  Future<void> _fetchPromos() async {
    final promos = await _apiService.getPromos();
    if (mounted) {
      setState(() {
        _promos = promos;
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.7,
      decoration: const BoxDecoration(
        color: SahimedColors.background,
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(40),
          topRight: Radius.circular(40),
        ),
      ),
      child: Column(
        children: [
          const SizedBox(height: 12),
          Container(width: 40, height: 4, decoration: BoxDecoration(color: SahimedColors.slate200, borderRadius: BorderRadius.circular(2))),
          const SizedBox(height: 24),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Row(
              children: [
                const Icon(LucideIcons.ticket, color: SahimedColors.primary),
                const SizedBox(width: 12),
                Text(
                  'AVAILABLE OFFERS',
                  style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w900, color: SahimedColors.textPrimary, letterSpacing: -0.5),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: SahimedColors.primary))
                : _promos.isEmpty
                    ? _buildEmptyPromos()
                    : ListView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 20),
                        itemCount: _promos.length,
                        itemBuilder: (context, index) => _buildPromoCard(_promos[index]),
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyPromos() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(LucideIcons.frown, size: 48, color: SahimedColors.slate300),
        const SizedBox(height: 16),
        Text('No active promocodes', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: SahimedColors.slate400)),
      ],
    );
  }

  Widget _buildPromoCard(PromoModel promo) {
    final isApplicable = widget.cart.total >= promo.minOrderValue;
    final isApplied = widget.cart.appliedPromo?.id == promo.id;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: SahimedColors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: isApplied ? SahimedColors.primary : SahimedColors.slate100),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 10)],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(color: SahimedColors.primary.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
                child: Text(
                  promo.code,
                  style: GoogleFonts.outfit(fontWeight: FontWeight.w900, color: SahimedColors.primary, fontSize: 14, letterSpacing: 1),
                ),
              ),
              if (isApplied)
                const Icon(LucideIcons.checkCircle2, color: SahimedColors.primary, size: 24)
              else if (isApplicable)
                TextButton(
                  onPressed: () {
                    widget.cart.applyPromo(promo);
                    Navigator.pop(context);
                  },
                  child: Text('APPLY', style: GoogleFonts.outfit(fontWeight: FontWeight.w900, color: SahimedColors.primary)),
                )
            ],
          ),
          const SizedBox(height: 12),
          Text(promo.description, style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.bold, color: SahimedColors.textPrimary)),
          const SizedBox(height: 8),
          if (!isApplicable)
            Text(
              'Add ₹${(promo.minOrderValue - widget.cart.total).toStringAsFixed(0)} more to apply',
              style: GoogleFonts.outfit(fontSize: 11, color: SahimedColors.accent, fontWeight: FontWeight.w900),
            ),
        ],
      ),
    );
  }
}
