import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/colors.dart';
import '../../../core/services/api_service.dart';
import '../../../core/providers/cart_provider.dart';
import '../../../shared/models/models.dart';
import 'order_detail_screen.dart';

class OrdersScreen extends StatefulWidget {
  const OrdersScreen({super.key});

  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> {
  final _apiService = ApiService();
  List<OrderModel> _orders = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadOrders();
  }

  Future<void> _loadOrders() async {
    setState(() => _isLoading = true);
    try {
      final ordersData = await _apiService.getUserOrders();
      setState(() => _orders = ordersData.map((m) => OrderModel.fromJson(m)).toList());
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Error loading orders')),
        );
      }
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _reorder(OrderModel order) {
    final cart = context.read<CartProvider>();
    final items = order.items;

    int addedCount = 0;
    for (var item in items) {
      try {
        // Robust field mapping for cross-platform compatibility
        final String medicineId = (item['medicineId'] ?? item['id'] ?? item['productId'] ?? item['sku'] ?? '').toString();
        final String name = item['name'] ?? 'Medicine';
        final String brand = item['brand'] ?? '';
        
        // Safety for numeric values
        final double price = num.tryParse((item['unitPrice'] ?? item['price'] ?? 0).toString())?.toDouble() ?? 0.0;
        final double mrp = num.tryParse((item['mrp'] ?? price).toString())?.toDouble() ?? price;
        
        final product = ProductModel(
          id: medicineId,
          name: name,
          brand: brand,
          price: price,
          mrp: mrp,
          imageUrl:
              item['imageUrl'] ??
              'https://picsum.photos/seed/$medicineId/300/300',
        );

        // Add to cart with original quantity
        final qty = num.tryParse((item['quantity'] ?? 1).toString())?.toInt() ?? 1;
        for (int i = 0; i < qty; i++) {
          cart.addItem(product);
        }
        addedCount++;
      } catch (e) {
        debugPrint('Error re-ordering item: $e');
      }
    }

    if (addedCount > 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            '$addedCount ITEMS ADDED TO CART',
            style: GoogleFonts.outfit(
              fontWeight: FontWeight.w900,
              fontSize: 10,
              color: Colors.white,
            ),
          ),
          backgroundColor: SahimedColors.primary,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          margin: const EdgeInsets.all(20),
          action: SnackBarAction(
            label: 'VIEW CART',
            textColor: Colors.white,
            onPressed: () {
              // Note: You might need to handle navigation back to home/cart tab depending on your structure
            },
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(LucideIcons.arrowLeft, color: Color(0xFF0F172A)),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'ORDER HISTORY',
          style: GoogleFonts.outfit(
            fontWeight: FontWeight.w900,
            fontSize: 16,
            color: const Color(0xFF0F172A),
            letterSpacing: 1,
          ),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _loadOrders,
        color: SahimedColors.primary,
        child: _isLoading
            ? const Center(
                child: CircularProgressIndicator(color: SahimedColors.primary),
              )
            : _orders.isEmpty
            ? _buildEmptyState()
            : ListView.builder(
                padding: const EdgeInsets.all(20),
                itemCount: _orders.length,
                itemBuilder: (ctx, i) {
                  final order = _orders[i];
                  return _buildOrderCard(order);
                },
              ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(
            LucideIcons.package,
            size: 64,
            color: SahimedColors.slate200,
          ),
          const SizedBox(height: 24),
          Text(
            'NO ORDERS YET',
            style: GoogleFonts.outfit(
              fontSize: 18,
              fontWeight: FontWeight.w900,
              color: const Color(0xFF0F172A),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Your medicine journey starts here.',
            style: GoogleFonts.inter(
              fontSize: 13,
              color: SahimedColors.slate400,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOrderCard(OrderModel order) {
    final status = order.status;
    final isDelivered = status == 'Delivered';

    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(28),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: InkWell(
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => OrderDetailScreen(order: order),
          ),
        ),
        borderRadius: BorderRadius.circular(28),
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(20),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: isDelivered
                          ? const Color(0xFFF0FDF4)
                          : const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Icon(
                      isDelivered ? LucideIcons.check : LucideIcons.package,
                      color: isDelivered
                          ? const Color(0xFF16A34A)
                          : const Color(0xFF64748B),
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'ORDER #${(order.orderId ?? order.id).toUpperCase()}',
                          style: GoogleFonts.outfit(
                            fontSize: 10,
                            fontWeight: FontWeight.w900,
                            color: SahimedColors.slate400,
                            letterSpacing: 1,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '₹${order.totalAmount.toStringAsFixed(0)}',
                          style: GoogleFonts.outfit(
                            fontSize: 18,
                            fontWeight: FontWeight.w900,
                            color: const Color(0xFF0F172A),
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: isDelivered
                          ? const Color(0xFF16A34A)
                          : SahimedColors.primary,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      status.toUpperCase(),
                      style: GoogleFonts.outfit(
                        fontSize: 8,
                        fontWeight: FontWeight.w900,
                        color: Colors.white,
                        letterSpacing: 1,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const Divider(height: 1),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    '${order.items.length} ITEMS',
                    style: GoogleFonts.outfit(
                      fontSize: 9,
                      fontWeight: FontWeight.w900,
                      color: SahimedColors.slate400,
                      letterSpacing: 1,
                    ),
                  ),
                  Row(
                    children: [
                      TextButton(
                        onPressed: () => _reorder(order),
                        style: TextButton.styleFrom(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          backgroundColor: SahimedColors.primary.withOpacity(0.1),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(20),
                          ),
                        ),
                        child: Text(
                          'RE-ORDER',
                          style: GoogleFonts.outfit(
                            fontSize: 10,
                            fontWeight: FontWeight.w900,
                            color: SahimedColors.primary,
                            letterSpacing: 1,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      const Icon(
                        LucideIcons.chevronRight,
                        size: 16,
                        color: SahimedColors.slate300,
                      ),
                    ],
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
