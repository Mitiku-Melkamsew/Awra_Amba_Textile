import '../../domain/entities/product_entity.dart';

class ProductModel extends ProductEntity {
  const ProductModel({
    required super.productId,
    required super.name,
    required super.category,
    required super.basePrice,
    super.standardLengthCm,
    super.standardWidthCm,
  });

  factory ProductModel.fromJson(Map<String, dynamic> json) {
    return ProductModel(
      productId: json['productId'] is int
          ? json['productId']
          : int.tryParse(json['productId'].toString()) ?? 0,
      name: json['name']?.toString() ?? '',
      category: json['category']?.toString() ?? '',
      basePrice: double.tryParse(json['basePrice']?.toString() ?? '0') ?? 0.0,
      standardLengthCm: double.tryParse(
        json['standardLengthCm']?.toString() ?? '',
      ),
      standardWidthCm: double.tryParse(
        json['standardWidthCm']?.toString() ?? '',
      ),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'productId': productId,
      'name': name,
      'category': category,
      'basePrice': basePrice,
      'standardLengthCm': standardLengthCm,
      'standardWidthCm': standardWidthCm,
    };
  }
}

class NamedColorModel extends NamedColorEntity {
  const NamedColorModel({
    required super.colorId,
    required super.colorCode,
    required super.name,
  });

  factory NamedColorModel.fromJson(Map<String, dynamic> json) {
    return NamedColorModel(
      colorId: json['colorId'] is int
          ? json['colorId']
          : int.tryParse(json['colorId'].toString()) ?? 0,
      colorCode: json['colorCode']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {'colorId': colorId, 'colorCode': colorCode, 'name': name};
  }
}

class DesignModel extends DesignEntity {
  const DesignModel({required super.designId, required super.name});

  factory DesignModel.fromJson(Map<String, dynamic> json) {
    return DesignModel(
      designId: json['designId'] is int
          ? json['designId']
          : int.tryParse(json['designId'].toString()) ?? 0,
      name: json['name']?.toString() ?? '',
    );
  }
}

class SupplierModel extends SupplierEntity {
  const SupplierModel({
    required super.supplierId,
    required super.name,
    super.contactPhone,
  });

  factory SupplierModel.fromJson(Map<String, dynamic> json) {
    return SupplierModel(
      supplierId: json['supplierId'] is int
          ? json['supplierId']
          : int.tryParse(json['supplierId'].toString()) ?? 0,
      name: json['name']?.toString() ?? '',
      contactPhone: json['contactPhone']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'supplierId': supplierId,
      'name': name,
      'contactPhone': contactPhone,
    };
  }
}

class YarnTypeModel extends YarnTypeEntity {
  const YarnTypeModel({required super.yarnTypeId, required super.materialName});

  factory YarnTypeModel.fromJson(Map<String, dynamic> json) {
    return YarnTypeModel(
      yarnTypeId: json['yarnTypeId'] is int
          ? json['yarnTypeId']
          : int.tryParse(json['yarnTypeId'].toString()) ?? 0,
      materialName: json['materialName']?.toString() ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {'yarnTypeId': yarnTypeId, 'materialName': materialName};
  }
}

class FabricVariantModel extends FabricVariantEntity {
  const FabricVariantModel({
    required super.fabricVariantId,
    required super.sku,
    super.basePrice,
    super.stockSnapshot = 0.0,
    super.product,
    super.warpColor,
    super.weftColor,
    super.design,
  });

  factory FabricVariantModel.fromJson(Map<String, dynamic> json) {
    return FabricVariantModel(
      fabricVariantId: json['fabricVariantId'] is int
          ? json['fabricVariantId']
          : int.tryParse(json['fabricVariantId'].toString()) ?? 0,
      sku: json['sku']?.toString() ?? '',
      basePrice: double.tryParse(json['basePrice']?.toString() ?? ''),
      stockSnapshot:
          double.tryParse(json['stockSnapshot']?.toString() ?? '0') ?? 0.0,
      product: json['product'] != null
          ? ProductModel.fromJson(json['product'])
          : null,
      warpColor: json['warpColor'] != null
          ? NamedColorModel.fromJson(json['warpColor'])
          : null,
      weftColor: json['weftColor'] != null
          ? NamedColorModel.fromJson(json['weftColor'])
          : null,
      design: json['design'] != null
          ? DesignModel.fromJson(json['design'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'fabricVariantId': fabricVariantId,
      'sku': sku,
      'basePrice': basePrice,
      'stockSnapshot': stockSnapshot,
    };
  }
}

class YarnVariantModel extends YarnVariantEntity {
  const YarnVariantModel({
    required super.yarnVariantId,
    required super.yarnTypeId,
    required super.colorId,
    required super.supplierId,
    required super.sku,
    super.stockSnapshot = 0.0,
    super.basePrice,
    required super.yarnTypeName,
    required super.colorName,
    required super.supplierName,
  });

  factory YarnVariantModel.fromJson(Map<String, dynamic> json) {
    return YarnVariantModel(
      yarnVariantId: json['yarnVariantId'] is int
          ? json['yarnVariantId']
          : int.tryParse(json['yarnVariantId'].toString()) ?? 0,
      yarnTypeId: json['yarnTypeId'] is int
          ? json['yarnTypeId']
          : int.tryParse(json['yarnTypeId'].toString()) ?? 0,
      colorId: json['colorId'] is int
          ? json['colorId']
          : int.tryParse(json['colorId'].toString()) ?? 0,
      supplierId: json['supplierId'] is int
          ? json['supplierId']
          : int.tryParse(json['supplierId'].toString()) ?? 0,
      sku: json['sku']?.toString() ?? '',
      stockSnapshot:
          double.tryParse(json['stockSnapshot']?.toString() ?? '0') ?? 0.0,
      basePrice: double.tryParse(json['basePrice']?.toString() ?? ''),
      yarnTypeName: json['yarnType']?['materialName']?.toString() ?? '',
      colorName: json['color']?['name']?.toString() ?? '',
      supplierName: json['supplier']?['name']?.toString() ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'yarnVariantId': yarnVariantId,
      'sku': sku,
      'stockSnapshot': stockSnapshot,
      'basePrice': basePrice,
      'yarnTypeName': yarnTypeName,
      'colorName': colorName,
      'supplierName': supplierName,
    };
  }
}

class CatalogLookupModel extends CatalogLookupEntity {
  const CatalogLookupModel({
    required super.colors,
    required super.products,
    required super.designs,
    required super.suppliers,
    required super.yarnTypes,
  });

  factory CatalogLookupModel.fromJson(Map<String, dynamic> json) {
    return CatalogLookupModel(
      colors:
          (json['colors'] as List?)
              ?.map((e) => NamedColorModel.fromJson(e))
              .toList() ??
          [],
      products:
          (json['products'] as List?)
              ?.map((e) => ProductModel.fromJson(e))
              .toList() ??
          [],
      designs:
          (json['designs'] as List?)
              ?.map((e) => DesignModel.fromJson(e))
              .toList() ??
          [],
      suppliers:
          (json['suppliers'] as List?)
              ?.map((e) => SupplierModel.fromJson(e))
              .toList() ??
          [],
      yarnTypes:
          (json['yarnTypes'] as List?)
              ?.map((e) => YarnTypeModel.fromJson(e))
              .toList() ??
          [],
    );
  }
}
