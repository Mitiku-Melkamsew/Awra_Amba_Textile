import 'package:equatable/equatable.dart';

abstract class MerchantsEvent extends Equatable {
  const MerchantsEvent();

  @override
  List<Object?> get props => [];
}

class LoadAvailableFabrics extends MerchantsEvent {}

class LoadFabricPrices extends MerchantsEvent {
  final int? fabricId;

  const LoadFabricPrices({this.fabricId});

  @override
  List<Object?> get props => [fabricId];
}
