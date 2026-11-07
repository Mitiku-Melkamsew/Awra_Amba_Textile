import 'package:equatable/equatable.dart';
import '../../domain/entities/procurement_entity.dart';

enum ProcurementStatus { initial, loading, success, actionSuccess, error }

class ProcurementState extends Equatable {
  final ProcurementStatus status;
  final List<ProcurementEntity> procurements;
  final String? errorMessage;
  final String? successMessage;

  const ProcurementState({
    this.status = ProcurementStatus.initial,
    this.procurements = const [],
    this.errorMessage,
    this.successMessage,
  });

  ProcurementState copyWith({
    ProcurementStatus? status,
    List<ProcurementEntity>? procurements,
    String? errorMessage,
    String? successMessage,
  }) {
    return ProcurementState(
      status: status ?? this.status,
      procurements: procurements ?? this.procurements,
      errorMessage: errorMessage,
      successMessage: successMessage,
    );
  }

  @override
  List<Object?> get props => [status, procurements, errorMessage, successMessage];
}
