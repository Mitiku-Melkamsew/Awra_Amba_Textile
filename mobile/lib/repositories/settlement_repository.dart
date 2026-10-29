import '../core/constants/api_constants.dart';
import '../core/network/api_client.dart';
import '../models/settlement_preview.dart';

class SettlementRepository {
  final ApiClient apiClient;

  SettlementRepository({required this.apiClient});

  Future<BatchSettlementPreview> generateBatchPreview({String? cutoffDate}) async {
    final response = await apiClient.dio.post(
      ApiConstants.batchPreview,
      data: {
        if (cutoffDate != null && cutoffDate.isNotEmpty) 'cutoffDate': cutoffDate,
      },
    );
    return BatchSettlementPreview.fromJson(response.data);
  }

  Future<BatchSettlementPreview> getPreview(String previewId) async {
    final response = await apiClient.dio.get(
      '${ApiConstants.settlementPreview}/$previewId',
    );
    return BatchSettlementPreview.fromJson(response.data);
  }

  Future<Map<String, dynamic>> commitBatch({
    required String previewId,
    String? paymentMethod,
    String? cutoffDate,
  }) async {
    final response = await apiClient.dio.post(
      ApiConstants.batchCommit,
      data: {
        'previewId': previewId,
        'paymentMethod': ?paymentMethod,
        if (cutoffDate != null && cutoffDate.isNotEmpty) 'cutoffDate': cutoffDate,
      },
    );
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> getHisabReport(int paymentId) async {
    final response = await apiClient.dio.get(
      '${ApiConstants.hisabPaymentReport}/$paymentId',
    );
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> getBatchHisabReport(String previewId) async {
    final response = await apiClient.dio.get(
      '${ApiConstants.hisabBatchReport}/$previewId',
    );
    return response.data as Map<String, dynamic>;
  }
}
