import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/usecase/usecase.dart';
import '../../domain/usecases/quality_rules_usecases.dart';
import 'quality_rules_event.dart';
import 'quality_rules_state.dart';

class QualityRulesBloc extends Bloc<QualityRulesEvent, QualityRulesState> {
  final GetQualityRulesUseCase getQualityRulesUseCase;
  final CreateQualityRuleUseCase createQualityRuleUseCase;
  final UpdateQualityRuleUseCase updateQualityRuleUseCase;

  QualityRulesBloc({
    required this.getQualityRulesUseCase,
    required this.createQualityRuleUseCase,
    required this.updateQualityRuleUseCase,
  }) : super(const QualityRulesState()) {
    on<LoadQualityRules>(_onLoadQualityRules);
    on<CreateQualityRuleSubmitted>(_onCreateQualityRuleSubmitted);
    on<ToggleQualityRuleStatusSubmitted>(_onToggleQualityRuleStatusSubmitted);
  }

  Future<void> _onLoadQualityRules(
    LoadQualityRules event,
    Emitter<QualityRulesState> emit,
  ) async {
    emit(state.copyWith(status: QualityRulesStatus.loading, errorMessage: null));
    try {
      final list = await getQualityRulesUseCase(const NoParams());
      emit(state.copyWith(
        status: QualityRulesStatus.success,
        rules: list,
      ));
    } catch (e) {
      emit(state.copyWith(
        status: QualityRulesStatus.error,
        errorMessage: e.toString().replaceAll('Exception: ', ''),
      ));
    }
  }

  Future<void> _onCreateQualityRuleSubmitted(
    CreateQualityRuleSubmitted event,
    Emitter<QualityRulesState> emit,
  ) async {
    emit(state.copyWith(status: QualityRulesStatus.loading, errorMessage: null));
    try {
      await createQualityRuleUseCase(
        CreateQualityRuleParams(
          factor: event.factor,
          unit: event.unit,
          deductionPerUnit: event.deductionPerUnit,
        ),
      );
      final list = await getQualityRulesUseCase(const NoParams());
      emit(state.copyWith(
        status: QualityRulesStatus.actionSuccess,
        rules: list,
        successMessage: 'Created quality deduction rule',
      ));
    } catch (e) {
      emit(state.copyWith(
        status: QualityRulesStatus.error,
        errorMessage: e.toString().replaceAll('Exception: ', ''),
      ));
    }
  }

  Future<void> _onToggleQualityRuleStatusSubmitted(
    ToggleQualityRuleStatusSubmitted event,
    Emitter<QualityRulesState> emit,
  ) async {
    emit(state.copyWith(status: QualityRulesStatus.loading, errorMessage: null));
    try {
      await updateQualityRuleUseCase(
        UpdateQualityRuleParams(
          id: event.id,
          isActive: event.newStatus,
        ),
      );
      final list = await getQualityRulesUseCase(const NoParams());
      emit(state.copyWith(
        status: QualityRulesStatus.actionSuccess,
        rules: list,
        successMessage: 'Updated quality rule status',
      ));
    } catch (e) {
      emit(state.copyWith(
        status: QualityRulesStatus.error,
        errorMessage: e.toString().replaceAll('Exception: ', ''),
      ));
    }
  }
}
