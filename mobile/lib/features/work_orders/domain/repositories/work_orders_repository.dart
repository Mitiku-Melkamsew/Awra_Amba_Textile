import '../entities/work_order_entity.dart';

abstract class WorkOrdersRepository {
  Future<List<WorkOrderEntity>> getWorkOrders({String? status, int? weaverId});
  Future<WorkOrderDetailEntity> getWorkOrderDetail(String zigId);
  Future<String> getNextZigId();
  Future<WorkOrderEntity> createWorkOrder({
    required int weaverUserId,
    String? zigId,
    required int fabricVariantId,
    List<Map<String, dynamic>>? yarnLines,
  });
  Future<WorkOrderEntity> updateStatus(String zigId, String status);
  Future<void> markReturned(String zigId);
  Future<void> cancel(String zigId);
  Future<void> recordYarnReturn({
    required String zigId,
    required int yarnVariantId,
    required double quantity,
    String? remark,
  });
  Future<void> recordFabricReturnToWeaver({
    required String zigId,
    required int fabricVariantId,
    required int quantity,
    String? remark,
  });
  Future<void> addYarnGiven({
    required String zigId,
    required List<Map<String, dynamic>> lines,
  });
  Future<void> updateYarnGiven({
    required int id,
    required double quantityGiven,
    double? unitCost,
    String? notes,
  });
  Future<void> deleteYarnGiven(int id);
  Future<void> addFabricReturn({
    required String zigId,
    int? fabricVariantId,
    int? fabricId,
    int? warpColorId,
    int? weftColorId,
    int? designId,
    required int quantityReturned,
    required double totalWeight,
    required double unitPrice,
    double? lengthCm,
    double? widthCm,
    String? remark,
    bool isDefective = false,
    double? deductionAmount,
    String? defectReason,
  });
  Future<void> updateFabricReturn({
    required int id,
    required int quantityReturned,
    required double totalWeight,
    required double unitPrice,
    double? lengthCm,
    double? widthCm,
    String? remark,
    bool? isDefective,
    double? deductionAmount,
  });
  Future<void> deleteFabricReturn(int id);
}
