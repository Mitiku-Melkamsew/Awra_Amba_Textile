import 'package:equatable/equatable.dart';
import '../../domain/entities/work_order_entity.dart';

enum WorkOrdersStatus { initial, loading, success, actionSuccess, error }

class WorkOrdersState extends Equatable {
  final WorkOrdersStatus status;
  final List<WorkOrderEntity> workOrders;
  final WorkOrderDetailEntity? selectedDetail;
  final String? statusFilter;
  final int? weaverFilter;
  final String? errorMessage;
  final String? successMessage;

  WorkOrderDetailEntity? get selectedWorkOrder => selectedDetail;

  const WorkOrdersState({
    this.status = WorkOrdersStatus.initial,
    this.workOrders = const [],
    this.selectedDetail,
    this.statusFilter,
    this.weaverFilter,
    this.errorMessage,
    this.successMessage,
  });

  WorkOrdersState copyWith({
    WorkOrdersStatus? status,
    List<WorkOrderEntity>? workOrders,
    WorkOrderDetailEntity? selectedDetail,
    String? statusFilter,
    int? weaverFilter,
    String? errorMessage,
    String? successMessage,
  }) {
    return WorkOrdersState(
      status: status ?? this.status,
      workOrders: workOrders ?? this.workOrders,
      selectedDetail: selectedDetail ?? this.selectedDetail,
      statusFilter: statusFilter ?? this.statusFilter,
      weaverFilter: weaverFilter ?? this.weaverFilter,
      errorMessage: errorMessage ?? this.errorMessage,
      successMessage: successMessage ?? this.successMessage,
    );
  }

  @override
  List<Object?> get props => [
        status,
        workOrders,
        selectedDetail,
        statusFilter,
        weaverFilter,
        errorMessage,
        successMessage,
      ];
}
