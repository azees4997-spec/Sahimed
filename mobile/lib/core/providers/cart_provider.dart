import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../shared/models/models.dart';

// CartItem is now imported from models.dart

class CartProvider with ChangeNotifier {
  List<CartItem> _items = [];
  final String _prefKey = 'sahimed_cart';

  CartProvider() {
    _loadCart();
  }

  List<CartItem> get items => _items;

  double get subtotal => _items.fold(0, (sum, item) => sum + (item.product.mrp * item.quantity));
  double get total => _items.fold(0, (sum, item) => sum + (item.product.price * item.quantity));

  double get deliveryFee => (total > 0 && total < 499) ? 49.0 : 0.0;
  double get packingFee => total > 0 ? 10.0 : 0.0;
  
  double get finalTotal => total + deliveryFee + packingFee;
  
  double get totalSavings => (subtotal - total) > 0 ? (subtotal - total) : 0.0;

  bool get isRxRequired => _items.any((item) => item.product.rxRequired || item.product.prescriptionRequired);

  Map<String, dynamic> get billingBreakdown => {
    'grossMrp': subtotal,
    'campaignDiscount': totalSavings,
    'deliveryFees': deliveryFee,
    'packingFees': packingFee,
    'netPayable': finalTotal,
  };

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
