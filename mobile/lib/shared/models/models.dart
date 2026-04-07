class CategoryModel {
  final String id;
  final String name;
  final String imageUrl;

  CategoryModel({
    required this.id,
    required this.name,
    required this.imageUrl,
  });

  factory CategoryModel.fromJson(Map<String, dynamic> json) {
    return CategoryModel(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      imageUrl: json['imageUrl'] ?? 'https://picsum.photos/seed/${json['name']}/200/200',
    );
  }
}

class BannerModel {
  final String id;
  final String imageUrl;
  final String? redirectTo;

  BannerModel({required this.id, required this.imageUrl, this.redirectTo});

  factory BannerModel.fromJson(Map<String, dynamic> json) {
    return BannerModel(
      id: json['_id'] ?? json['id'] ?? '',
      imageUrl: json['imageUrl'] ?? '',
      redirectTo: json['redirectTo'],
    );
  }
}

class ProductModel {
  final String id;
  final String name;
  final String brand;
  final String? packSize;
  final double price;
  final double mrp;
  final String imageUrl;
  final List<String> imageUrls;
  final String? saltComposition;
  final bool isGeneric;
  final String? moleculeId;
  final String? molName;
  final String? company;
  final Map<String, dynamic>? liveData;
  final Map<String, dynamic>? moleculeData;

  ProductModel({
    required this.id,
    required this.name,
    required this.brand,
    this.packSize,
    required this.price,
    required this.mrp,
    required this.imageUrl,
    this.imageUrls = const [],
    this.saltComposition,
    this.isGeneric = false,
    this.moleculeId,
    this.molName,
    this.company,
    this.liveData,
    this.moleculeData,
  });

  factory ProductModel.fromJson(Map<String, dynamic> json) {
    final live = json['liveData'] as Map<String, dynamic>?;
    final images = (json['imageUrls'] as List?)?.map((e) => e.toString()).toList() ?? [];
    
    return ProductModel(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      brand: json['brand'] ?? '',
      packSize: json['packSize'],
      price: (live?['sahimed_price'] ?? json['price'] ?? 0).toDouble(),
      mrp: (live?['mrp'] ?? json['mrp'] ?? 0).toDouble(),
      imageUrl: images.isNotEmpty ? images.first : (json['imageUrl'] ?? 'https://picsum.photos/seed/${json['_id']}/300/300'),
      imageUrls: images,
      saltComposition: json['saltComposition'] ?? json['composition'],
      isGeneric: json['isGeneric'] == true,
      moleculeId: json['moleculeId'],
      molName: json['molName'] ?? json['moleculeName'],
      company: json['company'] ?? json['manufacturer'],
      liveData: live,
      moleculeData: json['moleculeData'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'brand': brand,
      'packSize': packSize,
      'price': price,
      'mrp': mrp,
      'imageUrl': imageUrl,
      'imageUrls': imageUrls,
      'saltComposition': saltComposition,
      'isGeneric': isGeneric,
      'moleculeId': moleculeId,
      'molName': molName,
      'company': company,
      'liveData': liveData,
    };
  }
}

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
    quantity: json['quantity'] ?? 1,
  );
}

class OrderModel {
  final List<ProductModel> items;
  final double total;
  final String address;
  final String name;
  final String phone;

  OrderModel({
    required this.items,
    required this.total,
    required this.address,
    required this.name,
    required this.phone,
  });

  Map<String, dynamic> toJson() {
    return {
      'items': items.map((e) => e.toJson()).toList(),
      'total': total,
      'shippingAddress': address,
      'customerName': name,
      'customerPhone': phone,
      'paymentMethod': 'COD',
      'status': 'Pending',
      'orderDate': DateTime.now().toIso8601String(),
    };
  }
}
