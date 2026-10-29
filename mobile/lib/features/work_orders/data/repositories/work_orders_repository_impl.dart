import '../../domain/entities/work_order_entity.dart';
import '../../domain/repositories/work_orders_repository.dart';
import '../datasources/work_orders_remote_data_source.dart';

class WorkOrdersRepositoryImpl implements WorkOrdersRepository {
  final WorkOrdersRemoteDataSource remoteDataSource;

  WorkOrdersRepositoryImpl({required this.remoteDataSource});

  @override
  Future<List<WorkOrderEntity>> getWorkOrders({String? status, int? weaverId}) =>
      remoteDataSource.getWorkOrders(status: status, weaverId: weaverId);

  @override
  Future<WorkOrderDetailEntity> getWorkOrderDetail(String zigId) =>
      remoteDataSource.getWorkOrderDetail(zigId);

  @override
  Future<String> getNextZigId() =>
      remoteDataSource.getNextZigId();

  @override
  Future<WorkOrderEntity> createWorkOrder({
    required int weaverId,
    String? zigId,
    required int productId,
    required int warpColorId,
    required int weftColorId,
    int? designId,
    double? unitPrice,
    List<Map<String, dynamic>>? yarnLines,
  }) =>
      remoteDataSource.createWorkOrder(
        weaverId: weaverId,
        zigId: zigId,
        productId: productId,
        warpColorId: warpColorId,
        weftColorId: weftColorId,
        designId: designId,
        unitPrice: unitPrice,
        yarnLines: yarnLines,
      );

  @override
  Future<WorkOrderEntity> updateStatus(String zigId, String status) =>
      remoteDataSource.updateStatus(zigId, status);

  @override
  Future<void> addYarnGiven({
    required String zigId,
    required List<Map<String, dynamic>> lines,
  }) =>
      remoteDataSource.addYarnGiven(zigId: zigId, lines: lines);

  @override
  Future<void> addFabricReturn({
    required String zigId,
    int? fabricVariantId,
    int? warpColorId,
    int? weftColorId,
    int? designId,
    required int quantityReturned,
    required double totalWeight,
    required double unitPrice,
    double? lengthCm,
    double? widthCm,
    String? remark,
  }) =>
      remoteDataSource.addFabricReturn(
        zigId: zigId,
        fabricVariantId: fabricVariantId,
        warpColorId: warpColorId,
        weftColorId: weftColorId,
        designId: designId,
        quantityReturned: quantityReturned,
        totalWeight: totalWeight,
        unitPrice: unitPrice,
        lengthCm: lengthCm,
        widthCm: widthCm,
        remark: remark,
      );
}
