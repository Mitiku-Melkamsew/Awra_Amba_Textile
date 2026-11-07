import '../../domain/entities/fabric_price_entity.dart';

class FabricPriceModel extends FabricPriceEntity {
  const FabricPriceModel({
    required super.fabricPriceId,
    required super.fabricId,
    required super.fabricName,
    required super.sellingPrice,
    super.weaverRate,
    required super.effectiveFrom,
    super.effectiveTo,
    super.isActive = true,
    super.standardLengthCm,
    super.standardWidthCm,
    super.standardWeightG,
  });

  factory FabricPriceModel.fromJson(Map<String, dynamic> json) {
    final fabric = json['fabric'] as Map<String, dynamic>?;
    final fabricName = fabric?['name']?.toString() ?? 'Fabric #${json['fabricId']}';

    return FabricPriceModel(
      fabricPriceId: json['fabricPriceId'] is int
          ? json['fabricPriceId']
          : int.tryParse(json['fabricPriceId']?.toString() ?? '') ?? 0,
      fabricId: json['fabricId'] is int
          ? json['fabricId']
          : int.tryParse(json['fabricId']?.toString() ?? '') ?? 0,
      fabricName: fabricName,
      sellingPrice: double.tryParse(json['sellingPrice']?.toString() ?? '0') ?? 0.0,
      weaverRate: double.tryParse(json['weaverRate']?.toString() ?? ''),
      effectiveFrom: json['effectiveFrom']?.toString() ?? '',
      effectiveTo: json['effectiveTo']?.toString(),
      isActive: json['isActive'] == true || json['isActive'] == 1,
      standardLengthCm: double.tryParse(
        (fabric?['standardLengthCm'] ?? json['standardLengthCm'])?.toString() ?? '',
      ),
      standardWidthCm: double.tryParse(
        (fabric?['standardWidthCm'] ?? json['standardWidthCm'])?.toString() ?? '',
      ),
      standardWeightG: double.tryParse(
        (fabric?['standardWeightG'] ?? json['standardWeightG'])?.toString() ?? '',
      ),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'fabricPriceId': fabricPriceId,
      'fabricId': fabricId,
      'fabricName': fabricName,
      'sellingPrice': sellingPrice,
      'weaverRate': weaverRate,
      'effectiveFrom': effectiveFrom,
      'effectiveTo': effectiveTo,
      'isActive': isActive,
    };
  }
}
