import 'dart:convert';
import 'dart:io';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../../shared/models/models.dart';

class ApiService {
  static const String baseUrl = 'https://sahimed.com/api';
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;

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

  Future<List<ProductModel>> getProductsByCategory(String categoryId, {String? categoryName}) async {
    try {
      // First try with ID
      final response = await http.get(Uri.parse('$baseUrl/products?category=$categoryId&limit=50'));
      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        if (data.isNotEmpty) {
          return data.map((item) => ProductModel.fromJson(item)).toList();
        }
      }

      // If ID fails or is empty, try with Name (as per user hint)
      if (categoryName != null) {
        final nameResponse = await http.get(Uri.parse('$baseUrl/products?category=${Uri.encodeComponent(categoryName)}&limit=50'));
        if (nameResponse.statusCode == 200) {
          final List<dynamic> data = json.decode(nameResponse.body);
          return data.map((item) => ProductModel.fromJson(item)).toList();
        }
      }
    } catch (e) {
      debugPrint('Error fetching products by category: $e');
    }
    return [];
  }

  Future<ProductModel?> getGenericAlternative(String moleculeId) async {
    try {
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
      final response = await http.get(Uri.parse('$baseUrl/products?q=$query&limit=20'));
      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.map((item) => ProductModel.fromJson(item)).toList();
      }
    } catch (e) {
      debugPrint('Error searching products: $e');
    }
    return [];
  }

  Future<void> logSearch(String query, int resultsCount) async {
    try {
      final user = _auth.currentUser;
      await _firestore.collection('searchAnalytics').add({
        'query': query,
        'resultsCount': resultsCount,
        'userId': user?.uid,
        'timestamp': FieldValue.serverTimestamp(),
        'platform': 'mobile',
      });
    } catch (e) {
      debugPrint('Error logging search: $e');
    }
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

  Future<String?> uploadPrescription(File file) async {
    try {
      final request = http.MultipartRequest('POST', Uri.parse('$baseUrl/upload'));
      request.files.add(await http.MultipartFile.fromPath('file', file.path));
      
      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);
      
      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = json.decode(response.body);
        return data['url'];
      }
    } catch (e) {
      debugPrint('Error uploading prescription: $e');
    }
    return null;
  }

  Future<String?> createOrder({
    required List<CartItem> items,
    required double total,
    required String address,
    required String name,
    required String phone,
    required Map<String, dynamic> billingBreakdown,
    List<String> prescriptions = const [],
  }) async {
    try {
      final order = OrderModel(
        patientName: name,
        phoneNumber: phone,
        shippingDetails: {
          'address': address,
          'city': 'Unknown',
          'pincode': 'Unknown',
        },
        items: items.map((i) => {
          'productId': i.product.id,
          'name': i.product.name,
          'quantity': i.quantity,
          'price': i.product.price,
        }).toList(),
        totalAmount: total,
        billingBreakdown: billingBreakdown,
        imageUrls: prescriptions,
      );

      final response = await http.post(
        Uri.parse('$baseUrl/orders'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode(order.toJson()),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = json.decode(response.body);
        return data['orderId'];
      }
    } catch (e) {
      debugPrint('Error creating order: $e');
    }
    return null;
  }
  Future<List<Map<String, dynamic>>> getPages() async {
    try {
      final snapshot = await _firestore.collection('pages').get();
      return snapshot.docs.map((doc) => {...doc.data(), 'id': doc.id}).toList();
    } catch (e) {
      debugPrint('Error fetching pages: $e');
    }
    return [];
  }

  Future<Map<String, dynamic>?> getPageContent(String pageId) async {
    try {
      final doc = await _firestore.collection('pages').doc(pageId).get();
      if (doc.exists) {
        return {...doc.data()!, 'id': doc.id};
      }
    } catch (e) {
      debugPrint('Error fetching page $pageId: $e');
    }
    return null;
  }
}
