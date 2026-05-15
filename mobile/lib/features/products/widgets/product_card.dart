import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/colors.dart';
import '../../../core/providers/cart_provider.dart';
import '../../../core/services/api_service.dart';
import '../../../shared/models/models.dart';
import '../screens/product_detail_screen.dart';


class SahimedProductCard extends StatelessWidget {
  final ProductModel product;
  const SahimedProductCard({super.key, required this.product});

  @override
  Widget build(BuildContext context) {
    final cart = context.watch<CartProvider>();
    final inCart = cart.items.any((i) => i.product.id == product.id);
    final qty = inCart
        ? cart.items.firstWhere((i) => i.product.id == product.id).quantity
        : 0;
    
    final savingsPct = product.mrp > product.price
        ? ((product.mrp - product.price) / product.mrp * 100).round()
        : 0;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFF1F5F9)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x08000000),
            blurRadius: 12,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Navigation wrapper for image and info slots
          GestureDetector(
            onTap: () {
              HapticFeedback.lightImpact();
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => ProductDetailScreen(product: product),
                ),
              );
            },
            behavior: HitTestBehavior.opaque,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // 1. Image slot (Fixed Height)
                Container(
                  height: 90,
                  width: double.infinity,
                  decoration: const BoxDecoration(
                    color: Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
                  ),
                  child: Stack(
                    children: [
                      ClipRRect(
                        borderRadius: const BorderRadius.vertical(
                          top: Radius.circular(20),
                        ),
                        child: Hero(
                          tag: 'prod_${product.id}',
                          child: Center(
                            child: CachedNetworkImage(
                              imageUrl: product.imageUrl,
                              width: 70,
                              height: 70,
                              fit: BoxFit.contain,
                              errorWidget: (c, u, e) => const Icon(
                                Icons.medication_rounded,
                                color: SahimedColors.primary,
                                size: 28,
                              ),
                            ),
                          ),
                        ),
                      ),
                      if (savingsPct > 0)
                        Positioned(
                          top: 0,
                          left: 10,
                          child: Column(
                            children: [
                              Container(
                                width: 20,
                                height: 28,
                                decoration: BoxDecoration(
                                  gradient: LinearGradient(
                                    begin: Alignment.topCenter,
                                    end: Alignment.bottomCenter,
                                    colors: (product.isGeneric == true)
                                        ? [const Color(0xFF00D991), const Color(0xFF008C5D)]
                                        : [const Color(0xFFFF3B8E), const Color(0xFFCC0044)],
                                  ),
                                  borderRadius: const BorderRadius.vertical(top: Radius.circular(2)),
                                ),
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Text(
                                      'OFF',
                                      style: GoogleFonts.outfit(
                                        fontSize: 4.5,
                                        fontWeight: FontWeight.w900,
                                        color: Colors.white,
                                        letterSpacing: 0.5,
                                        shadows: [
                                          const Shadow(
                                            color: Colors.black26,
                                            offset: Offset(0, 1),
                                            blurRadius: 1,
                                          ),
                                        ],
                                      ),
                                    ),
                                    Text(
                                      '$savingsPct%',
                                      style: GoogleFonts.outfit(
                                        fontSize: 8,
                                        fontWeight: FontWeight.w900,
                                        color: Colors.white,
                                        height: 1,
                                        shadows: [
                                          const Shadow(
                                            color: Colors.black26,
                                            offset: Offset(0, 1),
                                            blurRadius: 1,
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              ClipPath(
                                clipper: _SerratedClipper(),
                                child: Container(
                                  width: 20,
                                  height: 4,
                                  color: (product.isGeneric == true)
                                      ? const Color(0xFF008C5D)
                                      : const Color(0xFFCC0044),
                                ),
                              ),
                            ],
                          ),
                        ),
                    ],
                  ),
                ),
      
                // 2. Info area - Unified sizing slots
                Padding(
                  padding: const EdgeInsets.fromLTRB(10, 8, 10, 0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Slot 1: Badge Slot (Fixed height)
                      SizedBox(
                        height: 14,
                        child: product.isGeneric
                            ? Container(
                                padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                                decoration: BoxDecoration(
                                  color: SahimedColors.primary.withAlpha(25),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  'SAHI RECOMMENDED',
                                  style: GoogleFonts.outfit(
                                    fontSize: 6,
                                    fontWeight: FontWeight.w900,
                                    color: SahimedColors.primary,
                                    letterSpacing: 0.5,
                                  ),
                                ),
                              )
                            : null,
                      ),
                      const SizedBox(height: 3),
      
                      // Slot 2: Name Slot (Fixed 2 lines)
                      SizedBox(
                        height: 26,
                        child: Text(
                          product.name.toUpperCase(),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: GoogleFonts.outfit(
                            fontSize: 10,
                            fontWeight: FontWeight.w900,
                            color: const Color(0xFF0F172A),
                            height: 1.1,
                            letterSpacing: -0.2,
                          ),
                        ),
                      ),
      
                      // Slot 3: Molecule Slot (Fixed height)
                      SizedBox(
                        height: 10,
                        child: product.saltComposition != null
                            ? Text(
                                product.saltComposition!.toUpperCase(),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: GoogleFonts.outfit(
                                  fontSize: 7,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.blue.shade800,
                                  letterSpacing: 0.2,
                                ),
                              )
                            : null,
                      ),
      
                      // Slot 4: Pack Slot
                      SizedBox(
                        height: 9,
                        child: product.packSize != null
                            ? Text(
                                product.packSize!.toUpperCase(),
                                style: GoogleFonts.outfit(
                                  fontSize: 7,
                                  fontWeight: FontWeight.w800,
                                  color: const Color(0xFF94A3B8),
                                  letterSpacing: 0.3,
                                ),
                              )
                            : null,
                      ),
                      const SizedBox(height: 6),
      
                      // Slot 5: Price Row
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            '₹${product.price.toStringAsFixed(0)}',
                            style: GoogleFonts.outfit(
                              fontSize: 14,
                              fontWeight: FontWeight.w900,
                              color: const Color(0xFF0F172A),
                              height: 1,
                            ),
                          ),
                          if (product.mrp > product.price) ...[
                            const SizedBox(width: 4),
                            Text(
                              '₹${product.mrp.toStringAsFixed(0)}',
                              style: GoogleFonts.outfit(
                                fontSize: 8,
                                fontWeight: FontWeight.bold,
                                color: const Color(0xFF94A3B8),
                                decoration: TextDecoration.lineThrough,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Slot 6: Full-width ADD Button (Independent hit area)
          Padding(
            padding: const EdgeInsets.fromLTRB(10, 8, 10, 10),
            child: GestureDetector(
              onTap: product.availableQuantity > 0 
                ? () {
                    HapticFeedback.mediumImpact();
                    context.read<CartProvider>().addItem(product);
                  }
                : () async {
                    final success = await ApiService().submitStockAlert(product.id);
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(success ? "We'll notify you when ${product.name} is back!" : "Failed to set alert."),
                          backgroundColor: success ? SahimedColors.primary : Colors.red,
                        ),
                      );
                    }
                  },
              child: Container(
                width: double.infinity,
                height: 28,
                decoration: BoxDecoration(
                  color: product.availableQuantity > 0 
                      ? SahimedColors.primary 
                      : const Color(0xFFFFF1F2),
                  borderRadius: BorderRadius.circular(8),
                  border: product.availableQuantity > 0 
                      ? null 
                      : Border.all(color: const Color(0xFFFFE4E6)),
                  boxShadow: product.availableQuantity > 0 ? [
                    BoxShadow(
                      color: SahimedColors.primary.withAlpha(50),
                      blurRadius: 8,
                      offset: const Offset(0, 3),
                    ),
                  ] : [],
                ),
                child: Center(
                  child: Text(
                    product.availableQuantity <= 0 
                        ? 'NOTIFY ME' 
                        : (qty > 0 ? 'ADDED ($qty)' : 'ADD TO CART'),
                    style: GoogleFonts.outfit(
                      fontSize: 8,
                      fontWeight: FontWeight.w900,
                      color: product.availableQuantity > 0 
                          ? Colors.white 
                          : const Color(0xFFE11D48),
                      letterSpacing: 0.5,
                    ),
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

class _SerratedClipper extends CustomClipper<Path> {
  @override
  Path getClip(Size size) {
    Path path = Path();
    double width = size.width;
    double height = size.height;
    double segment = width / 6;
    
    path.lineTo(0, 0);
    for (int i = 0; i < 6; i++) {
      path.lineTo(segment * i + (segment * 0.5), height);
      path.lineTo(segment * (i + 1), 0);
    }
    path.close();
    return path;
  }

  @override
  bool shouldReclip(CustomClipper<Path> oldClipper) => false;
}

