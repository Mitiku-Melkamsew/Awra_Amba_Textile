import 'package:flutter_bloc/flutter_bloc.dart';
import '../../domain/usecases/work_orders_usecases.dart';
import '../../domain/repositories/work_orders_repository.dart';
import 'work_orders_event.dart';
import 'work_orders_state.dart';

class WorkOrdersBloc extends Bloc<WorkOrdersEvent, WorkOrdersState> {
  final GetWorkOrdersUseCase getWorkOrdersUseCase;
  final GetWorkOrderDetailUseCase getWorkOrderDetailUseCase;
  final CreateWorkOrderUseCase createWorkOrderUseCase;
  final UpdateWorkOrderStatusUseCase updateWorkOrderStatusUseCase;
  final AddYarnGivenUseCase addYarnGivenUseCase;
  final AddFabricReturnUseCase addFabricReturnUseCase;
  final WorkOrdersRepository workOrdersRepository;

  WorkOrdersBloc({
    required this.getWorkOrdersUseCase,
    required this.getWorkOrderDetailUseCase,
    required this.createWorkOrderUseCase,
    required this.updateWorkOrderStatusUseCase,
    required this.addYarnGivenUseCase,
    required this.addFabricReturnUseCase,
    required this.workOrdersRepository,
  }) : super(const WorkOrdersState()) {
    on<LoadWorkOrders>(_onLoadWorkOrders);
    on<LoadWorkOrderDetail>(_onLoadWorkOrderDetail);
    on<CreateWorkOrderSubmitted>(_onCreateWorkOrderSubmitted);
    on<AddYarnGivenSubmitted>(_onAddYarnGivenSubmitted);
    on<DeleteYarnGivenSubmitted>(_onDeleteYarnGivenSubmitted);
    on<AddFabricReturnSubmitted>(_onAddFabricReturnSubmitted);
    on<DeleteFabricReturnSubmitted>(_onDeleteFabricReturnSubmitted);
    on<UpdateWorkOrderStatusSubmitted>(_onUpdateWorkOrderStatusSubmitted);
    on<MarkWorkOrderReturnedSubmitted>(_onMarkWorkOrderReturnedSubmitted);
    on<CancelWorkOrderSubmitted>(_onCancelWorkOrderSubmitted);
    on<RecordYarnReturnSubmitted>(_onRecordYarnReturnSubmitted);
    on<RecordFabricReturnToWeaverSubmitted>(_onRecordFabricReturnToWeaverSubmitted);
  }

  Future<void> _onLoadWorkOrders(
    LoadWorkOrders event,
    Emitter<WorkOrdersState> emit,
  ) async {
    emit(state.copyWith(
      status: WorkOrdersStatus.loading,
      statusFilter: event.status,
      weaverFilter: event.weaverId,
      errorMessage: null,
    ));
    try {
      final list = await getWorkOrdersUseCase(
        GetWorkOrdersParams(status: event.status, weaverId: event.weaverId),
      );
      emit(state.copyWith(status: WorkOrdersStatus.success, workOrders: list));
    } catch (e) {
      emit(state.copyWith(
        status: WorkOrdersStatus.error,
        errorMessage: e.toString().replaceAll('Exception: ', ''),
      ));
    }
  }

  Future<void> _onLoadWorkOrderDetail(
    LoadWorkOrderDetail event,
    Emitter<WorkOrdersState> emit,
  ) async {
    emit(state.copyWith(status: WorkOrdersStatus.loading, errorMessage: null));
    try {
      final detail = await getWorkOrderDetailUseCase(event.zigId);
      emit(state.copyWith(
        status: WorkOrdersStatus.success,
        selectedDetail: detail,
      ));
    } catch (e) {
      emit(state.copyWith(
        status: WorkOrdersStatus.error,
        errorMessage: e.toString().replaceAll('Exception: ', ''),
      ));
    }
  }

  Future<void> _onCreateWorkOrderSubmitted(
    CreateWorkOrderSubmitted event,
    Emitter<WorkOrdersState> emit,
  ) async {
    emit(state.copyWith(status: WorkOrdersStatus.loading, errorMessage: null));
    try {
      final wo = await createWorkOrderUseCase(
        CreateWorkOrderParams(
          weaverId: event.weaverId,
          zigId: event.zigId,
          productId: event.productId,
          warpColorId: event.warpColorId,
          weftColorId: event.weftColorId,
          designId: event.designId,
          unitPrice: event.unitPrice,
          yarnLines: event.yarnLines,
        ),
      );
      emit(state.copyWith(
        status: WorkOrdersStatus.actionSuccess,
        successMessage: 'Work Order #${wo.zigId} issued successfully',
      ));
    } catch (e) {
      emit(state.copyWith(
        status: WorkOrdersStatus.error,
        errorMessage: e.toString().replaceAll('Exception: ', ''),
      ));
    }
  }

  Future<void> _onAddYarnGivenSubmitted(
    AddYarnGivenSubmitted event,
    Emitter<WorkOrdersState> emit,
  ) async {
    emit(state.copyWith(status: WorkOrdersStatus.loading, errorMessage: null));
    try {
      await addYarnGivenUseCase(
        AddYarnGivenParams(zigId: event.zigId, lines: event.lines),
      );
      final detail = await getWorkOrderDetailUseCase(event.zigId);
      emit(state.copyWith(
        status: WorkOrdersStatus.actionSuccess,
        selectedDetail: detail,
        successMessage: 'Yarn recorded successfully',
      ));
    } catch (e) {
      emit(state.copyWith(
        status: WorkOrdersStatus.error,
        errorMessage: e.toString().replaceAll('Exception: ', ''),
      ));
    }
  }

  Future<void> _onDeleteYarnGivenSubmitted(
    DeleteYarnGivenSubmitted event,
    Emitter<WorkOrdersState> emit,
  ) async {
    emit(state.copyWith(status: WorkOrdersStatus.loading, errorMessage: null));
    try {
      await workOrdersRepository.deleteYarnGiven(event.id);
      final detail = await getWorkOrderDetailUseCase(event.zigId);
      emit(state.copyWith(
        status: WorkOrdersStatus.actionSuccess,
        selectedDetail: detail,
        successMessage: 'Yarn issuance deleted',
      ));
    } catch (e) {
      emit(state.copyWith(
        status: WorkOrdersStatus.error,
        errorMessage: e.toString().replaceAll('Exception: ', ''),
      ));
    }
  }

  Future<void> _onAddFabricReturnSubmitted(
    AddFabricReturnSubmitted event,
    Emitter<WorkOrdersState> emit,
  ) async {
    emit(state.copyWith(status: WorkOrdersStatus.loading, errorMessage: null));
    try {
      await addFabricReturnUseCase(
        AddFabricReturnParams(
          zigId: event.zigId,
          fabricVariantId: event.fabricVariantId,
          warpColorId: event.warpColorId,
          weftColorId: event.weftColorId,
          designId: event.designId,
          quantityReturned: event.quantityReturned,
          totalWeight: event.totalWeight,
          unitPrice: event.unitPrice,
          lengthCm: event.lengthCm,
          widthCm: event.widthCm,
          remark: event.remark,
          isDefective: event.isDefective,
          deductionAmount: event.deductionAmount,
          defectReason: event.defectReason,
        ),
      );
      final detail = await getWorkOrderDetailUseCase(event.zigId);
      emit(state.copyWith(
        status: WorkOrdersStatus.actionSuccess,
        selectedDetail: detail,
        successMessage: 'Fabric return recorded',
      ));
    } catch (e) {
      emit(state.copyWith(
        status: WorkOrdersStatus.error,
        errorMessage: e.toString().replaceAll('Exception: ', ''),
      ));
    }
  }

  Future<void> _onDeleteFabricReturnSubmitted(
    DeleteFabricReturnSubmitted event,
    Emitter<WorkOrdersState> emit,
  ) async {
    emit(state.copyWith(status: WorkOrdersStatus.loading, errorMessage: null));
    try {
      await workOrdersRepository.deleteFabricReturn(event.id);
      final detail = await getWorkOrderDetailUseCase(event.zigId);
      emit(state.copyWith(
        status: WorkOrdersStatus.actionSuccess,
        selectedDetail: detail,
        successMessage: 'Fabric return deleted',
      ));
    } catch (e) {
      emit(state.copyWith(
        status: WorkOrdersStatus.error,
        errorMessage: e.toString().replaceAll('Exception: ', ''),
      ));
    }
  }

  Future<void> _onUpdateWorkOrderStatusSubmitted(
    UpdateWorkOrderStatusSubmitted event,
    Emitter<WorkOrdersState> emit,
  ) async {
    emit(state.copyWith(status: WorkOrdersStatus.loading, errorMessage: null));
    try {
      await updateWorkOrderStatusUseCase(
        UpdateWorkOrderStatusParams(zigId: event.zigId, status: event.status),
      );
      final detail = await getWorkOrderDetailUseCase(event.zigId);
      emit(state.copyWith(
        status: WorkOrdersStatus.actionSuccess,
        selectedDetail: detail,
        successMessage: 'Status updated to ${event.status}',
      ));
    } catch (e) {
      emit(state.copyWith(
        status: WorkOrdersStatus.error,
        errorMessage: e.toString().replaceAll('Exception: ', ''),
      ));
    }
  }

  Future<void> _onMarkWorkOrderReturnedSubmitted(
    MarkWorkOrderReturnedSubmitted event,
    Emitter<WorkOrdersState> emit,
  ) async {
    emit(state.copyWith(status: WorkOrdersStatus.loading, errorMessage: null));
    try {
      await workOrdersRepository.markReturned(event.zigId);
      final detail = await getWorkOrderDetailUseCase(event.zigId);
      emit(state.copyWith(
        status: WorkOrdersStatus.actionSuccess,
        selectedDetail: detail,
        successMessage: 'Zig #${event.zigId} marked as returned',
      ));
    } catch (e) {
      emit(state.copyWith(
        status: WorkOrdersStatus.error,
        errorMessage: e.toString().replaceAll('Exception: ', ''),
      ));
    }
  }

  Future<void> _onCancelWorkOrderSubmitted(
    CancelWorkOrderSubmitted event,
    Emitter<WorkOrdersState> emit,
  ) async {
    emit(state.copyWith(status: WorkOrdersStatus.loading, errorMessage: null));
    try {
      await workOrdersRepository.cancel(event.zigId);
      final detail = await getWorkOrderDetailUseCase(event.zigId);
      emit(state.copyWith(
        status: WorkOrdersStatus.actionSuccess,
        selectedDetail: detail,
        successMessage: 'Zig #${event.zigId} cancelled successfully',
      ));
    } catch (e) {
      emit(state.copyWith(
        status: WorkOrdersStatus.error,
        errorMessage: e.toString().replaceAll('Exception: ', ''),
      ));
    }
  }

  Future<void> _onRecordYarnReturnSubmitted(
    RecordYarnReturnSubmitted event,
    Emitter<WorkOrdersState> emit,
  ) async {
    emit(state.copyWith(status: WorkOrdersStatus.loading, errorMessage: null));
    try {
      await workOrdersRepository.recordYarnReturn(
        zigId: event.zigId,
        yarnVariantId: event.yarnVariantId,
        quantity: event.quantity,
        remark: event.remark,
      );
      final detail = await getWorkOrderDetailUseCase(event.zigId);
      emit(state.copyWith(
        status: WorkOrdersStatus.actionSuccess,
        selectedDetail: detail,
        successMessage: 'Unused yarn return recorded',
      ));
    } catch (e) {
      emit(state.copyWith(
        status: WorkOrdersStatus.error,
        errorMessage: e.toString().replaceAll('Exception: ', ''),
      ));
    }
  }

  Future<void> _onRecordFabricReturnToWeaverSubmitted(
    RecordFabricReturnToWeaverSubmitted event,
    Emitter<WorkOrdersState> emit,
  ) async {
    emit(state.copyWith(status: WorkOrdersStatus.loading, errorMessage: null));
    try {
      await workOrdersRepository.recordFabricReturnToWeaver(
        zigId: event.zigId,
        fabricVariantId: event.fabricVariantId,
        quantity: event.quantity,
        remark: event.remark,
      );
      final detail = await getWorkOrderDetailUseCase(event.zigId);
      emit(state.copyWith(
        status: WorkOrdersStatus.actionSuccess,
        selectedDetail: detail,
        successMessage: 'Fabric returned to weaver (rejected) recorded',
      ));
    } catch (e) {
      emit(state.copyWith(
        status: WorkOrdersStatus.error,
        errorMessage: e.toString().replaceAll('Exception: ', ''),
      ));
    }
  }
}
