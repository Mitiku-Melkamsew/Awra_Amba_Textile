import 'package:equatable/equatable.dart';

abstract class StockEvent extends Equatable {
  const StockEvent();

  @override
  List<Object?> get props => [];
}

class LoadStockAndCatalog extends StockEvent {}

class RunQualityDeductionCalc extends StockEvent {
  final double avgWeight;
  final double unitPrice;
  final int quantity;
  final double minWeightThreshold;

  const RunQualityDeductionCalc({
    required this.avgWeight,
    required this.unitPrice,
    required this.quantity,
    required this.minWeightThreshold,
  });

  @override
  List<Object?> get props => [
        avgWeight,
        unitPrice,
        quantity,
        minWeightThreshold,
      ];
}
