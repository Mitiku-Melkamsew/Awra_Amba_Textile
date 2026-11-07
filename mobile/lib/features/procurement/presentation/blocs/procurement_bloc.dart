import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/usecase/usecase.dart';
import '../../domain/usecases/procurement_usecases.dart';
import 'procurement_event.dart';
import 'procurement_state.dart';

class ProcurementBloc extends Bloc<ProcurementEvent, ProcurementState> {
  final GetYarnPurchasesUseCase getYarnPurchasesUseCase;
  final CreateYarnPurchaseUseCase createYarnPurchaseUseCase;

  ProcurementBloc({
    required this.getYarnPurchasesUseCase,
    required this.createYarnPurchaseUseCase,
  }) : super(const ProcurementState()) {
    on<LoadProcurements>(_onLoadProcurements);
    on<CreateProcurementSubmitted>(_onCreateProcurementSubmitted);
  }

  Future<void> _onLoadProcurements(
    LoadProcurements event,
    Emitter<ProcurementState> emit,
  ) async {
    emit(state.copyWith(status: ProcurementStatus.loading, errorMessage: null));
    try {
      final list = await getYarnPurchasesUseCase(const NoParams());
      emit(state.copyWith(
        status: ProcurementStatus.success,
        procurements: list,
      ));
    } catch (e) {
      emit(state.copyWith(
        status: ProcurementStatus.error,
        errorMessage: e.toString().replaceAll('Exception: ', ''),
      ));
    }
  }

  Future<void> _onCreateProcurementSubmitted(
    CreateProcurementSubmitted event,
    Emitter<ProcurementState> emit,
  ) async {
    emit(state.copyWith(status: ProcurementStatus.loading, errorMessage: null));
    try {
      final created = await createYarnPurchaseUseCase(
        CreateYarnPurchaseParams(
          supplierId: event.supplierId,
          purchaseDate: event.purchaseDate,
          notes: event.notes,
          lines: event.lines,
        ),
      );
      final list = await getYarnPurchasesUseCase(const NoParams());
      emit(state.copyWith(
        status: ProcurementStatus.actionSuccess,
        procurements: list,
        successMessage: 'Recorded Yarn Purchase #${created.procurementId}',
      ));
    } catch (e) {
      emit(state.copyWith(
        status: ProcurementStatus.error,
        errorMessage: e.toString().replaceAll('Exception: ', ''),
      ));
    }
  }
}
