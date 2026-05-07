import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:flutter/services.dart';
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
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadOrders();
  }

  Future<void> _loadOrders() async {
    if (!mounted) return;
    setState(() {
      _isLoading = true;
      _error = null;
    });
    
    try {
      final ordersData = await _apiService.getUserOrders();
      if (mounted) {
        setState(() {
          _orders = ordersData.map((m) => OrderModel.fromJson(m)).toList();
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('CRITICAL: Error in _loadOrders: $e');
      if (mounted) {
        setState(() {
          _error = e.toString().split('\n').first;
          _isLoading = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error loading orders: $_error'),
            backgroundColor: SahimedColors.rose500,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  void _reorder(OrderModel order) {
    HapticFeedback.mediumImpact();
    final cart = context.read<CartProvider>();
    final items = order.items;

    int addedCount = 0;
    for (var item in items) {
      try {
        final String medicineId = (item['medicineId'] ?? item['id'] ?? item['productId'] ?? item['sku'] ?? '').toString();
        final String name = item['name'] ?? 'Medicine';
        final String brand = item['brand'] ?? '';
        final double price = num.tryParse((item['unitPrice'] ?? item['price'] ?? 0).toString())?.toDouble() ?? 0.0;
        final double mrp = num.tryParse((item['mrp'] ?? price).toString())?.toDouble() ?? price;
        
        final product = ProductModel(
          id: medicineId,
          name: name,
          brand: brand,
          price: price,
          mrp: mrp,
          imageUrl: item['imageUrl'] ?? 'https://picsum.photos/seed/$medicineId/300/300',
          category: item['category']?.toString() ?? 'General',
        );

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
          content: Row(
            children: [
              const Icon(LucideIcons.shoppingCart, color: Colors.white, size: 16),
              const SizedBox(width: 12),
              Text(
                '$addedCount ITEMS ADDED TO CART',
                style: GoogleFonts.outfit(fontWeight: FontWeight.w900, fontSize: 10, color: Colors.white),
              ),
            ],
          ),
          backgroundColor: SahimedColors.primary,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          margin: const EdgeInsets.all(20),
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
        centerTitle: false,
        leadingWidth: 64,
        leading: Padding(
          padding: const EdgeInsets.only(left: 16),
          child: Center(
            child: Container(
              decoration: BoxDecoration(
                color: const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(14),
              ),
              child: IconButton(
                icon: const Icon(LucideIcons.arrowLeft, color: Color(0xFF0F172A), size: 20),
                onPressed: () => Navigator.pop(context),
              ),
            ),
          ),
        ),
        title: Text(
          'ORDER HISTORY',
          style: GoogleFonts.outfit(
            fontWeight: FontWeight.w900,
            fontSize: 18,
            color: const Color(0xFF0F172A),
            letterSpacing: -0.5,
          ),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _loadOrders,
        color: SahimedColors.primary,
        backgroundColor: Colors.white,
        strokeWidth: 3,
        child: _isLoading
            ? _buildLoadingState()
            : _error != null
                ? _buildErrorState()
                : _orders.isEmpty
                    ? _buildEmptyState()
                    : _buildOrdersList(),
      ),
    );
  }

  Widget _buildLoadingState() {
    return ListView.builder(
      padding: const EdgeInsets.all(20),
      itemCount: 5,
      itemBuilder: (context, index) => Container(
        height: 120,
        margin: const EdgeInsets.only(bottom: 20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(28),
          border: Border.all(color: const Color(0xFFF1F5F9)),
        ),
        child: const Center(
          child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFFE2E8F0)),
        ),
      ),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: const BoxDecoration(color: Color(0xFFFFF1F2), shape: BoxShape.circle),
              child: const Icon(LucideIcons.circleAlert, size: 40, color: SahimedColors.rose500),
            ),
            const SizedBox(height: 24),
            Text(
              'COULDN\'T LOAD ORDERS',
              style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w900, color: const Color(0xFF0F172A)),
            ),
            const SizedBox(height: 8),
            Text(
              _error ?? 'Check your internet connection and try again.',
              textAlign: TextAlign.center,
              style: GoogleFonts.inter(fontSize: 14, color: SahimedColors.slate500),
            ),
            const SizedBox(height: 32),
            SizedBox(
              width: 160,
              height: 50,
              child: ElevatedButton(
                onPressed: _loadOrders,
                style: ElevatedButton.styleFrom(
                  backgroundColor: SahimedColors.primary,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(100)),
                  elevation: 0,
                ),
                child: Text(
                  'RETRY',
                  style: GoogleFonts.outfit(fontWeight: FontWeight.w900, fontSize: 12, letterSpacing: 1),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(32),
            decoration: const BoxDecoration(color: Color(0xFFF1F5F9), shape: BoxShape.circle),
            child: const Icon(LucideIcons.package, size: 64, color: Color(0xFFCBD5E1)),
          ),
          const SizedBox(height: 32),
          Text(
            'NO ORDERS YET',
            style: GoogleFonts.outfit(fontSize: 22, fontWeight: FontWeight.w900, color: const Color(0xFF0F172A)),
          ),
          const SizedBox(height: 12),
          Text(
            'Looks like you haven\'t ordered anything yet.',
            style: GoogleFonts.inter(fontSize: 14, color: SahimedColors.slate500),
          ),
          const SizedBox(height: 40),
          SizedBox(
            width: 200,
            height: 56,
            child: ElevatedButton(
              onPressed: () => Navigator.pop(context),
              style: ElevatedButton.styleFrom(
                backgroundColor: SahimedColors.primary,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(100)),
                elevation: 8,
                shadowColor: SahimedColors.primary.withOpacity(0.4),
              ),
              child: Text(
                'START SHOPPING',
                style: GoogleFonts.outfit(fontWeight: FontWeight.w900, fontSize: 13, letterSpacing: 1),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOrdersList() {
    return ListView.builder(
      padding: const EdgeInsets.all(20),
      itemCount: _orders.length,
      itemBuilder: (ctx, i) {
        final order = _orders[i];
        return _buildOrderCard(order);
      },
    );
  }

  Widget _buildOrderCard(OrderModel order) {
    final status = order.status;
    final isDelivered = status.toLowerCase().contains('delivered');
    final isCancelled = status.toLowerCase().contains('cancelled') || status.toLowerCase().contains('failed');

    Color statusColor;
    Color statusBg;
    if (isDelivered) {
      statusColor = const Color(0xFF10B981);
      statusBg = const Color(0xFFDCFCE7);
    } else if (isCancelled) {
      statusColor = const Color(0xFFEF4444);
      statusBg = const Color(0xFFFFF1F2);
    } else {
      statusColor = SahimedColors.primary;
      statusBg = const Color(0xFFEFF6FF);
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(32),
        border: Border.all(color: const Color(0xFFF1F5F9)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: InkWell(
        onTap: () {
          HapticFeedback.lightImpact();
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => OrderDetailScreen(order: order),
            ),
          );
        },
        borderRadius: BorderRadius.circular(32),
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(20),
              child: Row(
                children: [
                  Container(
                    width: 56,
                    height: 56,
                    decoration: BoxDecoration(
                      color: statusBg,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Icon(
                      isDelivered ? LucideIcons.circleCheck : (isCancelled ? LucideIcons.circleX : LucideIcons.package),
                      color: statusColor,
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
                            fontSize: 22,
                            fontWeight: FontWeight.w900,
                            color: const Color(0xFF0F172A),
                            letterSpacing: -0.5,
                          ),
                        ),
                        if (!isDelivered && !isCancelled) ...[
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              const Icon(LucideIcons.truck, size: 10, color: Color(0xFF10B981)),
                              const SizedBox(width: 4),
                              Text(
                                _calculateEDDString(order),
                                style: GoogleFonts.outfit(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w900,
                                  color: const Color(0xFF10B981),
                                  letterSpacing: 0.5,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: statusBg,
                      borderRadius: BorderRadius.circular(100),
                    ),
                    child: Text(
                      status.toUpperCase(),
                      style: GoogleFonts.outfit(
                        fontSize: 8,
                        fontWeight: FontWeight.w900,
                        color: statusColor,
                        letterSpacing: 1,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            Container(
              height: 1,
              margin: const EdgeInsets.symmetric(horizontal: 20),
              color: const Color(0xFFF1F5F9),
            ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Icon(LucideIcons.package, size: 14, color: SahimedColors.slate400),
                      const SizedBox(width: 6),
                      Text(
                        '${order.items.length} ITEMS',
                        style: GoogleFonts.outfit(
                          fontSize: 10,
                          fontWeight: FontWeight.w900,
                          color: SahimedColors.slate400,
                          letterSpacing: 1,
                        ),
                      ),
                    ],
                  ),
                  Row(
                    children: [
                      SizedBox(
                        height: 36,
                        child: TextButton(
                          onPressed: () => _reorder(order),
                          style: TextButton.styleFrom(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            backgroundColor: SahimedColors.primary,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(100),
                            ),
                          ),
                          child: Text(
                            'RE-ORDER',
                            style: GoogleFonts.outfit(
                              fontSize: 9,
                              fontWeight: FontWeight.w900,
                              color: Colors.white,
                              letterSpacing: 1,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      const Icon(
                        LucideIcons.chevronRight,
                        size: 20,
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

  String _calculateEDDString(OrderModel order) {
    if (order.expectedDeliveryDate != null) {
      try {
        final date = DateTime.parse(order.expectedDeliveryDate!);
        return 'EST. DELIVERY BY ${DateFormat('MMM dd EEEE').format(date)}'.toUpperCase();
      } catch (_) {}
    }

    // Heuristic:
    // Pincode starts with 56 (Bengaluru): +2 days
    // Pincode starts with 5 or 6 (South India): +4 days
    // Others: +6 days
    final pincode = (order.shippingDetails['pincode'] ?? '000000').toString();
    int daysToAdd = 6;
    if (pincode.startsWith('56')) {
      daysToAdd = 2;
    } else if (pincode.startsWith('5') || pincode.startsWith('6')) {
      daysToAdd = 4;
    }

    final edd = order.createdAt.add(Duration(days: daysToAdd));
    return 'EST. DELIVERY BY ${DateFormat('MMM dd EEEE').format(edd)}'.toUpperCase();
  }
}
