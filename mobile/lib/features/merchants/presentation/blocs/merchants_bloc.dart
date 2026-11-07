import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/usecase/usecase.dart';
import '../../domain/usecases/merchants_usecases.dart';
import 'merchants_event.dart';
import 'merchants_state.dart';

class MerchantsBloc extends Bloc<MerchantsEvent, MerchantsState> {
  final GetAvailableFabricsUseCase getAvailableFabricsUseCase;
  final GetFabricPricesUseCase getFabricPricesUseCase;

  MerchantsBloc({
    required this.getAvailableFabricsUseCase,
    required this.getFabricPricesUseCase,
  }) : super(const MerchantsState()) {
    on<LoadAvailableFabrics>(_onLoadAvailableFabrics);
    on<LoadFabricPrices>(_onLoadFabricPrices);
  }

  Future<void> _onLoadAvailableFabrics(
    LoadAvailableFabrics event,
    Emitter<MerchantsState> emit,
  ) async {
    emit(state.copyWith(status: MerchantsStatus.loading, errorMessage: null));
    try {
      final fabrics = await getAvailableFabricsUseCase(const NoParams());
      emit(state.copyWith(
        status: MerchantsStatus.success,
        availableFabrics: fabrics,
      ));
    } catch (e) {
      emit(state.copyWith(
        status: MerchantsStatus.error,
        errorMessage: e.toString().replaceAll('Exception: ', ''),
      ));
    }
  }

  Future<void> _onLoadFabricPrices(
    LoadFabricPrices event,
    Emitter<MerchantsState> emit,
  ) async {
    emit(state.copyWith(status: MerchantsStatus.loading, errorMessage: null));
    try {
      final prices = await getFabricPricesUseCase(event.fabricId);
      emit(state.copyWith(
        status: MerchantsStatus.success,
        fabricPrices: prices,
      ));
    } catch (e) {
      emit(state.copyWith(
        status: MerchantsStatus.error,
        errorMessage: e.toString().replaceAll('Exception: ', ''),
      ));
    }
  }
}
