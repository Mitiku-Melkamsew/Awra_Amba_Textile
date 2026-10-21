import 'package:equatable/equatable.dart';

class Product extends Equatable {
  final int productId;
  final String name;
  final String category;
  final double basePrice;
  final double? standardLengthCm;
  final double? standardWidthCm;

  const Product({
    required this.productId,
    required this.name,
    required this.category,
    required this.basePrice,
    this.standardLengthCm,
    this.standardWidthCm,
  });

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      productId: json['productId'] is int
          ? json['productId']
          : int.tryParse(json['productId'].toString()) ?? 0,
      name: json['name'] ?? '',
      category: json['category'] ?? '',
      basePrice: double.tryParse(json['basePrice']?.toString() ?? '0') ?? 0.0,
      standardLengthCm: double.tryParse(json['standardLengthCm']?.toString() ?? ''),
      standardWidthCm: double.tryParse(json['standardWidthCm']?.toString() ?? ''),
    );
  }

  @override
  List<Object?> get props => [productId, name, category, basePrice];
}

class NamedColor extends Equatable {
  final int colorId;
  final String colorCode;
  final String name;

  const NamedColor({
    required this.colorId,
    required this.colorCode,
    required this.name,
  });

  factory NamedColor.fromJson(Map<String, dynamic> json) {
    return NamedColor(
      colorId: json['colorId'] is int
          ? json['colorId']
          : int.tryParse(json['colorId'].toString()) ?? 0,
      colorCode: json['colorCode'] ?? '',
      name: json['name'] ?? '',
    );
  }

  @override
  List<Object?> get props => [colorId, colorCode, name];
}

class Supplier extends Equatable {
  final int supplierId;
  final String name;
  final String? contactPhone;

  const Supplier({
    required this.supplierId,
    required this.name,
    this.contactPhone,
  });

  factory Supplier.fromJson(Map<String, dynamic> json) {
    return Supplier(
      supplierId: json['supplierId'] is int
          ? json['supplierId']
          : int.tryParse(json['supplierId'].toString()) ?? 0,
      name: json['name'] ?? '',
      contactPhone: json['contactPhone']?.toString(),
    );
  }

  @override
  List<Object?> get props => [supplierId, name, contactPhone];
}

class YarnType extends Equatable {
  final int yarnTypeId;
  final String materialName;

  const YarnType({
    required this.yarnTypeId,
    required this.materialName,
  });

  factory YarnType.fromJson(Map<String, dynamic> json) {
    return YarnType(
      yarnTypeId: json['yarnTypeId'] is int
          ? json['yarnTypeId']
          : int.tryParse(json['yarnTypeId'].toString()) ?? 0,
      materialName: json['materialName'] ?? '',
    );
  }

  @override
  List<Object?> get props => [yarnTypeId, materialName];
}

class FabricVariant extends Equatable {
  final int fabricVariantId;
  final String sku;
  final double? basePrice;
  final double stockSnapshot;
  final Product? product;
  final NamedColor? warpColor;
  final NamedColor? weftColor;

  const FabricVariant({
    required this.fabricVariantId,
    required this.sku,
    this.basePrice,
    this.stockSnapshot = 0.0,
    this.product,
    this.warpColor,
    this.weftColor,
  });

  String get displayName {
    final prodName = product?.name ?? 'Fabric';
    final warp = warpColor?.name ?? '';
    final weft = weftColor?.name ?? '';
    if (warp.isNotEmpty && weft.isNotEmpty && (warp != 'Default' || weft != 'Default')) {
      return '$prodName ($warp / $weft)';
    }
    return prodName;
  }

  factory FabricVariant.fromJson(Map<String, dynamic> json) {
    return FabricVariant(
      fabricVariantId: json['fabricVariantId'] is int
          ? json['fabricVariantId']
          : int.tryParse(json['fabricVariantId'].toString()) ?? 0,
      sku: json['sku'] ?? '',
      basePrice: double.tryParse(json['basePrice']?.toString() ?? ''),
      stockSnapshot: double.tryParse(json['stockSnapshot']?.toString() ?? '0') ?? 0.0,
      product: json['product'] != null ? Product.fromJson(json['product']) : null,
      warpColor: json['warpColor'] != null ? NamedColor.fromJson(json['warpColor']) : null,
      weftColor: json['weftColor'] != null ? NamedColor.fromJson(json['weftColor']) : null,
    );
  }

  @override
  List<Object?> get props => [fabricVariantId, sku, basePrice, stockSnapshot];
}

class YarnVariant extends Equatable {
  final int yarnVariantId;
  final String sku;
  final double stockSnapshot;
  final double? basePrice;
  final String yarnTypeName;
  final String colorName;
  final String supplierName;

  const YarnVariant({
    required this.yarnVariantId,
    required this.sku,
    this.stockSnapshot = 0.0,
    this.basePrice,
    required this.yarnTypeName,
    required this.colorName,
    required this.supplierName,
  });

  String get displayName => '$yarnTypeName - $colorName ($supplierName)';

  factory YarnVariant.fromJson(Map<String, dynamic> json) {
    return YarnVariant(
      yarnVariantId: json['yarnVariantId'] is int
          ? json['yarnVariantId']
          : int.tryParse(json['yarnVariantId'].toString()) ?? 0,
      sku: json['sku'] ?? '',
      stockSnapshot: double.tryParse(json['stockSnapshot']?.toString() ?? '0') ?? 0.0,
      basePrice: double.tryParse(json['basePrice']?.toString() ?? ''),
      yarnTypeName: json['yarnType']?['materialName'] ?? '',
      colorName: json['color']?['name'] ?? '',
      supplierName: json['supplier']?['name'] ?? '',
    );
  }

  @override
  List<Object?> get props => [yarnVariantId, sku, stockSnapshot, basePrice];
}

class CatalogLookup {
  final List<NamedColor> colors;
  final List<Product> products;
  final List<Supplier> suppliers;
  final List<YarnType> yarnTypes;

  const CatalogLookup({
    required this.colors,
    required this.products,
    required this.suppliers,
    required this.yarnTypes,
  });

  factory CatalogLookup.fromJson(Map<String, dynamic> json) {
    return CatalogLookup(
      colors: (json['colors'] as List?)
              ?.map((e) => NamedColor.fromJson(e))
              .toList() ??
          [],
      products: (json['products'] as List?)
              ?.map((e) => Product.fromJson(e))
              .toList() ??
          [],
      suppliers: (json['suppliers'] as List?)
              ?.map((e) => Supplier.fromJson(e))
              .toList() ??
          [],
      yarnTypes: (json['yarnTypes'] as List?)
              ?.map((e) => YarnType.fromJson(e))
              .toList() ??
          [],
    );
  }
}
