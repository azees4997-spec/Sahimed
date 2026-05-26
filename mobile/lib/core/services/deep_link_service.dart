import 'dart:async';
import 'package:app_links/app_links.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/navigation_provider.dart';
import '../../features/products/screens/product_detail_screen.dart';
import '../../features/products/screens/category_products_screen.dart';
import 'api_service.dart';
import '../../../main.dart'; // To access navigatorKey

class DeepLinkService {
  static final DeepLinkService _instance = DeepLinkService._internal();
  factory DeepLinkService() => _instance;
  DeepLinkService._internal();

  late AppLinks _appLinks;
  StreamSubscription<Uri>? _linkSubscription;

  void init() {
    _appLinks = AppLinks();
    _handleInitialLink();
    _linkSubscription = _appLinks.uriLinkStream.listen((uri) {
      debugPrint('DeepLink received: $uri');
      _processUri(uri);
    });
  }

  Future<void> _handleInitialLink() async {
    try {
      final uri = await _appLinks.getInitialLink();
      if (uri != null) {
        debugPrint('Initial DeepLink: $uri');
        // Wait for Splash to finish (2.8s in main.dart) + extra buffer
        Future.delayed(const Duration(milliseconds: 3500), () => _processUri(uri));
      }
    } catch (e) {
      debugPrint('Error handling initial link: $e');
    }
  }

  void _processUri(Uri uri) async {
    final path = uri.path;
    final context = navigatorKey.currentContext;
    if (context == null) return;

    // 1. Product Detail Page: /product/[id]
    if (path.startsWith('/product/')) {
      final productId = path.split('/').last;
      if (productId.isNotEmpty) {
        _navigateToProduct(productId);
      }
    } 
    // 2. Category Search Page: /search?c=[categoryName]
    else if (path == '/search' || path == '/categories') {
      final categoryName = uri.queryParameters['c'] ?? uri.queryParameters['category'];
      if (categoryName != null && categoryName.isNotEmpty) {
        _navigateToCategory(categoryName);
      }
    }
  }

  Future<void> _navigateToProduct(String id) async {
    try {
      // Show loading indicator if possible or just fetch
      final apiService = ApiService();
      final product = await apiService.getProductById(id);
      
      if (product != null && navigatorKey.currentState != null) {
        navigatorKey.currentState!.push(
          MaterialPageRoute(
            builder: (_) => ProductDetailScreen(product: product),
          ),
        );
      }
    } catch (e) {
      debugPrint('Error navigating to product: $e');
    }
  }

  Future<void> _navigateToCategory(String name) async {
    try {
      final apiService = ApiService();
      final category = await apiService.getCategoryByName(name);
      
      if (category != null && navigatorKey.currentState != null) {
        // First switch to Categories tab in MainLayout to keep state consistent
        final context = navigatorKey.currentContext;
        if (context != null) {
          context.read<NavigationProvider>().switchTab(1);
          
          // Then push the specific category products screen
          navigatorKey.currentState!.push(
            MaterialPageRoute(
              builder: (_) => CategoryProductsScreen(category: category),
            ),
          );
        }
      }
    } catch (e) {
      debugPrint('Error navigating to category: $e');
    }
  }

  void dispose() {
    _linkSubscription?.cancel();
  }
}
