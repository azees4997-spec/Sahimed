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

  final bool rxRequired;
  final bool prescriptionRequired;
  final bool isBestSeller;

  // Clinical Metadata for Website Parity
  final String? treatment;
  final String? description;
  final String? safetyAdvice;
  final String? howToUse;
  final String? pregnancyInteraction;
  final String? lactationInteraction;
  final String? drivingInteraction;
  final String? kidneyInteraction;
  final String? liverInteraction;

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
    this.rxRequired = false,
    this.prescriptionRequired = false,
    this.moleculeId,
    this.molName,
    this.company,
    this.liveData,
    this.moleculeData,
    this.isBestSeller = false,
    this.treatment,
    this.description,
    this.safetyAdvice,
    this.howToUse,
    this.pregnancyInteraction,
    this.lactationInteraction,
    this.drivingInteraction,
    this.kidneyInteraction,
    this.liverInteraction,
  });

  factory ProductModel.fromJson(Map<String, dynamic> json) {
    final live = json['liveData'] as Map<String, dynamic>?;
    final images = (json['imageUrls'] as List?)?.map((e) => e.toString()).toList() ?? [];
    
    return ProductModel(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      brand: json['brand'] ?? '',
      packSize: json['packSize'],
      price: num.tryParse((live?['sahimed_price'] ?? json['price'] ?? 0).toString())?.toDouble() ?? 0.0,
      mrp: num.tryParse((live?['mrp'] ?? json['mrp'] ?? 0).toString())?.toDouble() ?? 0.0,
      imageUrl: images.isNotEmpty ? images.first : (json['imageUrl'] ?? 'https://picsum.photos/seed/${json['_id'] ?? json['id']}/300/300'),
      imageUrls: images,
      saltComposition: json['saltComposition'] ?? json['composition'],
      isGeneric: json['isGeneric'] == true || json['isGeneric'] == "true",
      rxRequired: json['rxRequired'] == true || json['prescriptionRequired'] == true || json['isRxRequired'] == true,
      prescriptionRequired: json['prescriptionRequired'] == true || json['rxRequired'] == true,
      moleculeId: json['moleculeId'],
      molName: json['molName'] ?? json['moleculeName'],
      company: json['company'] ?? json['manufacturer'],
      liveData: live,
      moleculeData: json['moleculeData'],
      isBestSeller: json['isBestSeller'] == true || json['isBestSeller'] == "true",
      treatment: json['treatment'],
      description: json['description'] ?? json['medicalDescription'],
      safetyAdvice: json['safetyAdvice'],
      howToUse: json['howToUse'],
      pregnancyInteraction: json['pregnancyInteraction'],
      lactationInteraction: json['lactationInteraction'],
      drivingInteraction: json['drivingInteraction'],
      kidneyInteraction: json['kidneyInteraction'],
      liverInteraction: json['liverInteraction'],
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
      'rxRequired': rxRequired,
      'prescriptionRequired': prescriptionRequired,
      'moleculeId': moleculeId,
      'molName': molName,
      'company': company,
      'liveData': liveData,
      'treatment': treatment,
      'description': description,
      'safetyAdvice': safetyAdvice,
      'howToUse': howToUse,
      'pregnancyInteraction': pregnancyInteraction,
      'lactationInteraction': lactationInteraction,
      'drivingInteraction': drivingInteraction,
      'kidneyInteraction': kidneyInteraction,
      'liverInteraction': liverInteraction,
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
  final String? userId;
  final String patientName;
  final String phoneNumber;
  final Map<String, dynamic> shippingDetails; 
  final List<Map<String, dynamic>> items;
  final double totalAmount;
  final Map<String, dynamic> billingBreakdown;
  final List<String> prescriptionUrls;
  final String paymentType;
  final String status;
  final bool isConsultationRequired;
  final String clinicalPath;

  OrderModel({
    this.userId,
    required this.patientName,
    required this.phoneNumber,
    required this.shippingDetails,
    required this.items,
    required this.totalAmount,
    required this.billingBreakdown,
    this.prescriptionUrls = const [],
    this.paymentType = 'Cash on Delivery',
    this.status = 'Pending Consult',
    this.isConsultationRequired = false,
    this.clinicalPath = 'consult',
  });

  Map<String, dynamic> toJson() {
    return {
      'userId': userId,
      'patientName': patientName,
      'phoneNumber': phoneNumber,
      'shippingDetails': shippingDetails,
      'items': items,
      'totalAmount': totalAmount,
      'billingBreakdown': billingBreakdown,
      'prescriptionUrls': prescriptionUrls,
      'paymentType': paymentType,
      'status': status,
      'isConsultationRequired': isConsultationRequired,
      'clinicalPath': clinicalPath,
      'orderDate': {
        '_methodName': 'serverTimestamp',
      },
    };
  }
}
