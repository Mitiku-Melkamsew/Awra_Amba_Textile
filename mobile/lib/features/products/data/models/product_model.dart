import '../../domain/entities/product_entity.dart';

class ProductModel extends ProductEntity {
  const ProductModel({
    required super.productId,
    required super.name,
    required super.category,
    required super.basePrice,
    super.standardLengthCm,
    super.standardWidthCm,
    super.standardWeightG,
  });

  factory ProductModel.fromJson(Map<String, dynamic> json) {
    final id = json['productId'] ?? json['fabricId'] ?? json['id'] ?? 0;
    final pId = id is int ? id : int.tryParse(id.toString()) ?? 0;

    double basePrice = 0.0;
    if (json['basePrice'] != null) {
      basePrice = double.tryParse(json['basePrice'].toString()) ?? 0.0;
    } else if (json['prices'] is List && (json['prices'] as List).isNotEmpty) {
      final p0 = (json['prices'] as List).first;
      final rate = p0['weaverRate'] ?? p0['weaverUnitPrice'] ?? p0['price'] ?? p0['sellingPrice'];
      basePrice = double.tryParse(rate?.toString() ?? '0') ?? 0.0;
    }

    final cat = json['category']?.toString();
    return ProductModel(
      productId: pId,
      name: json['name']?.toString() ?? 'Fabric',
      category: (cat != null && cat.isNotEmpty) ? cat : 'fabric',
      basePrice: basePrice,
      standardLengthCm: double.tryParse(
        json['standardLengthCm']?.toString() ?? '',
      ),
      standardWidthCm: double.tryParse(
        json['standardWidthCm']?.toString() ?? '',
      ),
      standardWeightG: double.tryParse(
        json['standardWeightG']?.toString() ?? '',
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
      'standardWeightG': standardWeightG,
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
    final id = json['yarnTypeId'] ?? json['yarnId'] ?? json['id'] ?? 0;
    final yId = id is int ? id : int.tryParse(id.toString()) ?? 0;
    final matName = json['materialName']?.toString() ??
        json['name']?.toString() ??
        json['material']?.toString() ??
        'Yarn';
    return YarnTypeModel(
      yarnTypeId: yId,
      materialName: matName,
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
    final productData = json['product'] ?? json['fabric'];
    return FabricVariantModel(
      fabricVariantId: json['fabricVariantId'] is int
          ? json['fabricVariantId']
          : int.tryParse(json['fabricVariantId'].toString()) ?? 0,
      sku: json['sku']?.toString() ?? '',
      basePrice: double.tryParse(json['basePrice']?.toString() ?? '') ??
          (productData != null && productData['prices'] is List && (productData['prices'] as List).isNotEmpty
              ? double.tryParse((productData['prices'][0]['weaverRate'] ?? productData['prices'][0]['weaverUnitPrice'] ?? productData['prices'][0]['price'])?.toString() ?? '')
              : null),
      stockSnapshot:
          double.tryParse(json['stockSnapshot']?.toString() ?? '0') ?? 0.0,
      product: productData != null
          ? ProductModel.fromJson(productData)
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
    final yarnData = json['yarn'] ?? json['yarnType'];
    final yName = json['yarnTypeName']?.toString() ??
        yarnData?['materialName']?.toString() ??
        yarnData?['name']?.toString() ??
        yarnData?['material']?.toString() ??
        'Yarn';
    return YarnVariantModel(
      yarnVariantId: json['yarnVariantId'] is int
          ? json['yarnVariantId']
          : int.tryParse(json['yarnVariantId'].toString()) ?? 0,
      yarnTypeId: json['yarnTypeId'] is int
          ? json['yarnTypeId']
          : int.tryParse(json['yarnTypeId']?.toString() ??
                  json['yarnId']?.toString() ??
                  '') ??
              0,
      colorId: json['colorId'] is int
          ? json['colorId']
          : int.tryParse(json['colorId'].toString()) ?? 0,
      supplierId: json['supplierId'] is int
          ? json['supplierId']
          : int.tryParse(json['supplierId'].toString()) ?? 0,
      sku: json['sku']?.toString() ?? '',
      stockSnapshot:
          double.tryParse(json['stockSnapshot']?.toString() ?? '0') ?? 0.0,
      basePrice: double.tryParse(json['basePrice']?.toString() ?? '') ??
          (yarnData != null && yarnData['yarnPrices'] is List && (yarnData['yarnPrices'] as List).isNotEmpty
              ? double.tryParse(yarnData['yarnPrices'][0]['unitPrice']?.toString() ?? '')
              : null),
      yarnTypeName: yName,
      colorName: json['color']?['name']?.toString() ??
          json['colorName']?.toString() ??
          '',
      supplierName: json['supplier']?['name']?.toString() ??
          json['supplierName']?.toString() ??
          '',
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
    final productsList = json['products'] ?? json['fabrics'];
    final yarnsList = json['yarnTypes'] ?? json['yarns'];
    return CatalogLookupModel(
      colors:
          (json['colors'] as List?)
              ?.map((e) => NamedColorModel.fromJson(e))
              .toList() ??
          [],
      products:
          (productsList as List?)
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
          (yarnsList as List?)
              ?.map((e) => YarnTypeModel.fromJson(e))
              .toList() ??
          [],
    );
  }
}
