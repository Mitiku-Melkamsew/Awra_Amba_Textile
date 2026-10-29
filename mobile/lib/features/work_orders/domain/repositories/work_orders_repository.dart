import '../entities/work_order_entity.dart';

abstract class WorkOrdersRepository {
  Future<List<WorkOrderEntity>> getWorkOrders({String? status, int? weaverId});
  Future<WorkOrderDetailEntity> getWorkOrderDetail(String zigId);
  Future<String> getNextZigId();
  Future<WorkOrderEntity> createWorkOrder({
    required int weaverId,
    String? zigId,
    required int productId,
    required int warpColorId,
    required int weftColorId,
    int? designId,
    double? unitPrice,
    List<Map<String, dynamic>>? yarnLines,
  });
  Future<WorkOrderEntity> updateStatus(String zigId, String status);
  Future<void> addYarnGiven({
    required String zigId,
    required List<Map<String, dynamic>> lines,
  });
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
  });
}
