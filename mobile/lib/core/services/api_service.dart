import 'dart:convert';
import 'dart:io';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:flutter/foundation.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:http/http.dart' as http;
import '../../shared/models/models.dart';

class ApiService {
  static const String baseUrl = 'https://sahimed.com/api';
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseStorage _storage = FirebaseStorage.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  // --- Memory Caching Layer ---
  static final Map<String, dynamic> _cache = {};
  static final Map<String, DateTime> _cacheTime = {};
  static const Duration _cacheDuration = Duration(
    minutes: 30,
  ); // Extended cache

  dynamic _getCached(String key) {
    if (_cache.containsKey(key)) {
      final time = _cacheTime[key];
      if (time != null && DateTime.now().difference(time) < _cacheDuration) {
        return _cache[key];
      }
    }
    return null;
  }

  void _setCache(String key, dynamic data) {
    _cache[key] = data;
    _cacheTime[key] = DateTime.now();
  }

  Future<Map<String, String>> _getHeaders() async {
    final user = _auth.currentUser;
    final Map<String, String> headers = {'Content-Type': 'application/json'};
    if (user != null) {
      final token = await user.getIdToken();
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  Future<List<CategoryModel>> getCategories() async {
    final cached = _getCached('categories');
    if (cached != null) return cached;

    try {
      final response = await http.get(
        Uri.parse('$baseUrl/categories?limit=12'),
      );
      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        final list = data.map((item) => CategoryModel.fromJson(item)).toList();
        _setCache('categories', list);
        return list;
      }
    } catch (e) {
      debugPrint('Error fetching categories: $e');
    }
    return [];
  }

  Future<List<ProductModel>> getProducts({bool isBestSeller = false}) async {
    final cacheKey = 'products_${isBestSeller ? "bestseller" : "all"}';
    final cached = _getCached(cacheKey);
    if (cached != null) return List<ProductModel>.from(cached);

    try {
      String url = '$baseUrl/products?limit=20';
      if (isBestSeller) url += '&isBestSeller=true';
      final response = await http.get(Uri.parse(url));
      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        final list = data.map((item) => ProductModel.fromJson(item)).toList();
        _setCache(cacheKey, list);
        return list;
      }
    } catch (e) {
      debugPrint('Error fetching products: $e');
    }
    return [];
  }

  Future<List<ProductModel>> getProductsByCategory(
    String categoryId, {
    String? categoryName,
  }) async {
    final cacheKey = 'cat_products_$categoryId';
    final cached = _getCached(cacheKey);
    if (cached != null) return List<ProductModel>.from(cached);

    try {
      final encodedId = Uri.encodeComponent(categoryId);
      final response = await http.get(
        Uri.parse('$baseUrl/products?category=$encodedId&limit=50'),
      );
      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        if (data.isNotEmpty) {
          final list = data.map((item) => ProductModel.fromJson(item)).toList();
          _setCache(cacheKey, list);
          return list;
        }
      }

      if (categoryName != null) {
        final encodedName = Uri.encodeComponent(categoryName);
        final nameResponse = await http.get(
          Uri.parse(
            '$baseUrl/products?category=$encodedName&limit=50',
          ),
        );
        if (nameResponse.statusCode == 200) {
          final List<dynamic> data = json.decode(nameResponse.body);
          final list = data.map((item) => ProductModel.fromJson(item)).toList();
          _setCache(cacheKey, list);
          return list;
        }
      }
    } catch (e) {
      debugPrint('Error fetching products by category: $e');
    }
    return [];
  }

  Future<ProductModel?> getGenericAlternative(String moleculeId) async {
    final cacheKey = 'generic_$moleculeId';
    final cached = _getCached(cacheKey);
    if (cached != null) return cached;

    try {
      // Updated to match website search pattern: products?moleculeId=...&isGeneric=true
      final response = await http.get(
        Uri.parse(
          '$baseUrl/products?moleculeId=$moleculeId&isGeneric=true&limit=1',
        ),
      );
      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        if (data.isNotEmpty) {
          final product = ProductModel.fromJson(data.first);
          _setCache(cacheKey, product);
          return product;
        }
      }
    } catch (e) {
      debugPrint('Error fetching Sahi Recommended alternative: $e');
    }
    return null;
  }

  Future<List<ProductModel>> getGenericAlternatives(
    String moleculeId, {
    int limit = 5,
  }) async {
    try {
      final response = await http.get(
        Uri.parse(
          '$baseUrl/products?moleculeId=$moleculeId&isGeneric=true&limit=$limit',
        ),
      );
      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.map((item) => ProductModel.fromJson(item)).toList();
      }
    } catch (e) {
      debugPrint('Error fetching Sahi Recommended alternatives: $e');
    }
    return [];
  }

  Future<List<ProductModel>> searchProducts(
    String query, {
    String? category,
    String? marketerName,
    String? dosageForm,
    bool? isGeneric,
    bool? isBestSeller,
  }) async {
    final cacheKey =
        'search_${query.toLowerCase()}_cat_${category ?? ''}_gen_${isGeneric ?? ''}_best_${isBestSeller ?? ''}_mark_${marketerName ?? ''}_dose_${dosageForm ?? ''}';
    final cached = _getCached(cacheKey);
    if (cached != null) return List<ProductModel>.from(cached);

    try {
      final encodedQuery = Uri.encodeComponent(query);
      String url = '$baseUrl/products?q=$encodedQuery&limit=30';

      if (category != null) {
        url += '&category=${Uri.encodeComponent(category)}';
      }
      if (marketerName != null) {
        url += '&marketerName=${Uri.encodeComponent(marketerName)}';
      }
      if (dosageForm != null) {
        url += '&dosageForm=${Uri.encodeComponent(dosageForm)}';
      }
      if (isGeneric != null) {
        url += '&isGeneric=$isGeneric';
      }
      if (isBestSeller != null) {
        url += '&isBestSeller=$isBestSeller';
      }

      final response = await http.get(Uri.parse(url));
      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        final list = data.map((item) => ProductModel.fromJson(item)).toList();
        _setCache(cacheKey, list);
        return list;
      }
    } catch (e) {
      debugPrint('Error searching products: $e');
    }
    return [];
  }


  Future<List<Map<String, dynamic>>> searchMolecules(String query) async {
    try {
      final encodedQuery = Uri.encodeComponent(query);
      final response = await http.get(
        Uri.parse('$baseUrl/molecules?q=$encodedQuery&limit=10'),
      );
      if (response.statusCode == 200) {
        return List<Map<String, dynamic>>.from(json.decode(response.body));
      }
    } catch (e) {
      debugPrint('Error searching molecules: $e');
    }
    return [];
  }

  Future<List<ProductModel>> getProductsByMarketer(String marketerName) async {
    try {
      final response = await http.get(
        Uri.parse(
          '$baseUrl/products?marketerName=${Uri.encodeComponent(marketerName)}&limit=50',
        ),
      );
      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.map((item) => ProductModel.fromJson(item)).toList();
      }
    } catch (e) {
      debugPrint('Error fetching products by marketer: $e');
    }
    return [];
  }

  Future<List<ProductModel>> getSimilarMedicines(
    String moleculeId, {
    String? excludeId,
  }) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/products?moleculeId=$moleculeId&limit=10'),
      );
      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        final products = data
            .map((item) => ProductModel.fromJson(item))
            .toList();
        if (excludeId != null) {
          products.removeWhere((p) => p.id == excludeId);
        }
        return products;
      }
    } catch (e) {
      debugPrint('Error fetching similar medicines: $e');
    }
    return [];
  }

  Future<void> logSearch(
    String query, {
    double? lat,
    double? lng,
    String? pincode,
    int? resultsCount,
  }) async {

    try {
      final user = _auth.currentUser;
      final headers = await _getHeaders();
      await http.post(
        Uri.parse('$baseUrl/analytics/search'),
        headers: headers,
        body: json.encode({
          'keyword': query,
          'lat': lat,
          'lng': lng,
          'pincode': pincode,
          'resultsCount': resultsCount,
          'userId': user?.uid,
          'mobile': user?.phoneNumber ?? 'Anonymous',
          'platform': 'mobile',
          'timestamp': DateTime.now().toIso8601String(),

        }),
      );
    } catch (e) {
      debugPrint('Error logging search: $e');
    }
  }

  Future<bool> checkServiceability(String pincode) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/logistics/shipway/serviceability'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'toPincode': pincode, 'fromPincode': '560068'}),

      );
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['serviceable'] == true || data['status'] == 'success';
      }
    } catch (e) {
      debugPrint('Error checking serviceability: $e');
    }
    return true; // Fallback to true to avoid blocking users if serviceability check fails
  }

  Future<String?> getShipwayEDD(String toPincode) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/logistics/shipway/serviceability'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'toPincode': toPincode,
          'fromPincode': '560068' // Sahimed Warehouse
        }),

      );
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['edd'] ?? data['expected_delivery_date'];
      }
    } catch (e) {
      debugPrint('Error fetching Shipway EDD: $e');
    }
    return null;
  }


  Future<List<BannerModel>> getBanners() async {
    final cached = _getCached('banners');
    if (cached != null) return cached;

    try {
      final response = await http.get(Uri.parse('$baseUrl/banners'));
      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        final list = data.map((item) => BannerModel.fromJson(item)).toList();
        _setCache('banners', list);
        return list;
      }
    } catch (e) {
      debugPrint('Error fetching banners: $e');
    }
    return [];
  }

  Future<List<PromoModel>> getPromos() async {
    try {
      final snapshot = await _firestore
          .collection('promocodes')
          .where('isActive', isEqualTo: true)
          .get();

      return snapshot.docs
          .map((doc) => PromoModel.fromJson({...doc.data(), 'id': doc.id}))
          .toList();
    } catch (e) {
      debugPrint('Error fetching promos: $e');
      return [];
    }
  }

  Future<String?> uploadPrescription(File file) async {
    try {
      final user = _auth.currentUser;
      if (user == null) return null;

      final extension = file.path.split('.').last;
      final fileName = '${DateTime.now().millisecondsSinceEpoch}.$extension';
      final storagePath = 'prescriptions/${user.uid}/$fileName';

      final ref = _storage.ref().child(storagePath);
      final uploadTask = await ref.putFile(file);
      return await uploadTask.ref.getDownloadURL();
    } catch (e) {
      debugPrint('Error uploading prescription to Firebase Storage: $e');
    }
    return null;
  }

  Future<String?> createOrder({
    required List<CartItem> items,
    required double total,
    required Map<String, dynamic> shippingDetails,
    required String name,
    required String phone,
    required Map<String, dynamic> billingBreakdown,
    List<String> prescriptions = const [],
    bool isConsultationRequired = false,
    double walletUsed = 0,
  }) async {
    try {
      final user = _auth.currentUser;
      final order = OrderModel(
        userId: user?.uid,
        patientName: name,
        phoneNumber: phone,
        shippingDetails: shippingDetails,
        items: items
            .map(
              (i) => {
                'medicineId': i.product.id,
                'name': i.product.name,
                'quantity': i.quantity,
                'unitPrice': i.product.price,
                'mrp': i.product.mrp.round(),
              },
            )
            .toList(),
        totalAmount: total,
        billingBreakdown: billingBreakdown,
        prescriptionUrls: prescriptions,
        isConsultationRequired: isConsultationRequired,
        clinicalPath: isConsultationRequired ? 'consult' : 'normal',
        walletUsed: walletUsed,
      );


      final orderPayload = {...order.toJson(), 'platform': 'mobile'};

      final headers = await _getHeaders();
      final response = await http.post(
        Uri.parse('$baseUrl/orders'),
        headers: headers,
        body: json.encode(orderPayload),
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

  Future<List<Map<String, dynamic>>> getUserAddresses() async {
    try {
      final headers = await _getHeaders();
      final response = await http.get(
        Uri.parse('$baseUrl/user/addresses'),
        headers: headers,
      );
      if (response.statusCode == 200) {
        return List<Map<String, dynamic>>.from(json.decode(response.body));
      }
    } catch (e) {
      debugPrint('Error fetching addresses from MongoDB: $e');
    }
    return [];
  }

  Future<bool> saveAddress(Map<String, dynamic> address) async {
    try {
      final headers = await _getHeaders();
      final response = await http.post(
        Uri.parse('$baseUrl/user/addresses'),
        headers: headers,
        body: json.encode(address),
      );
      return response.statusCode == 200 || response.statusCode == 201;
    } catch (e) {
      debugPrint('Error saving address to MongoDB: $e');
      return false;
    }
  }

  Future<bool> deleteAddress(String addressId) async {
    try {
      final headers = await _getHeaders();
      final response = await http.delete(
        Uri.parse('$baseUrl/user/addresses?id=$addressId'),
        headers: headers,
      );
      return response.statusCode == 200;
    } catch (e) {
      debugPrint('Error deleting address from MongoDB: $e');
      return false;
    }
  }

  Future<List<Map<String, dynamic>>> getUserOrders() async {
    try {
      final user = _auth.currentUser;
      if (user == null) return [];

      final headers = await _getHeaders();
      
      // We try fetching by multiple possible keys to be absolutely sure we find the data
      final uid = user.uid;
      final phone = user.phoneNumber?.replaceFirst('+', '') ?? '';
      
      // Try fetching by UID primarily
      final response = await http.get(
        Uri.parse('$baseUrl/orders?userId=$uid'),
        headers: headers,
      );

      if (kDebugMode) {
        print('DEBUG: Orders Response for UID $uid: ${response.body}');
      }

      if (response.statusCode == 200) {
        final decoded = json.decode(response.body);
        List<dynamic> rawList = [];
        
        if (decoded is List) {
          rawList = decoded;
        } else if (decoded is Map && decoded.containsKey('data')) {
          rawList = decoded['data'] as List<dynamic>;
        } else if (decoded is Map && (decoded['orders'] is List)) {
          rawList = decoded['orders'] as List<dynamic>;
        }

        // Fallback: If no orders found for UID, try fetching by Phone Number
        if (rawList.isEmpty && phone.isNotEmpty) {
           final phoneResponse = await http.get(
            Uri.parse('$baseUrl/orders?phone=$phone'),
            headers: headers,
          );
          if (phoneResponse.statusCode == 200) {
            final phoneDecoded = json.decode(phoneResponse.body);
             if (phoneDecoded is List) {
              rawList = phoneDecoded;
            } else if (phoneDecoded is Map && phoneDecoded.containsKey('data')) {
              rawList = phoneDecoded['data'] as List<dynamic>;
            }
          }
        }

        return rawList.map((order) {
          final map = Map<String, dynamic>.from(order);
          map['id'] = map['id'] ?? map['_id']?.toString() ?? '';
          return map;
        }).toList();
      }
    } catch (e) {
      debugPrint('Error fetching orders: $e');
    }
    return [];
  }


  Future<bool> submitPrescription({
    required List<String> imageUrls,
    required String patientName,
    required String notes,
  }) async {
    try {
      final headers = await _getHeaders();
      final response = await http.post(
        Uri.parse('$baseUrl/prescriptions'),
        headers: headers,
        body: json.encode({
          'imageUrls': imageUrls,
          'patientName': patientName,
          'notes': notes,
          'platform': 'mobile',
        }),
      );
      return response.statusCode == 200 || response.statusCode == 201;
    } catch (e) {
      debugPrint('Error submitting prescription to MongoDB: $e');
      return false;
    }
  }

  Future<List<Map<String, dynamic>>> getUserPrescriptions() async {
    try {
      final user = _auth.currentUser;
      if (user == null) return [];

      final headers = await _getHeaders();
      final queryParams = 'userId=${user.uid}';
      final response = await http.get(
        Uri.parse('$baseUrl/prescriptions?$queryParams'),
        headers: headers,
      );

      if (kDebugMode) {
        print('DEBUG: Prescriptions Response (${response.statusCode}): ${response.body}');
      }
      if (response.statusCode == 200) {
        return List<Map<String, dynamic>>.from(json.decode(response.body));
      }
    } catch (e) {
      debugPrint('Error fetching prescriptions from MongoDB: $e');
    }
    return [];
  }



  Future<List<Map<String, dynamic>>> getPages() async {

    try {
      final snapshot = await _firestore.collection('pages').get();
      if (snapshot.docs.isNotEmpty) {
        return snapshot.docs.map((doc) => ({
          ...doc.data(),
          'id': doc.id,
        })).toList();
      }
    } catch (e) {
      debugPrint('Error fetching CMS pages from Firestore: $e');
    }

    return [
      {
        'title': 'Privacy Policy',
        'id': 'privacy',
        'content':
            'Your privacy is our priority. We handle your medical data with enterprise-grade encryption.',
        'lastUpdated': DateTime.now().toIso8601String(),
      },
      {
        'title': 'Terms & Conditions',
        'id': 'terms',
        'content':
            'Sahimed provides a platform for medical procurement. Users must provide valid clinical prescriptions where required.',
        'lastUpdated': DateTime.now().toIso8601String(),
      },
    ];
  }

  Future<Map<String, dynamic>> getWalletData() async {
    try {
      final headers = await _getHeaders();
      final response = await http.get(
        Uri.parse('$baseUrl/user/wallet'),
        headers: headers,
      );
      if (response.statusCode == 200) {
        return Map<String, dynamic>.from(json.decode(response.body));
      }
    } catch (e) {
      debugPrint('Error fetching wallet data: $e');
    }
    return {'balance': 0, 'transactions': []};
  }

  Future<bool> syncReminders(List<Map<String, dynamic>> reminders) async {
    try {
      final headers = await _getHeaders();
      final response = await http.post(
        Uri.parse('$baseUrl/user/reminders'),
        headers: headers,
        body: json.encode({'reminders': reminders}),
      );
      return response.statusCode == 200;
    } catch (e) {
      debugPrint('Error syncing reminders: $e');
      return false;
    }
  }

  Future<Map<String, dynamic>> validateWalletUse(List<Map<String, dynamic>> items) async {
    try {
      final headers = await _getHeaders();
      final response = await http.post(
        Uri.parse('$baseUrl/user/wallet'),
        headers: headers,
        body: json.encode({
          'action': 'validate_use',
          'items': items,
        }),
      );
      if (response.statusCode == 200) {
        return Map<String, dynamic>.from(json.decode(response.body));
      }
    } catch (e) {
      debugPrint('Error validating wallet use: $e');
    }
    return {'allowable': 0};
  }
}

