import 'package:flutter_bloc/flutter_bloc.dart';
import '../../repositories/stock_repository.dart';
import 'stock_event.dart';
import 'stock_state.dart';

class StockBloc extends Bloc<StockEvent, StockState> {
  final StockRepository stockRepository;

  StockBloc({required this.stockRepository}) : super(const StockState()) {
    on<LoadStockAndCatalog>(_onLoadStockAndCatalog);
    on<RunQualityDeductionCalc>(_onRunQualityDeductionCalc);
  }

  Future<void> _onLoadStockAndCatalog(
    LoadStockAndCatalog event,
    Emitter<StockState> emit,
  ) async {
    emit(state.copyWith(status: StockStatus.loading, errorMessage: null));
    try {
      final fabric = await stockRepository.getFabricVariants();
      final yarn = await stockRepository.getYarnVariants();
      final lookup = await stockRepository.getCatalogLookup();

      emit(state.copyWith(
        status: StockStatus.success,
        fabricVariants: fabric,
        yarnVariants: yarn,
        lookup: lookup,
      ));
    } catch (e) {
      emit(state.copyWith(
        status: StockStatus.error,
        errorMessage: e.toString().replaceAll('Exception: ', ''),
      ));
    }
  }

  Future<void> _onRunQualityDeductionCalc(
    RunQualityDeductionCalc event,
    Emitter<StockState> emit,
  ) async {
    try {
      final res = await stockRepository.calculateDeduction(
        avgWeight: event.avgWeight,
        unitPrice: event.unitPrice,
        quantity: event.quantity,
        minWeightThreshold: event.minWeightThreshold,
      );
      emit(state.copyWith(calculationResult: res));
    } catch (e) {
      emit(state.copyWith(
        errorMessage: e.toString().replaceAll('Exception: ', ''),
      ));
    }
  }
}
