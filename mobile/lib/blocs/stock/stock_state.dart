import 'package:equatable/equatable.dart';
import '../../models/stock_item.dart';

enum StockStatus { initial, loading, success, error }

class StockState extends Equatable {
  final StockStatus status;
  final List<FabricVariant> fabricVariants;
  final List<YarnVariant> yarnVariants;
  final CatalogLookup? lookup;
  final Map<String, dynamic>? calculationResult;
  final String? errorMessage;

  const StockState({
    this.status = StockStatus.initial,
    this.fabricVariants = const [],
    this.yarnVariants = const [],
    this.lookup,
    this.calculationResult,
    this.errorMessage,
  });

  StockState copyWith({
    StockStatus? status,
    List<FabricVariant>? fabricVariants,
    List<YarnVariant>? yarnVariants,
    CatalogLookup? lookup,
    Map<String, dynamic>? calculationResult,
    String? errorMessage,
  }) {
    return StockState(
      status: status ?? this.status,
      fabricVariants: fabricVariants ?? this.fabricVariants,
      yarnVariants: yarnVariants ?? this.yarnVariants,
      lookup: lookup ?? this.lookup,
      calculationResult: calculationResult ?? this.calculationResult,
      errorMessage: errorMessage ?? this.errorMessage,
    );
  }

  @override
  List<Object?> get props => [
        status,
        fabricVariants,
        yarnVariants,
        lookup,
        calculationResult,
        errorMessage,
      ];
}
