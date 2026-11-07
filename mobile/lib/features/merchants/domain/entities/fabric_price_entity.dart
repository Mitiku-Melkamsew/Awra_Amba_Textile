import 'package:equatable/equatable.dart';

class FabricPriceEntity extends Equatable {
  final int fabricPriceId;
  final int fabricId;
  final String fabricName;
  final double sellingPrice;
  final double? weaverRate;
  final String effectiveFrom;
  final String? effectiveTo;
  final bool isActive;
  final double? standardLengthCm;
  final double? standardWidthCm;
  final double? standardWeightG;

  const FabricPriceEntity({
    required this.fabricPriceId,
    required this.fabricId,
    required this.fabricName,
    required this.sellingPrice,
    this.weaverRate,
    required this.effectiveFrom,
    this.effectiveTo,
    this.isActive = true,
    this.standardLengthCm,
    this.standardWidthCm,
    this.standardWeightG,
  });

  String get specsText {
    final l = standardLengthCm?.toStringAsFixed(0) ?? '-';
    final w = standardWidthCm?.toStringAsFixed(0) ?? '-';
    final wt = standardWeightG != null ? '${standardWeightG!.toStringAsFixed(0)}g' : '-';
    return '$l × $w cm · $wt';
  }

  @override
  List<Object?> get props => [
    fabricPriceId,
    fabricId,
    fabricName,
    sellingPrice,
    weaverRate,
    effectiveFrom,
    effectiveTo,
    isActive,
    standardLengthCm,
    standardWidthCm,
    standardWeightG,
  ];
}
