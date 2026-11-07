import '../../domain/entities/price_entity.dart';

class FabricPriceItemModel extends FabricPriceItemEntity {
  const FabricPriceItemModel({
    required super.id,
    required super.fabricVariantId,
    super.fabricName,
    required super.unitPrice,
    required super.effectiveDate,
    super.isActive,
  });

  factory FabricPriceItemModel.fromJson(Map<String, dynamic> json) {
    return FabricPriceItemModel(
      id:
          int.tryParse(
            json['id']?.toString() ??
                json['fabricPriceId']?.toString() ??
                json['priceId']?.toString() ??
                '0',
          ) ??
          0,
      fabricVariantId:
          int.tryParse(
            json['fabricVariantId']?.toString() ??
                json['fabricId']?.toString() ??
                '0',
          ) ??
          0,
      fabricName:
          json['fabricName']?.toString() ??
          json['fabric']?['name']?.toString() ??
          json['fabricVariant']?['displayName']?.toString() ??
          'Fabric #${json['fabricId']}',
      unitPrice:
          double.tryParse(
            json['unitPrice']?.toString() ??
                json['weaverUnitPrice']?.toString() ??
                json['weaverRate']?.toString() ??
                json['sellingUnitPrice']?.toString() ??
                json['sellingPrice']?.toString() ??
                json['price']?.toString() ??
                '0',
          ) ??
          0.0,
      effectiveDate:
          json['effectiveDate']?.toString() ??
          json['effectiveFrom']?.toString() ??
          json['createdAt']?.toString() ??
          '',
      isActive: json['isActive'] == null || json['isActive'] == true,
    );
  }
}

class YarnPriceItemModel extends YarnPriceItemEntity {
  const YarnPriceItemModel({
    required super.id,
    required super.yarnVariantId,
    super.yarnName,
    required super.costPerKg,
    required super.effectiveDate,
    super.isActive,
  });

  factory YarnPriceItemModel.fromJson(Map<String, dynamic> json) {
    return YarnPriceItemModel(
      id:
          int.tryParse(
            json['id']?.toString() ??
                json['yarnPriceId']?.toString() ??
                json['priceId']?.toString() ??
                '0',
          ) ??
          0,
      yarnVariantId:
          int.tryParse(
            json['yarnVariantId']?.toString() ??
                json['yarnId']?.toString() ??
                '0',
          ) ??
          0,
      yarnName:
          json['yarnName']?.toString() ??
          json['yarn']?['materialName']?.toString() ??
          json['yarn']?['name']?.toString() ??
          json['yarnVariant']?['displayName']?.toString() ??
          'Yarn #${json['yarnId']}',
      costPerKg:
          double.tryParse(
            json['costPerKg']?.toString() ??
                json['purchasePrice']?.toString() ??
                json['sellingPrice']?.toString() ??
                json['price']?.toString() ??
                '0',
          ) ??
          0.0,
      effectiveDate:
          json['effectiveDate']?.toString() ??
          json['effectiveFrom']?.toString() ??
          json['createdAt']?.toString() ??
          '',
      isActive: json['isActive'] == null || json['isActive'] == true,
    );
  }
}
