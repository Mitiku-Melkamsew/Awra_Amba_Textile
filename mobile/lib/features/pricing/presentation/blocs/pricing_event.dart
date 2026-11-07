import 'package:equatable/equatable.dart';

abstract class PricingEvent extends Equatable {
  const PricingEvent();

  @override
  List<Object?> get props => [];
}

class LoadPrices extends PricingEvent {}

class CreateFabricPriceSubmitted extends PricingEvent {
  final int fabricVariantId;
  final double unitPrice;
  final String? effectiveDate;

  const CreateFabricPriceSubmitted({
    required this.fabricVariantId,
    required this.unitPrice,
    this.effectiveDate,
  });

  @override
  List<Object?> get props => [fabricVariantId, unitPrice, effectiveDate];
}

class CreateYarnPriceSubmitted extends PricingEvent {
  final int yarnVariantId;
  final double costPerKg;
  final String? effectiveDate;

  const CreateYarnPriceSubmitted({
    required this.yarnVariantId,
    required this.costPerKg,
    this.effectiveDate,
  });

  @override
  List<Object?> get props => [yarnVariantId, costPerKg, effectiveDate];
}
