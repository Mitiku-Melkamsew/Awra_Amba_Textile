import 'package:equatable/equatable.dart';
import '../../models/settlement_preview.dart';

enum SettlementStatus { initial, previewing, previewSuccess, committing, committed, error }

class SettlementState extends Equatable {
  final SettlementStatus status;
  final BatchSettlementPreview? preview;
  final String? cutoffDate;
  final List<CommittedPaymentResult> committedPayments;
  final double? committedGrandTotal;
  final String? errorMessage;
  final String? successMessage;

  const SettlementState({
    this.status = SettlementStatus.initial,
    this.preview,
    this.cutoffDate,
    this.committedPayments = const [],
    this.committedGrandTotal,
    this.errorMessage,
    this.successMessage,
  });

  SettlementState copyWith({
    SettlementStatus? status,
    BatchSettlementPreview? preview,
    String? cutoffDate,
    List<CommittedPaymentResult>? committedPayments,
    double? committedGrandTotal,
    String? errorMessage,
    String? successMessage,
  }) {
    return SettlementState(
      status: status ?? this.status,
      preview: preview ?? this.preview,
      cutoffDate: cutoffDate ?? this.cutoffDate,
      committedPayments: committedPayments ?? this.committedPayments,
      committedGrandTotal: committedGrandTotal ?? this.committedGrandTotal,
      errorMessage: errorMessage ?? this.errorMessage,
      successMessage: successMessage ?? this.successMessage,
    );
  }

  @override
  List<Object?> get props => [
        status,
        preview,
        cutoffDate,
        committedPayments,
        committedGrandTotal,
        errorMessage,
        successMessage,
      ];
}
