import 'package:equatable/equatable.dart';

class AvailableFabricEntity extends Equatable {
  final int fabricVariantId;
  final String sku;
  final int fabricId;
  final String fabricName;
  final double? standardLengthCm;
  final double? standardWidthCm;
  final double? standardWeightG;
  final String design;
  final String warpColor;
  final String weftColor;
  final double sellingPrice;
  final double? weaverRate;

  const AvailableFabricEntity({
    required this.fabricVariantId,
    required this.sku,
    required this.fabricId,
    required this.fabricName,
    this.standardLengthCm,
    this.standardWidthCm,
    this.standardWeightG,
    required this.design,
    required this.warpColor,
    required this.weftColor,
    required this.sellingPrice,
    this.weaverRate,
  });

  String get dimensionsText {
    final l = standardLengthCm?.toStringAsFixed(0) ?? '-';
    final w = standardWidthCm?.toStringAsFixed(0) ?? '-';
    final wt = standardWeightG != null ? '${standardWeightG!.toStringAsFixed(0)}g' : '-';
    return '$l × $w cm · $wt';
  }

  @override
  List<Object?> get props => [
    fabricVariantId,
    sku,
    fabricId,
    fabricName,
    standardLengthCm,
    standardWidthCm,
    standardWeightG,
    design,
    warpColor,
    weftColor,
    sellingPrice,
    weaverRate,
  ];
}
