import 'package:equatable/equatable.dart';
import '../../domain/entities/price_entity.dart';

enum PricingStatus { initial, loading, success, actionSuccess, error }

class PricingState extends Equatable {
  final PricingStatus status;
  final List<FabricPriceItemEntity> fabricPrices;
  final List<YarnPriceItemEntity> yarnPrices;
  final String? errorMessage;
  final String? successMessage;

  const PricingState({
    this.status = PricingStatus.initial,
    this.fabricPrices = const [],
    this.yarnPrices = const [],
    this.errorMessage,
    this.successMessage,
  });

  PricingState copyWith({
    PricingStatus? status,
    List<FabricPriceItemEntity>? fabricPrices,
    List<YarnPriceItemEntity>? yarnPrices,
    String? errorMessage,
    String? successMessage,
  }) {
    return PricingState(
      status: status ?? this.status,
      fabricPrices: fabricPrices ?? this.fabricPrices,
      yarnPrices: yarnPrices ?? this.yarnPrices,
      errorMessage: errorMessage,
      successMessage: successMessage,
    );
  }

  @override
  List<Object?> get props => [status, fabricPrices, yarnPrices, errorMessage, successMessage];
}
