import 'package:equatable/equatable.dart';

abstract class SettlementEvent extends Equatable {
  const SettlementEvent();
  @override
  List<Object?> get props => [];
}

class CutoffDateChanged extends SettlementEvent {
  final String cutoffDate;
  const CutoffDateChanged(this.cutoffDate);

  @override
  List<Object?> get props => [cutoffDate];
}

class GeneratePreviewRequested extends SettlementEvent {
  final String? cutoffDate;
  const GeneratePreviewRequested({this.cutoffDate});

  @override
  List<Object?> get props => [cutoffDate];
}

class LoadSettlementPreviewDetail extends SettlementEvent {
  final String previewId;
  const LoadSettlementPreviewDetail(this.previewId);

  @override
  List<Object?> get props => [previewId];
}

class CommitBatchSettlementSubmitted extends SettlementEvent {
  final String previewId;
  final String? paymentMethod;
  final String? cutoffDate;

  const CommitBatchSettlementSubmitted({
    required this.previewId,
    this.paymentMethod,
    this.cutoffDate,
  });

  @override
  List<Object?> get props => [previewId, paymentMethod, cutoffDate];
}
