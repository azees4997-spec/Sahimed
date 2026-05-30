import 'package:cloud_firestore/cloud_firestore.dart';
import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../shared/models/models.dart';

// CartItem is now imported from models.dart

class CartProvider with ChangeNotifier {
  List<CartItem> _items = [];
  PromoModel? _appliedPromo;
  List<FeeModel> _activeFees = [];
  // [COST FIX] No more snapshot listener — track last fetch time instead
  DateTime? _feesFetchedAt;
  static const _feesCacheDuration = Duration(hours: 1);
  final String _prefKey = 'sahimed_cart';

  CartProvider() {
    _loadCart();
    _fetchFees(); // one-time fetch, not a stream
  }

  // [COST FIX] One-time get() with 1-hour cache instead of permanent snapshot listener.
  // Fees change maybe once a month — real-time was wasting reads for every active user.
  Future<void> _fetchFees({bool forceRefresh = false}) async {
    final now = DateTime.now();
    if (!forceRefresh &&
        _feesFetchedAt != null &&
        now.difference(_feesFetchedAt!) < _feesCacheDuration) {
      return; // cache still fresh
    }
    try {
      final snapshot = await FirebaseFirestore.instance
          .collection('fees')
          .where('isActive', isEqualTo: true)
          .get();                              // ← one-time GET
      _activeFees = snapshot.docs
          .map((doc) => FeeModel.fromJson({...doc.data(), 'id': doc.id}))
          .toList();
      _feesFetchedAt = now;
      notifyListeners();
    } catch (e) {
      debugPrint('CartProvider: Fee fetch error: $e');
    }
  }

  /// Call this to force a fresh fee fetch (e.g. on pull-to-refresh).
  void refreshFees() => _fetchFees(forceRefresh: true);


  List<CartItem> get items => _items;
  PromoModel? get appliedPromo => _appliedPromo;

  double get subtotal =>
      _items.fold(0.0, (sum, item) => sum + (item.product.mrp * item.quantity));
  double get total =>
      _items.fold(0.0, (sum, item) => sum + (item.product.price * item.quantity));

  double get promoDiscount {
    if (_appliedPromo == null || total < _appliedPromo!.minOrderValue) {
      return 0.0;
    }

    // Calculate eligible subtotal based on campaign rules
    double eligibleTotal = _items.fold(0.0, (acc, item) {
      bool isEligible = true;
      final rules = _appliedPromo!.rules ?? {};
      final scope = _appliedPromo!.scope ?? 'global';

      // 1. Branded / Generic Restrictions
      final isItemGeneric = item.product.isGeneric == true;
      if (scope == 'branded' || (rules['isBrandedOnly'] == true)) {
        if (isItemGeneric) isEligible = false;
      } else if (scope == 'generic' || (rules['isGenericOnly'] == true)) {
        if (!isItemGeneric) isEligible = false;
      }

      // 2. Category Restrictions
      final allowedCats = List<String>.from(rules['categories'] ?? []);
      if (scope == 'category' || allowedCats.isNotEmpty) {
        final cats = [...allowedCats];
        if (scope == 'category' && _appliedPromo!.scopeValue != null) {
          cats.add(_appliedPromo!.scopeValue!);
        }
        if (!cats.contains(item.product.category)) isEligible = false;
      }

      // 3. Product Restrictions
      final allowedProds = List<String>.from(rules['products'] ?? []);
      if (scope == 'product' || allowedProds.isNotEmpty) {
        final prods = [...allowedProds];
        if (scope == 'product' && _appliedPromo!.scopeValue != null) {
          prods.add(_appliedPromo!.scopeValue!);
        }
        if (!prods.contains(item.product.name)) isEligible = false;
      }

      return isEligible ? acc + (item.product.price * item.quantity) : acc;
    });


    if (eligibleTotal <= 0) return 0.0;

    if (_appliedPromo!.discountType == 'fixed') {
      return _appliedPromo!.discountValue;
    } else {
      double discount = eligibleTotal * (_appliedPromo!.discountValue / 100);
      if (_appliedPromo!.maxDiscount != null &&
          _appliedPromo!.maxDiscount! > 0) {
        discount = discount > _appliedPromo!.maxDiscount!
            ? _appliedPromo!.maxDiscount!
            : discount;
      }
      return discount;
    }
  }

  double get deliveryFee {
    double feeTotal = 0.0;
    double netSubtotal = total - promoDiscount;
    
    for (var fee in _activeFees) {
      if (!fee.isActive) continue;

      if (fee.tiers != null && fee.tiers!.isNotEmpty) {
        // Find the highest tier that the current net subtotal qualifies for
        final sortedTiers = List<Map<String, dynamic>>.from(fee.tiers!)
          ..sort((a, b) => (b['minOrder'] as num).compareTo(a['minOrder'] as num));

        final matchingTier = sortedTiers.firstWhere(
          (t) => netSubtotal >= (t['minOrder'] as num),
          orElse: () => {},
        );

        if (matchingTier.isNotEmpty) {
          feeTotal += (matchingTier['charge'] as num).toDouble();
          continue; 
        }
      }

      // Fallback to legacy single threshold logic
      if (fee.minPurchase > 0 && netSubtotal >= fee.minPurchase) {
        continue;
      }

      if (fee.type == 'fixed') {
        feeTotal += fee.amount;
      } else {
        feeTotal += (netSubtotal * (fee.amount / 100));
      }
    }
    return feeTotal;
  }

  double get packingFee => 0.0;

  double get finalTotal => ((total - promoDiscount).clamp(0.0, double.infinity)) + deliveryFee + packingFee;

  // MOB-02 FIX: Guard against negative savings when mrp or price data is missing
  double get totalSavings => (subtotal - total + promoDiscount).clamp(0.0, double.infinity);

  @override
  void dispose() {
    // No stream subscription to cancel anymore
    super.dispose();
  }

  bool get isRxRequired => _items.any(
    (item) => item.product.rxRequired || item.product.prescriptionRequired,
  );

  Map<String, dynamic> get billingBreakdown => {
    'grossMrp': subtotal,
    'campaignDiscount': subtotal - total,
    'promocodeDiscount': promoDiscount,
    'deliveryFees': deliveryFee,
    'packingFees': packingFee,
    'savings': totalSavings,
    'netPayable': finalTotal,
  };

  void applyPromo(PromoModel promo) {
    _appliedPromo = promo;
    notifyListeners();
  }

  void removePromo() {
    _appliedPromo = null;
    notifyListeners();
  }

  void addItem(ProductModel product) {
    final index = _items.indexWhere((item) => item.product.id == product.id);
    if (index >= 0) {
      _items[index].quantity++;
    } else {
      _items.add(CartItem(product: product));
    }
    _saveCart();
    notifyListeners();
  }

  void removeItem(String productId) {
    _items.removeWhere((item) => item.product.id == productId);
    _saveCart();
    notifyListeners();
  }

  void updateQuantity(String productId, int delta) {
    final index = _items.indexWhere((item) => item.product.id == productId);
    if (index >= 0) {
      _items[index].quantity += delta;
      if (_items[index].quantity <= 0) {
        _items.removeAt(index);
      }
      _saveCart();
      notifyListeners();
    }
  }

  void clearCart() {
    _items.clear();
    _saveCart();
    notifyListeners();
  }

  Future<void> _saveCart() async {
    final prefs = await SharedPreferences.getInstance();
    final cartData = json.encode(_items.map((item) => item.toJson()).toList());
    await prefs.setString(_prefKey, cartData);
  }

  Future<void> _loadCart() async {
    final prefs = await SharedPreferences.getInstance();
    final cartData = prefs.getString(_prefKey);
    if (cartData != null) {
      try {
        final List<dynamic> decoded = json.decode(cartData);
        _items = decoded.map((item) => CartItem.fromJson(item)).toList();
        notifyListeners();
      } catch (e) {
        debugPrint('Error loading cart: $e');
        _items = [];
      }
    }
  }
}
