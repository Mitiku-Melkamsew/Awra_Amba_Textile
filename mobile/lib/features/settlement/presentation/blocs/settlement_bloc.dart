import 'package:flutter_bloc/flutter_bloc.dart';
import '../../domain/entities/settlement_entity.dart';
import '../../domain/usecases/settlement_usecases.dart';
import '../../domain/repositories/settlement_repository.dart';
import 'settlement_event.dart';
import 'settlement_state.dart';

class SettlementBloc extends Bloc<SettlementEvent, SettlementState> {
  final GenerateBatchPreviewUseCase generateBatchPreviewUseCase;
  final GetSettlementPreviewUseCase getSettlementPreviewUseCase;
  final CommitBatchUseCase commitBatchUseCase;
  final SettlementRepository settlementRepository;

  SettlementBloc({
    required this.generateBatchPreviewUseCase,
    required this.getSettlementPreviewUseCase,
    required this.commitBatchUseCase,
    required this.settlementRepository,
  }) : super(const SettlementState()) {
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
      final preview = await generateBatchPreviewUseCase(
        GenerateBatchPreviewParams(
          cutoffDate: cutoff != null && cutoff.isNotEmpty ? cutoff : null,
        ),
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
      final preview = await getSettlementPreviewUseCase(event.previewId);
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
      final result = await commitBatchUseCase(
        CommitBatchParams(
          previewId: event.previewId,
          paymentMethod: event.paymentMethod,
          cutoffDate: event.cutoffDate ?? state.cutoffDate,
        ),
      );

      final paymentsJson = result['payments'] as List? ?? [];
      final payments = paymentsJson
          .map((e) => CommittedPaymentResultEntity(
                paymentId: e['paymentId'] is int
                    ? e['paymentId']
                    : int.tryParse(e['paymentId'].toString()) ?? 0,
                weaverId: e['weaverId'] is int
                    ? e['weaverId']
                    : int.tryParse(e['weaverId'].toString()) ?? 0,
                weaverName: e['weaverName'] ?? '',
                amount: double.tryParse(e['amount']?.toString() ?? '0') ?? 0.0,
                reconciledZigIds: (e['reconciledZigIds'] as List?)
                        ?.map((z) => z.toString())
                        .toList() ??
                    [],
              ))
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
