import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/usecase/usecase.dart';
import '../../domain/usecases/calculate_deduction_usecase.dart';
import '../../domain/usecases/get_catalog_lookup_usecase.dart';
import '../../domain/usecases/get_fabric_variants_usecase.dart';
import '../../domain/usecases/get_yarn_variants_usecase.dart';
import '../../domain/usecases/get_stock_usecase.dart';
import '../../domain/repositories/products_repository.dart';
import 'stock_event.dart';
import 'stock_state.dart';

class StockBloc extends Bloc<StockEvent, StockState> {
  final GetStockUseCase getStockUseCase;
  final GetFabricVariantsUseCase getFabricVariantsUseCase;
  final GetYarnVariantsUseCase getYarnVariantsUseCase;
  final GetCatalogLookupUseCase getCatalogLookupUseCase;
  final CalculateDeductionUseCase calculateDeductionUseCase;
  final ProductsRepository productsRepository;

  StockBloc({
    required this.getStockUseCase,
    required this.getFabricVariantsUseCase,
    required this.getYarnVariantsUseCase,
    required this.getCatalogLookupUseCase,
    required this.calculateDeductionUseCase,
    required this.productsRepository,
  }) : super(const StockState()) {
    on<LoadStockAndCatalog>(_onLoadStockAndCatalog);
    on<RunQualityDeductionCalc>(_onRunQualityDeductionCalc);
  }

  Future<void> _onLoadStockAndCatalog(
    LoadStockAndCatalog event,
    Emitter<StockState> emit,
  ) async {
    emit(state.copyWith(status: StockStatus.loading, errorMessage: null));
    try {
      final fabric = await getFabricVariantsUseCase(const NoParams());
      final yarn = await getYarnVariantsUseCase(const NoParams());
      final lookup = await getCatalogLookupUseCase(const NoParams());

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
      final res = await calculateDeductionUseCase(
        CalculateDeductionParams(
          avgWeight: event.avgWeight,
          unitPrice: event.unitPrice,
          quantity: event.quantity,
          minWeightThreshold: event.minWeightThreshold,
        ),
      );
      emit(state.copyWith(calculationResult: res));
    } catch (e) {
      emit(state.copyWith(
        errorMessage: e.toString().replaceAll('Exception: ', ''),
      ));
    }
  }
}
