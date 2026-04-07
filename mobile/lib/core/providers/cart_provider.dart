import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../shared/models/models.dart';

class CartItem {
  final ProductModel product;
  int quantity;

  CartItem({required this.product, this.quantity = 1});

  Map<String, dynamic> toJson() => {
    'product': product.toJson(),
    'quantity': quantity,
  };

  factory CartItem.fromJson(Map<String, dynamic> json) => CartItem(
    product: ProductModel.fromJson(json['product']),
    quantity: json['quantity'],
  );
}

class CartProvider with ChangeNotifier {
  List<CartItem> _items = [];
  final String _prefKey = 'sahimed_cart';

  CartProvider() {
    _loadCart();
  }

  List<CartItem> get items => _items;

  double get subtotal => _items.fold(0.0, (sum, item) {
    final mrpValue = double.tryParse(item.product.liveData?.mrp.toString() ?? '0') ?? 0.0;
    return sum + (mrpValue * item.quantity);
  });

  double get total => _items.fold(0.0, (sum, item) {
    final priceValue = double.tryParse(item.product.liveData?.price.toString() ?? '0') ?? 0.0;
    return sum + (priceValue * item.quantity);
  });
  
  double get totalSavings => (subtotal - total) > 0 ? (subtotal - total) : 0.0;

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
      final List<dynamic> decoded = json.decode(cartData);
      _items = decoded.map((item) => CartItem.fromJson(item)).toList();
      notifyListeners();
    }
  }
}
