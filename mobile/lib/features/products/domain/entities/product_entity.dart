import 'package:equatable/equatable.dart';

class ProductEntity extends Equatable {
  final int productId;
  final String name;
  final String category;
  final double basePrice;
  final double? standardLengthCm;
  final double? standardWidthCm;

  const ProductEntity({
    required this.productId,
    required this.name,
    required this.category,
    required this.basePrice,
    this.standardLengthCm,
    this.standardWidthCm,
  });

  @override
  List<Object?> get props => [productId, name, category, basePrice];
}

class NamedColorEntity extends Equatable {
  final int colorId;
  final String colorCode;
  final String name;

  const NamedColorEntity({
    required this.colorId,
    required this.colorCode,
    required this.name,
  });

  @override
  List<Object?> get props => [colorId, colorCode, name];
}

class SupplierEntity extends Equatable {
  final int supplierId;
  final String name;
  final String? contactPhone;

  const SupplierEntity({
    required this.supplierId,
    required this.name,
    this.contactPhone,
  });

  @override
  List<Object?> get props => [supplierId, name, contactPhone];
}

class YarnTypeEntity extends Equatable {
  final int yarnTypeId;
  final String materialName;

  const YarnTypeEntity({
    required this.yarnTypeId,
    required this.materialName,
  });

  @override
  List<Object?> get props => [yarnTypeId, materialName];
}

class FabricVariantEntity extends Equatable {
  final int fabricVariantId;
  final String sku;
  final double? basePrice;
  final double stockSnapshot;
  final ProductEntity? product;
  final NamedColorEntity? warpColor;
  final NamedColorEntity? weftColor;

  const FabricVariantEntity({
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

  @override
  List<Object?> get props => [fabricVariantId, sku, basePrice, stockSnapshot];
}

class YarnVariantEntity extends Equatable {
  final int yarnVariantId;
  final String sku;
  final double stockSnapshot;
  final double? basePrice;
  final String yarnTypeName;
  final String colorName;
  final String supplierName;

  const YarnVariantEntity({
    required this.yarnVariantId,
    required this.sku,
    this.stockSnapshot = 0.0,
    this.basePrice,
    required this.yarnTypeName,
    required this.colorName,
    required this.supplierName,
  });

  String get displayName => '$yarnTypeName - $colorName ($supplierName)';

  @override
  List<Object?> get props => [yarnVariantId, sku, stockSnapshot, basePrice];
}

class CatalogLookupEntity extends Equatable {
  final List<NamedColorEntity> colors;
  final List<ProductEntity> products;
  final List<SupplierEntity> suppliers;
  final List<YarnTypeEntity> yarnTypes;

  const CatalogLookupEntity({
    required this.colors,
    required this.products,
    required this.suppliers,
    required this.yarnTypes,
  });

  @override
  List<Object?> get props => [colors, products, suppliers, yarnTypes];
}
