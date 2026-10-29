import '../../../../core/usecase/usecase.dart';
import '../entities/work_order_entity.dart';
import '../repositories/work_orders_repository.dart';

class GetWorkOrdersParams {
  final String? status;
  final int? weaverId;
  const GetWorkOrdersParams({this.status, this.weaverId});
}

class GetWorkOrdersUseCase implements UseCase<List<WorkOrderEntity>, GetWorkOrdersParams> {
  final WorkOrdersRepository repository;
  GetWorkOrdersUseCase(this.repository);

  @override
  Future<List<WorkOrderEntity>> call(GetWorkOrdersParams params) {
    return repository.getWorkOrders(status: params.status, weaverId: params.weaverId);
  }
}

class GetWorkOrderDetailUseCase implements UseCase<WorkOrderDetailEntity, String> {
  final WorkOrdersRepository repository;
  GetWorkOrderDetailUseCase(this.repository);

  @override
  Future<WorkOrderDetailEntity> call(String zigId) {
    return repository.getWorkOrderDetail(zigId);
  }
}

class GetNextZigIdUseCase implements UseCase<String, NoParams> {
  final WorkOrdersRepository repository;
  GetNextZigIdUseCase(this.repository);

  @override
  Future<String> call(NoParams params) {
    return repository.getNextZigId();
  }
}

class CreateWorkOrderParams {
  final int weaverId;
  final String? zigId;
  final int productId;
  final int warpColorId;
  final int weftColorId;
  final int? designId;
  final double? unitPrice;
  final List<Map<String, dynamic>>? yarnLines;

  const CreateWorkOrderParams({
    required this.weaverId,
    this.zigId,
    required this.productId,
    required this.warpColorId,
    required this.weftColorId,
    this.designId,
    this.unitPrice,
    this.yarnLines,
  });
}

class CreateWorkOrderUseCase implements UseCase<WorkOrderEntity, CreateWorkOrderParams> {
  final WorkOrdersRepository repository;
  CreateWorkOrderUseCase(this.repository);

  @override
  Future<WorkOrderEntity> call(CreateWorkOrderParams params) {
    return repository.createWorkOrder(
      weaverId: params.weaverId,
      zigId: params.zigId,
      productId: params.productId,
      warpColorId: params.warpColorId,
      weftColorId: params.weftColorId,
      designId: params.designId,
      unitPrice: params.unitPrice,
      yarnLines: params.yarnLines,
    );
  }
}

class UpdateWorkOrderStatusParams {
  final String zigId;
  final String status;
  const UpdateWorkOrderStatusParams({required this.zigId, required this.status});
}

class UpdateWorkOrderStatusUseCase implements UseCase<WorkOrderEntity, UpdateWorkOrderStatusParams> {
  final WorkOrdersRepository repository;
  UpdateWorkOrderStatusUseCase(this.repository);

  @override
  Future<WorkOrderEntity> call(UpdateWorkOrderStatusParams params) {
    return repository.updateStatus(params.zigId, params.status);
  }
}

class AddYarnGivenParams {
  final String zigId;
  final List<Map<String, dynamic>> lines;
  const AddYarnGivenParams({required this.zigId, required this.lines});
}

class AddYarnGivenUseCase implements UseCase<void, AddYarnGivenParams> {
  final WorkOrdersRepository repository;
  AddYarnGivenUseCase(this.repository);

  @override
  Future<void> call(AddYarnGivenParams params) {
    return repository.addYarnGiven(zigId: params.zigId, lines: params.lines);
  }
}

class AddFabricReturnParams {
  final String zigId;
  final int? fabricVariantId;
  final int? warpColorId;
  final int? weftColorId;
  final int? designId;
  final int quantityReturned;
  final double totalWeight;
  final double unitPrice;
  final double? lengthCm;
  final double? widthCm;
  final String? remark;

  const AddFabricReturnParams({
    required this.zigId,
    this.fabricVariantId,
    this.warpColorId,
    this.weftColorId,
    this.designId,
    required this.quantityReturned,
    required this.totalWeight,
    required this.unitPrice,
    this.lengthCm,
    this.widthCm,
    this.remark,
  });
}

class AddFabricReturnUseCase implements UseCase<void, AddFabricReturnParams> {
  final WorkOrdersRepository repository;
  AddFabricReturnUseCase(this.repository);

  @override
  Future<void> call(AddFabricReturnParams params) {
    return repository.addFabricReturn(
      zigId: params.zigId,
      fabricVariantId: params.fabricVariantId,
      warpColorId: params.warpColorId,
      weftColorId: params.weftColorId,
      designId: params.designId,
      quantityReturned: params.quantityReturned,
      totalWeight: params.totalWeight,
      unitPrice: params.unitPrice,
      lengthCm: params.lengthCm,
      widthCm: params.widthCm,
      remark: params.remark,
    );
  }
}
