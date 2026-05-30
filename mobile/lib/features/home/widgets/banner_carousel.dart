import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../core/theme/colors.dart';

// --- Read-cost optimisation ---
// Banners change rarely. Cache the result in-memory for 1 hour so every
// active app user doesn't hold a permanent Firestore snapshot listener.
List<Map<String, dynamic>>? _cachedBanners;
DateTime? _bannersCachedAt;
const _bannerCacheDuration = Duration(hours: 1);

class BannerCarousel extends StatefulWidget {
  const BannerCarousel({super.key});

  @override
  State<BannerCarousel> createState() => _BannerCarouselState();
}

class _BannerCarouselState extends State<BannerCarousel> {
  final PageController _pageController = PageController(viewportFraction: 0.92);

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  Future<List<Map<String, dynamic>>> _fetchBanners() async {
    // Return cache if still fresh
    if (_cachedBanners != null &&
        _bannersCachedAt != null &&
        DateTime.now().difference(_bannersCachedAt!) < _bannerCacheDuration) {
      return _cachedBanners!;
    }
    final snap = await FirebaseFirestore.instance
        .collection('banners')
        .where('isActive', isEqualTo: true)
        .orderBy('order', descending: false)
        .get();                              // ← one-time GET, not snapshots()
    _cachedBanners = snap.docs.map((d) => {...d.data(), 'id': d.id}).toList();
    _bannersCachedAt = DateTime.now();
    return _cachedBanners!;
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<Map<String, dynamic>>>(
      future: _fetchBanners(),
      builder: (context, snapshot) {
        if (!snapshot.hasData || (snapshot.data as List).isEmpty) {
          // Fallback gradient banner when no Firestore data
          return Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Container(
              height: 180,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [SahimedColors.primary, SahimedColors.accent],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(28),
                boxShadow: [
                  BoxShadow(
                    color: SahimedColors.primary.withValues(alpha: 0.3),
                    blurRadius: 20,
                    offset: const Offset(0, 10),
                  ),
                ],
              ),
              child: Stack(
                children: [
                  Positioned(
                    right: -20,
                    top: -20,
                    child: Container(
                      width: 120,
                      height: 120,
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.1),
                        shape: BoxShape.circle,
                      ),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.all(28),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          'AFFORDABLE HEALTHCARE',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w900,
                            color: Colors.white.withValues(alpha: 0.7),
                            letterSpacing: 2,
                          ),
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'Pan India\nFree Delivery\nAbove ₹499',
                          style: TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.w900,
                            color: Colors.white,
                            height: 1.1,
                            letterSpacing: -0.5,
                          ),
                        ),
                        const SizedBox(height: 16),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 8,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(100),
                          ),
                          child: const Text(
                            'SHOP NOW',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w900,
                              color: SahimedColors.primary,
                              letterSpacing: 1.5,
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

        final banners = snapshot.data!;
        return SizedBox(
          height: 180,
          child: PageView.builder(
            controller: _pageController,
            itemCount: banners.length,
            itemBuilder: (context, index) {
              final banner = banners[index];
              return Padding(
                padding: EdgeInsets.only(
                  left: index == 0 ? 20 : 8,
                  right: index == banners.length - 1 ? 20 : 8,
                ),
                child: Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(28),
                    boxShadow: [
                      BoxShadow(
                        color: SahimedColors.primary.withValues(alpha: 0.1),
                        blurRadius: 20,
                        offset: const Offset(0, 10),
                      ),
                    ],
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(28),
                    child: CachedNetworkImage(
                      imageUrl: banner['imageUrl'] ?? '',
                      fit: BoxFit.cover,
                      errorWidget: (context, url, error) =>
                          Container(color: SahimedColors.sahiBlue),
                    ),
                  ),
                ),
              );
            },
          ),
        );
      },
    );
  }
}
