import '../../domain/entities/available_fabric_entity.dart';

class AvailableFabricModel extends AvailableFabricEntity {
  const AvailableFabricModel({
    required super.fabricVariantId,
    required super.sku,
    required super.fabricId,
    required super.fabricName,
    super.standardLengthCm,
    super.standardWidthCm,
    super.standardWeightG,
    required super.design,
    required super.warpColor,
    required super.weftColor,
    required super.sellingPrice,
    super.weaverRate,
  });

  factory AvailableFabricModel.fromJson(Map<String, dynamic> json) {
    return AvailableFabricModel(
      fabricVariantId: json['fabricVariantId'] is int
          ? json['fabricVariantId']
          : int.tryParse(json['fabricVariantId']?.toString() ?? '') ?? 0,
      sku: json['sku']?.toString() ?? '',
      fabricId: json['fabricId'] is int
          ? json['fabricId']
          : int.tryParse(json['fabricId']?.toString() ?? '') ?? 0,
      fabricName: json['fabricName']?.toString() ?? json['name']?.toString() ?? 'Fabric',
      standardLengthCm: double.tryParse(json['standardLengthCm']?.toString() ?? ''),
      standardWidthCm: double.tryParse(json['standardWidthCm']?.toString() ?? ''),
      standardWeightG: double.tryParse(json['standardWeightG']?.toString() ?? ''),
      design: json['design']?.toString() ?? 'Standard',
      warpColor: json['warpColor']?.toString() ?? 'Natural',
      weftColor: json['weftColor']?.toString() ?? 'Natural',
      sellingPrice: double.tryParse(json['sellingPrice']?.toString() ?? '0') ?? 0.0,
      weaverRate: double.tryParse(json['weaverRate']?.toString() ?? ''),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'fabricVariantId': fabricVariantId,
      'sku': sku,
      'fabricId': fabricId,
      'fabricName': fabricName,
      'standardLengthCm': standardLengthCm,
      'standardWidthCm': standardWidthCm,
      'standardWeightG': standardWeightG,
      'design': design,
      'warpColor': warpColor,
      'weftColor': weftColor,
      'sellingPrice': sellingPrice,
      'weaverRate': weaverRate,
    };
  }
}
