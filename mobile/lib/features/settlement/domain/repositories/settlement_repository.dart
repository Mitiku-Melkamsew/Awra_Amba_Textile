import '../entities/settlement_entity.dart';

abstract class SettlementRepository {
  Future<BatchSettlementPreviewEntity> generateBatchPreview({String? cutoffDate});
  Future<BatchSettlementPreviewEntity> getPreview(String previewId);
  Future<Map<String, dynamic>> commitBatch({
    required String previewId,
    String? paymentMethod,
    String? cutoffDate,
  });
  Future<List<dynamic>> getSettlementHistory();
  Future<Map<String, dynamic>> payBatch(
    String batchId, {
    required double amount,
    String? paymentMethod,
    String? notes,
  });
  Future<Map<String, dynamic>> getHisabReport(int paymentId);
  Future<Map<String, dynamic>> getBatchHisabReport(String previewId);
}
