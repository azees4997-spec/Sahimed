import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../../shared/models/models.dart';

class ApiService {
  // Use 10.0.2.2 for Android emulator, or your LAN IP for a physical device
  // static const String baseUrl = 'http://10.0.2.2:9002/api';
  static const String baseUrl = 'https://sahimed.com/api';

  Future<List<CategoryModel>> getCategories() async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/categories?limit=12'));
      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.map((item) => CategoryModel.fromJson(item)).toList();
      }
    } catch (e) {
      debugPrint('Error fetching categories: $e');
    }
    return [];
  }

  Future<List<ProductModel>> getProducts({bool isBestSeller = false}) async {
    try {
      String url = '$baseUrl/products?limit=20';
      if (isBestSeller) url += '&isBestSeller=true';
      final response = await http.get(Uri.parse(url));
      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.map((item) => ProductModel.fromJson(item)).toList();
      }
    } catch (e) {
      debugPrint('Error fetching products: $e');
    }
    return [];
  }

  Future<List<ProductModel>> getProductsByCategory(String categoryId) async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/products?category=$categoryId&limit=50'));
      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.map((item) => ProductModel.fromJson(item)).toList();
      }
    } catch (e) {
      debugPrint('Error fetching products by category: $e');
    }
    return [];
  }

  Future<ProductModel?> getGenericAlternative(String moleculeId) async {
    try {
      // Fetch products with the same moleculeId that are marked as generic
      final response = await http.get(Uri.parse('$baseUrl/products/molecule/$moleculeId?isGeneric=true&limit=1'));
      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        if (data.isNotEmpty) {
          return ProductModel.fromJson(data.first);
        }
      }
    } catch (e) {
      debugPrint('Error fetching generic alternative: $e');
    }
    return null;
  }

  Future<List<ProductModel>> searchProducts(String query) async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/products/search?q=$query&limit=20'));
      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.map((item) => ProductModel.fromJson(item)).toList();
      }
    } catch (e) {
      debugPrint('Error searching products: $e');
    }
    return [];
  }

  Future<List<BannerModel>> getBanners() async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/banners'));
      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.map((item) => BannerModel.fromJson(item)).toList();
      }
    } catch (e) {
      debugPrint('Error fetching banners: $e');
    }
    return [];
  }

  Future<bool> createOrder({
    required List<CartItem> items,
    required double total,
    required String address,
    required String name,
    required String phone,
  }) async {
    try {
      final orderData = {
        'items': items.map((item) => {
          'productId': item.product.id,
          'quantity': item.quantity,
          'price': item.product.price,
        }).toList(),
        'totalAmount': total,
        'shippingAddress': address,
        'customerName': name,
        'customerPhone': phone,
        'paymentMethod': 'COD',
        'status': 'Pending',
        'createdAt': DateTime.now().toIso8601String(),
      };

      final response = await http.post(
        Uri.parse('$baseUrl/orders'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode(orderData),
      );

      return response.statusCode == 201 || response.statusCode == 200;
    } catch (e) {
      debugPrint('Error creating order: $e');
      return false;
    }
  }
}
