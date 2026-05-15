class CategoryModel {
  final String id;
  final String name;
  final String imageUrl;

  CategoryModel({required this.id, required this.name, required this.imageUrl});

  factory CategoryModel.fromJson(Map<String, dynamic> json) {
    return CategoryModel(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      imageUrl:
          json['imageUrl'] ??
          'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=2070&auto=format&fit=crop',
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
  final bool isTopSelection;
  final bool isActive;

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
  final String category;

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
    this.isTopSelection = false,
    this.isActive = true,
    this.treatment,
    this.description,
    this.safetyAdvice,
    this.howToUse,
    this.pregnancyInteraction,
    this.lactationInteraction,
    this.drivingInteraction,
    this.kidneyInteraction,
    this.liverInteraction,
    required this.category,
  });

  factory ProductModel.fromJson(Map<String, dynamic> json) {
    final live = json['liveData'] as Map<String, dynamic>?;
    final images =
        (json['imageUrls'] as List?)?.map((e) => e.toString()).toList() ?? [];

    return ProductModel(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      brand: json['brand'] ?? '',
      packSize: json['packSize'],
      price:
          num.tryParse(
            (live?['sahimed_price'] ?? json['price'] ?? 0).toString(),
          )?.toDouble() ??
          0.0,
      mrp:
          num.tryParse(
            (live?['mrp'] ?? json['mrp'] ?? 0).toString(),
          )?.toDouble() ??
          0.0,
      imageUrl: images.isNotEmpty
          ? images.first
          : (json['imageUrl'] ??
                'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=2070&auto=format&fit=crop'),
      imageUrls: images,
      saltComposition: json['saltComposition'] ?? json['composition'],
      isGeneric: json['isGeneric'] == true || json['isGeneric'] == "true",
      rxRequired:
          json['rxRequired'] == true ||
          json['prescriptionRequired'] == true ||
          json['isRxRequired'] == true,
      prescriptionRequired:
          json['prescriptionRequired'] == true || json['rxRequired'] == true,
      moleculeId: json['moleculeId'],
      molName: json['molName'] ?? json['moleculeName'],
      company: json['company'] ?? json['manufacturer'],
      liveData: live,
      moleculeData: json['moleculeData'],
      isBestSeller:
          json['isBestSeller'] == true || json['isBestSeller'] == "true",
      isTopSelection:
          json['isTopSelection'] == true || json['isTopSelection'] == "true",
      isActive: json['isActive'] != false && json['isActive'] != "false",
      treatment: json['treatment'],
      description: json['description'] ?? json['medicalDescription'],
      safetyAdvice: json['safetyAdvice'],
      howToUse: json['howToUse'],
      pregnancyInteraction: json['pregnancyInteraction'],
      lactationInteraction: json['lactationInteraction'],
      drivingInteraction: json['drivingInteraction'],
      kidneyInteraction: json['kidneyInteraction'],
      liverInteraction: json['liverInteraction'],
      category: json['category'] ?? json['treatment'] ?? 'General',
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
      'category': category,
      'isBestSeller': isBestSeller,
      'isTopSelection': isTopSelection,
      'isActive': isActive,
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
  final String id;
  final String? orderId;
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
  final String? awbNumber;
  final String? carrierId;
  final double walletUsed;
  final DateTime createdAt;
  final String? expectedDeliveryDate;

  OrderModel({
    required this.id,
    this.orderId,
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
    this.awbNumber,
    this.carrierId,
    this.walletUsed = 0,
    required this.createdAt,
    this.expectedDeliveryDate,
  });

  factory OrderModel.fromJson(Map<String, dynamic> json) {
    return OrderModel(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      orderId: json['orderId']?.toString(),
      userId: json['userId'] ?? json['customer_id'],
      patientName: json['patientName'] ?? json['customer_name'] ?? 'User',
      phoneNumber: (json['phoneNumber'] ?? json['phone'] ?? json['customer_phone'] ?? '').toString(),
      shippingDetails: json['shippingDetails'] ?? {},
      items: (json['items'] as List?)?.map((i) => Map<String, dynamic>.from(i)).toList() ?? [],
      totalAmount: num.tryParse((json['totalAmount'] ?? 0).toString())?.toDouble() ?? 0.0,
      billingBreakdown: json['billingBreakdown'] ?? {},
      prescriptionUrls: (json['prescriptionUrls'] as List?)?.map((u) => u.toString()).toList() ?? [],
      paymentType: json['paymentType'] ?? 'COD',
      status: json['status'] ?? 'Pending',
      isConsultationRequired: json['isConsultationRequired'] == true,
      clinicalPath: json['clinicalPath'] ?? 'normal',
      awbNumber: json['shipping']?['awb'] ?? json['awbNumber'],
      carrierId: json['shipping']?['courier'] ?? json['carrierId'],
      walletUsed: num.tryParse((json['walletUsed'] ?? 0).toString())?.toDouble() ?? 0.0,
      createdAt: json['createdAt'] != null 
        ? (json['createdAt'] is String ? DateTime.parse(json['createdAt']) : (json['createdAt'] is Map ? DateTime.fromMillisecondsSinceEpoch(json['createdAt']['_seconds'] * 1000) : DateTime.now()))
        : DateTime.now(),
      expectedDeliveryDate: json['expectedDeliveryDate']?.toString(),
    );
  }

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
      'awbNumber': awbNumber,
      'carrierId': carrierId,
      'walletUsed': walletUsed,
      'orderDate': {'_methodName': 'serverTimestamp'},
    };
  }

}


class MedicineReminder {
  final String id;
  final String medicineName;
  final String dosage;
  final int hour;
  final int minute;
  final bool isActive;

  MedicineReminder({
    required this.id,
    required this.medicineName,
    required this.dosage,
    required this.hour,
    required this.minute,
    this.isActive = true,
  });

  Map<String, dynamic> toJson() => {
    'id': id,
    'medicineName': medicineName,
    'dosage': dosage,
    'hour': hour,
    'minute': minute,
    'isActive': isActive,
  };

  factory MedicineReminder.fromJson(Map<String, dynamic> json) => MedicineReminder(
    id: json['id'] ?? '',
    medicineName: json['medicineName'] ?? '',
    dosage: json['dosage'] ?? '',
    hour: json['hour'] ?? 8,
    minute: json['minute'] ?? 0,
    isActive: json['isActive'] ?? true,
  );
}

class PromoModel {
  final String id;
  final String code;
  final String description;
  final String discountType; // 'fixed' | 'percentage'
  final double discountValue;
  final double? maxDiscount;
  final double minOrderValue;
  final String applyTo;
  final bool isActive;
  final String? scope;
  final String? scopeValue;
  final Map<String, dynamic>? rules;

  PromoModel({
    required this.id,
    required this.code,
    required this.description,
    required this.discountType,
    required this.discountValue,
    this.maxDiscount,
    required this.minOrderValue,
    required this.applyTo,
    this.isActive = true,
    this.scope,
    this.scopeValue,
    this.rules,
  });

  factory PromoModel.fromJson(Map<String, dynamic> json) {
    return PromoModel(
      id: json['id'] ?? json['_id'] ?? '',
      code: json['code'] ?? '',
      description: json['description'] ?? '',
      discountType: json['discountType'] ?? 'percentage',
      discountValue: (json['discountValue'] ?? 0).toDouble(),
      maxDiscount: json['maxDiscount'] != null
          ? (json['maxDiscount'] as num).toDouble()
          : null,
      minOrderValue: (json['minOrderValue'] ?? 0).toDouble(),
      applyTo: json['applyTo'] ?? 'cart',
      isActive: json['isActive'] ?? true,
      scope: json['scope'],
      scopeValue: json['scopeValue'],
      rules: json['rules'] != null ? Map<String, dynamic>.from(json['rules']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'code': code,
      'description': description,
      'discountType': discountType,
      'discountValue': discountValue,
      'maxDiscount': maxDiscount,
      'minOrderValue': minOrderValue,
      'applyTo': applyTo,
      'isActive': isActive,
      'scope': scope,
      'scopeValue': scopeValue,
      'rules': rules,
    };
  }
}

class FeeModel {
  final String id;
  final String name;
  final double amount;
  final double minPurchase;
  final bool isActive;
  final String type; // 'fixed' | 'percentage'
  final List<Map<String, dynamic>>? tiers;

  FeeModel({
    required this.id,
    required this.name,
    required this.amount,
    required this.minPurchase,
    this.isActive = true,
    this.type = 'fixed',
    this.tiers,
  });

  factory FeeModel.fromJson(Map<String, dynamic> json) {
    return FeeModel(
      id: json['id'] ?? json['_id'] ?? '',
      name: json['name'] ?? '',
      amount: (json['discountedAmount'] ?? json['amount'] ?? 0).toDouble(),
      minPurchase: (json['minPurchase'] ?? 0).toDouble(),
      isActive: json['isActive'] ?? true,
      type: json['type'] ?? 'fixed',
      tiers: (json['tiers'] as List?)?.map((t) => Map<String, dynamic>.from(t)).toList(),
    );
  }
}
