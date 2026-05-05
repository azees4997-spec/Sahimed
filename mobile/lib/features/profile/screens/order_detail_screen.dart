import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/theme/colors.dart';
import '../../../shared/models/models.dart';

class OrderDetailScreen extends StatelessWidget {
  final OrderModel order;
  const OrderDetailScreen({super.key, required this.order});

  @override
  Widget build(BuildContext context) {
    final status = order.status;
    final items = order.items;
    final billing = order.billingBreakdown;
    final shipping = order.shippingDetails;
    // We don't have a reliable date in the model yet, so we'll use now for placeholder or omit
    final orderDate = DateTime.now(); 
    final prescription = order.prescriptionUrls.isNotEmpty ? order.prescriptionUrls.first : null;

    return Scaffold(
      backgroundColor: Colors.white,
      body: CustomScrollView(
        slivers: [
          _buildSliverAppBar(context, status),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (orderDate != null) ...[
                    Text(
                      'PLACED ON ${orderDate.day} ${_getMonth(orderDate.month)} ${orderDate.year}',
                      style: GoogleFonts.outfit(
                        fontSize: 10,
                        fontWeight: FontWeight.w900,
                        color: SahimedColors.slate400,
                        letterSpacing: 1,
                      ),
                    ),
                    const SizedBox(height: 12),
                  ],
                  _buildOrderStepper(status),
                  const SizedBox(height: 32),

                  _buildSectionHeader('CUSTOMER DETAILS', LucideIcons.user),
                  _buildCustomerInfo(order),
                  const SizedBox(height: 32),

                  _buildSectionHeader('DELIVERY ADDRESS', LucideIcons.mapPin),
                  _buildAddressInfo(shipping),
                  const SizedBox(height: 32),

                  if (prescription != null) ...[
                    _buildSectionHeader('PRESCRIPTION', LucideIcons.fileText),
                    _buildPrescriptionCard(prescription.toString()),
                    const SizedBox(height: 32),
                  ],

                  if (order.awbNumber != null) ...[
                    _buildSectionHeader('TRACKING INFORMATION', LucideIcons.truck),
                    _buildTrackingInfo(order.awbNumber!, order.carrierId ?? 'Shipway'),
                    const SizedBox(height: 32),
                  ],

                  _buildSectionHeader(
                    'ORDERED ITEMS',
                    LucideIcons.clipboardList,
                  ),
                  _buildItemsList(items),
                  const SizedBox(height: 32),

                  _buildSectionHeader('BILLING SUMMARY', LucideIcons.receipt),
                  _buildBillingSummary(billing, order.totalAmount, order.paymentType),
                  const SizedBox(height: 48),

                  _buildCloseButton(context),
                  const SizedBox(height: 40),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _getMonth(int m) {
    return ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'][m - 1];
  }

  Widget _buildSliverAppBar(BuildContext context, String status) {
    return SliverAppBar(
      expandedHeight: 200,
      pinned: true,
      backgroundColor: SahimedColors.primary,
      elevation: 0,
      leading: IconButton(
        icon: const Icon(LucideIcons.arrowLeft, color: Colors.white),
        onPressed: () => Navigator.pop(context),
      ),
      flexibleSpace: FlexibleSpaceBar(
        background: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [SahimedColors.primary, Color(0xFF0EA5E9)],
            ),
          ),
          child: Stack(
            children: [
              Positioned(
                right: -20,
                bottom: -20,
                child: Icon(
                  LucideIcons.receipt,
                  size: 200,
                  color: Colors.white.withOpacity(0.1),
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.end,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: Colors.white.withOpacity(0.3),
                        ),
                      ),
                      child: Text(
                        status.toUpperCase(),
                        style: GoogleFonts.outfit(
                          fontSize: 9,
                          fontWeight: FontWeight.w900,
                          color: Colors.white,
                          letterSpacing: 1.5,
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'ORDER DETAILS',
                      style: GoogleFonts.outfit(
                        fontSize: 28,
                        fontWeight: FontWeight.w900,
                        color: Colors.white,
                        letterSpacing: -0.5,
                      ),
                    ),
                    Text(
                      'ID: #${(order.orderId ?? order.id).toUpperCase()}',
                      style: GoogleFonts.outfit(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: Colors.white.withOpacity(0.7),
                        letterSpacing: 1,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title, IconData icon) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        children: [
          Icon(icon, size: 16, color: SahimedColors.slate400),
          const SizedBox(width: 8),
          Text(
            title,
            style: GoogleFonts.outfit(
              fontSize: 10,
              fontWeight: FontWeight.w900,
              color: SahimedColors.slate400,
              letterSpacing: 2,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCustomerInfo(OrderModel order) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFF1F5F9)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            order.patientName,
            style: GoogleFonts.outfit(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: const Color(0xFF0F172A),
            ),
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              const Icon(
                LucideIcons.phone,
                size: 14,
                color: SahimedColors.slate400,
              ),
              const SizedBox(width: 8),
              Text(
                order.phoneNumber,
                style: GoogleFonts.inter(
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                  color: SahimedColors.slate500,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTrackingInfo(String awb, String courier) {
    final trackingUrl = 'https://sahimed.shipway.in/$awb';

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: SahimedColors.primary.withOpacity(0.05),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: SahimedColors.primary.withOpacity(0.1)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'AWB NUMBER',
                    style: GoogleFonts.outfit(
                      fontSize: 10,
                      fontWeight: FontWeight.w900,
                      color: SahimedColors.slate400,
                      letterSpacing: 1,
                    ),
                  ),
                  Text(
                    awb,
                    style: GoogleFonts.outfit(
                      fontSize: 18,
                      fontWeight: FontWeight.w900,
                      color: SahimedColors.primary,
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: SahimedColors.primary.withOpacity(0.2)),
                ),
                child: Text(
                  courier.toUpperCase(),
                  style: GoogleFonts.outfit(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: SahimedColors.primary,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: () async {
                final uri = Uri.parse(trackingUrl);
                if (await canLaunchUrl(uri)) {
                  await launchUrl(uri, mode: LaunchMode.externalApplication);
                }
              },
              icon: const Icon(LucideIcons.externalLink, size: 16),
              label: Text(
                'TRACK SHIPMENT',
                style: GoogleFonts.outfit(
                  fontWeight: FontWeight.w900,
                  fontSize: 12,
                  letterSpacing: 1,
                ),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: SahimedColors.primary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                elevation: 0,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAddressInfo(Map shipping) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFF1F5F9)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '${shipping['houseNumber']}, ${shipping['apartmentName'] ?? ''}',
            style: GoogleFonts.inter(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: const Color(0xFF0F172A),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            '${shipping['street']}, ${shipping['city']}, ${shipping['state']} - ${shipping['pincode']}',
            style: GoogleFonts.inter(
              fontSize: 13,
              color: SahimedColors.slate500,
              height: 1.4,
            ),
          ),
          if (shipping['landmark'] != null) ...[
            const SizedBox(height: 8),
            Text(
              'NEAR: ${shipping['landmark']}',
              style: GoogleFonts.outfit(
                fontSize: 10,
                fontWeight: FontWeight.w900,
                color: SahimedColors.primary,
                letterSpacing: 1,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildItemsList(List items) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFF1F5F9)),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 20),
        ],
      ),
      child: Column(
        children: [
          // BUG-10 FIX: Added dividers between items for visual separation
          ...items.asMap().entries.map((entry) {
            final index = entry.key;
            final item = entry.value;
            return Column(
              children: [
                Padding(
                  padding: const EdgeInsets.all(20),
                  child: Row(
                    children: [
                      Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          color: const Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(
                          LucideIcons.pill,
                          color: SahimedColors.primary,
                          size: 20,
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              item['name'] ?? 'Medicine',
                              style: GoogleFonts.outfit(
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                                color: const Color(0xFF0F172A),
                              ),
                            ),
                            Text(
                              '${item['quantity'] ?? 1} UNITS',
                              style: GoogleFonts.outfit(
                                fontSize: 10,
                                fontWeight: FontWeight.w900,
                                color: SahimedColors.slate400,
                                letterSpacing: 1,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Text(
                        () {
                          final price = num.tryParse(item['unitPrice']?.toString() ?? '0') ?? 0;
                          final qty = num.tryParse(item['quantity']?.toString() ?? '1') ?? 1;
                          return '₹${(price * qty).toStringAsFixed(0)}';
                        }(),
                        style: GoogleFonts.outfit(
                          fontSize: 14,
                          fontWeight: FontWeight.w900,
                          color: const Color(0xFF0F172A),
                        ),
                      ),
                    ],
                  ),
                ),
                if (index < items.length - 1)
                  const Divider(height: 1, indent: 20, endIndent: 20),
              ],
            );
          }),
        ],
      ),
    );
  }

  Widget _buildPrescriptionCard(String url) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFF1F5F9)),
      ),
      child: Column(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(16),
            child: Image.network(
              url,
              height: 120,
              width: double.infinity,
              fit: BoxFit.cover,
              errorBuilder: (ctx, _, __) => Container(
                height: 120,
                color: SahimedColors.slate100,
                child: const Icon(LucideIcons.fileImage, color: SahimedColors.slate300),
              ),
            ),
          ),
          const SizedBox(height: 12),
          TextButton.icon(
            onPressed: () => launchUrl(Uri.parse(url)),
            icon: const Icon(LucideIcons.maximize2, size: 14),
            label: Text(
              'VIEW FULL PRESCRIPTION',
              style: GoogleFonts.outfit(
                fontSize: 10,
                fontWeight: FontWeight.w900,
                letterSpacing: 1,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBillingSummary(Map billing, dynamic total, String paymentType) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: SahimedColors.primary.withOpacity(0.05),
        borderRadius: BorderRadius.circular(32),
        border: Border.all(color: SahimedColors.primary.withOpacity(0.1)),
      ),
      child: Column(
        children: [
          _buildBillRow(
            'Item Total',
            '₹${(billing['grossMrp'] ?? total).toStringAsFixed(0)}',
            false,
          ),
          const SizedBox(height: 12),
          _buildBillRow(
            'Total Discount',
            '-₹${(billing['campaignDiscount'] ?? 0).toStringAsFixed(0)}',
            true,
          ),
          const SizedBox(height: 12),
          _buildBillRow('Delivery Charges', 'FREE', true),
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 20),
            child: Divider(
              color: SahimedColors.primary,
              thickness: 0.5,
              indent: 0,
              endIndent: 0,
            ),
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'TOTAL AMOUNT',
                    style: GoogleFonts.outfit(
                      fontSize: 14,
                      fontWeight: FontWeight.w900,
                      color: const Color(0xFF0F172A),
                      letterSpacing: 1,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: SahimedColors.primary,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      paymentType.toUpperCase(),
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
              Text(
                '₹${total.toStringAsFixed(0)}',
                style: GoogleFonts.outfit(
                  fontSize: 24,
                  fontWeight: FontWeight.w900,
                  color: SahimedColors.primary,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildBillRow(String label, String value, bool isHighlight) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: GoogleFonts.outfit(
            fontSize: 12,
            fontWeight: FontWeight.bold,
            color: SahimedColors.slate500,
          ),
        ),
        Text(
          value,
          style: GoogleFonts.outfit(
            fontSize: 12,
            fontWeight: FontWeight.w900,
            color: isHighlight
                ? const Color(0xFF16A34A)
                : const Color(0xFF0F172A),
          ),
        ),
      ],
    );
  }

  Widget _buildCloseButton(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 64,
      child: ElevatedButton(
        onPressed: () => Navigator.pop(context),
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF0F172A),
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(32),
          ),
        ),
        child: Text(
          'CLOSE DETAILS',
          style: GoogleFonts.outfit(
            fontSize: 14,
            fontWeight: FontWeight.w900,
            letterSpacing: 1.5,
          ),
        ),
      ),
    );
  }

  Widget _buildOrderStepper(String status) {
    // Standardize status
    final currentStatus = status.toLowerCase();
    final steps = [
      {'label': 'Confirmed', 'icon': LucideIcons.check},
      {'label': 'Packed', 'icon': LucideIcons.package},
      {'label': 'Shipped', 'icon': LucideIcons.truck},
      {'label': 'Delivered', 'icon': LucideIcons.house},
    ];

    int activeIndex = 0;
    if (currentStatus.contains('pack')) activeIndex = 1;
    if (currentStatus.contains('ship') || currentStatus.contains('out')) {
      activeIndex = 2;
    }
    if (currentStatus.contains('deliver')) activeIndex = 3;

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: List.generate(steps.length, (index) {
        final isActive = index <= activeIndex;
        final isLast = index == steps.length - 1;

        return Expanded(
          flex: isLast ? 0 : 1,
          child: Row(
            children: [
              Column(
                children: [
                  Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      color: isActive
                          ? SahimedColors.primary
                          : const Color(0xFFF1F5F9),
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: isActive
                            ? SahimedColors.primary
                            : const Color(0xFFE2E8F0),
                        width: 2,
                      ),
                    ),
                    child: Icon(
                      steps[index]['icon'] as IconData,
                      size: 14,
                      color: isActive ? Colors.white : SahimedColors.slate400,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    steps[index]['label'] as String,
                    style: GoogleFonts.outfit(
                      fontSize: 8,
                      fontWeight: FontWeight.w900,
                      color: isActive
                          ? SahimedColors.primary
                          : SahimedColors.slate400,
                      letterSpacing: 0.5,
                    ),
                  ),
                ],
              ),
              if (!isLast)
                Expanded(
                  child: Container(
                    height: 2,
                    margin: const EdgeInsets.only(
                      bottom: 24,
                      left: 4,
                      right: 4,
                    ),
                    color: index < activeIndex
                        ? SahimedColors.primary
                        : const Color(0xFFF1F5F9),
                  ),
                ),
            ],
          ),
        );
      }),
    );
  }
}
