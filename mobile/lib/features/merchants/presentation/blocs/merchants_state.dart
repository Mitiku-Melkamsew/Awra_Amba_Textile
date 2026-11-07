import 'package:equatable/equatable.dart';
import '../../domain/entities/available_fabric_entity.dart';
import '../../domain/entities/fabric_price_entity.dart';

enum MerchantsStatus { initial, loading, success, error }

class MerchantsState extends Equatable {
  final MerchantsStatus status;
  final List<AvailableFabricEntity> availableFabrics;
  final List<FabricPriceEntity> fabricPrices;
  final String? errorMessage;

  const MerchantsState({
    this.status = MerchantsStatus.initial,
    this.availableFabrics = const [],
    this.fabricPrices = const [],
    this.errorMessage,
  });

  MerchantsState copyWith({
    MerchantsStatus? status,
    List<AvailableFabricEntity>? availableFabrics,
    List<FabricPriceEntity>? fabricPrices,
    String? errorMessage,
  }) {
    return MerchantsState(
      status: status ?? this.status,
      availableFabrics: availableFabrics ?? this.availableFabrics,
      fabricPrices: fabricPrices ?? this.fabricPrices,
      errorMessage: errorMessage,
    );
  }

  @override
  List<Object?> get props => [
    status,
    availableFabrics,
    fabricPrices,
    errorMessage,
  ];
}
