import 'package:flutter_bloc/flutter_bloc.dart';
import '../../models/settlement_preview.dart';
import '../../repositories/settlement_repository.dart';
import 'settlement_event.dart';
import 'settlement_state.dart';

class SettlementBloc extends Bloc<SettlementEvent, SettlementState> {
  final SettlementRepository settlementRepository;

  SettlementBloc({required this.settlementRepository})
      : super(const SettlementState()) {
    on<GeneratePreviewRequested>(_onGeneratePreviewRequested);
    on<CutoffDateChanged>(_onCutoffDateChanged);
    on<LoadSettlementPreviewDetail>(_onLoadSettlementPreviewDetail);
    on<CommitBatchSettlementSubmitted>(_onCommitBatchSettlementSubmitted);
  }

  void _onCutoffDateChanged(
    CutoffDateChanged event,
    Emitter<SettlementState> emit,
  ) {
    emit(state.copyWith(cutoffDate: event.cutoffDate));
  }

  Future<void> _onGeneratePreviewRequested(
    GeneratePreviewRequested event,
    Emitter<SettlementState> emit,
  ) async {
    emit(state.copyWith(
      status: SettlementStatus.previewing,
      errorMessage: null,
      successMessage: null,
    ));
    try {
      final cutoff = event.cutoffDate ?? state.cutoffDate;
      final preview = await settlementRepository.generateBatchPreview(
        cutoffDate: cutoff != null && cutoff.isNotEmpty ? cutoff : null,
      );
      emit(state.copyWith(
        status: SettlementStatus.previewSuccess,
        preview: preview,
        cutoffDate: cutoff,
        successMessage:
            'Generated payroll preview for ${preview.weaverCount} weavers.',
      ));
    } catch (e) {
      emit(state.copyWith(
        status: SettlementStatus.error,
        errorMessage: e.toString().replaceAll('Exception: ', ''),
      ));
    }
  }

  Future<void> _onLoadSettlementPreviewDetail(
    LoadSettlementPreviewDetail event,
    Emitter<SettlementState> emit,
  ) async {
    emit(state.copyWith(status: SettlementStatus.previewing, errorMessage: null));
    try {
      final preview = await settlementRepository.getPreview(event.previewId);
      emit(state.copyWith(
        status: SettlementStatus.previewSuccess,
        preview: preview,
      ));
    } catch (e) {
      emit(state.copyWith(
        status: SettlementStatus.error,
        errorMessage: e.toString().replaceAll('Exception: ', ''),
      ));
    }
  }

  Future<void> _onCommitBatchSettlementSubmitted(
    CommitBatchSettlementSubmitted event,
    Emitter<SettlementState> emit,
  ) async {
    emit(state.copyWith(
      status: SettlementStatus.committing,
      errorMessage: null,
      successMessage: null,
    ));
    try {
      final result = await settlementRepository.commitBatch(
        previewId: event.previewId,
        paymentMethod: event.paymentMethod,
        cutoffDate: event.cutoffDate ?? state.cutoffDate,
      );

      final paymentsJson = result['payments'] as List? ?? [];
      final payments = paymentsJson
          .map((e) => CommittedPaymentResult.fromJson(e))
          .toList();
      final grandTotal =
          double.tryParse(result['grandTotal']?.toString() ?? '0') ?? 0.0;

      emit(state.copyWith(
        status: SettlementStatus.committed,
        committedPayments: payments,
        committedGrandTotal: grandTotal,
        successMessage:
            'Recorded ${payments.length} payments totaling ${grandTotal.round()} ETB.',
      ));
    } catch (e) {
      emit(state.copyWith(
        status: SettlementStatus.error,
        errorMessage: e.toString().replaceAll('Exception: ', ''),
      ));
    }
  }
}
