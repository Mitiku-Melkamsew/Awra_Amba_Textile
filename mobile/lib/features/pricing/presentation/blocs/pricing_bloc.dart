import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/usecase/usecase.dart';
import '../../domain/usecases/pricing_usecases.dart';
import 'pricing_event.dart';
import 'pricing_state.dart';

class PricingBloc extends Bloc<PricingEvent, PricingState> {
  final GetPricingFabricPricesUseCase getFabricPricesUseCase;
  final CreateFabricPriceUseCase createFabricPriceUseCase;
  final GetYarnPricesUseCase getYarnPricesUseCase;
  final CreateYarnPriceUseCase createYarnPriceUseCase;

  PricingBloc({
    required this.getFabricPricesUseCase,
    required this.createFabricPriceUseCase,
    required this.getYarnPricesUseCase,
    required this.createYarnPriceUseCase,
  }) : super(const PricingState()) {
    on<LoadPrices>(_onLoadPrices);
    on<CreateFabricPriceSubmitted>(_onCreateFabricPriceSubmitted);
    on<CreateYarnPriceSubmitted>(_onCreateYarnPriceSubmitted);
  }

  Future<void> _onLoadPrices(
    LoadPrices event,
    Emitter<PricingState> emit,
  ) async {
    emit(state.copyWith(status: PricingStatus.loading, errorMessage: null));
    try {
      final fabrics = await getFabricPricesUseCase(const NoParams());
      final yarns = await getYarnPricesUseCase(const NoParams());
      emit(state.copyWith(
        status: PricingStatus.success,
        fabricPrices: fabrics,
        yarnPrices: yarns,
      ));
    } catch (e) {
      emit(state.copyWith(
        status: PricingStatus.error,
        errorMessage: e.toString().replaceAll('Exception: ', ''),
      ));
    }
  }

  Future<void> _onCreateFabricPriceSubmitted(
    CreateFabricPriceSubmitted event,
    Emitter<PricingState> emit,
  ) async {
    emit(state.copyWith(status: PricingStatus.loading, errorMessage: null));
    try {
      await createFabricPriceUseCase(
        CreateFabricPriceParams(
          fabricVariantId: event.fabricVariantId,
          unitPrice: event.unitPrice,
          effectiveDate: event.effectiveDate,
        ),
      );
      final fabrics = await getFabricPricesUseCase(const NoParams());
      final yarns = await getYarnPricesUseCase(const NoParams());
      emit(state.copyWith(
        status: PricingStatus.actionSuccess,
        fabricPrices: fabrics,
        yarnPrices: yarns,
        successMessage: 'New fabric wholesale price version saved',
      ));
    } catch (e) {
      emit(state.copyWith(
        status: PricingStatus.error,
        errorMessage: e.toString().replaceAll('Exception: ', ''),
      ));
    }
  }

  Future<void> _onCreateYarnPriceSubmitted(
    CreateYarnPriceSubmitted event,
    Emitter<PricingState> emit,
  ) async {
    emit(state.copyWith(status: PricingStatus.loading, errorMessage: null));
    try {
      await createYarnPriceUseCase(
        CreateYarnPriceParams(
          yarnVariantId: event.yarnVariantId,
          costPerKg: event.costPerKg,
          effectiveDate: event.effectiveDate,
        ),
      );
      final fabrics = await getFabricPricesUseCase(const NoParams());
      final yarns = await getYarnPricesUseCase(const NoParams());
      emit(state.copyWith(
        status: PricingStatus.actionSuccess,
        fabricPrices: fabrics,
        yarnPrices: yarns,
        successMessage: 'New yarn standard cost version saved',
      ));
    } catch (e) {
      emit(state.copyWith(
        status: PricingStatus.error,
        errorMessage: e.toString().replaceAll('Exception: ', ''),
      ));
    }
  }
}
