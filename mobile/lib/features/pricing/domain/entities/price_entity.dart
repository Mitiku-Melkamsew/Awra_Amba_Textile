import 'package:equatable/equatable.dart';

class FabricPriceItemEntity extends Equatable {
  final int id;
  final int fabricVariantId;
  final String fabricName;
  final double unitPrice;
  final String effectiveDate;
  final bool isActive;

  const FabricPriceItemEntity({
    required this.id,
    required this.fabricVariantId,
    this.fabricName = '',
    required this.unitPrice,
    required this.effectiveDate,
    this.isActive = true,
  });

  @override
  List<Object?> get props => [id, fabricVariantId, fabricName, unitPrice, effectiveDate, isActive];
}

class YarnPriceItemEntity extends Equatable {
  final int id;
  final int yarnVariantId;
  final String yarnName;
  final double costPerKg;
  final String effectiveDate;
  final bool isActive;

  const YarnPriceItemEntity({
    required this.id,
    required this.yarnVariantId,
    this.yarnName = '',
    required this.costPerKg,
    required this.effectiveDate,
    this.isActive = true,
  });

  @override
  List<Object?> get props => [id, yarnVariantId, yarnName, costPerKg, effectiveDate, isActive];
}
