import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/api_client.dart';
import '../models/settlement_model.dart';

abstract class SettlementRemoteDataSource {
  Future<BatchSettlementPreviewModel> generateBatchPreview({
    String? cutoffDate,
  });
  Future<BatchSettlementPreviewModel> getPreview(String previewId);
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

class SettlementRemoteDataSourceImpl implements SettlementRemoteDataSource {
  final ApiClient apiClient;

  SettlementRemoteDataSourceImpl({required this.apiClient});

  @override
  Future<BatchSettlementPreviewModel> generateBatchPreview({
    String? cutoffDate,
  }) async {
    final response = await apiClient.dio.post(
      ApiConstants.batchPreview,
      data: {
        if (cutoffDate != null && cutoffDate.isNotEmpty)
          'cutoffDate': cutoffDate,
      },
    );
    return BatchSettlementPreviewModel.fromJson(response.data);
  }

  @override
  Future<BatchSettlementPreviewModel> getPreview(String previewId) async {
    final response = await apiClient.dio.get(
      '${ApiConstants.settlementsBatches}/$previewId',
    );
    return BatchSettlementPreviewModel.fromJson(response.data);
  }

  @override
  Future<Map<String, dynamic>> commitBatch({
    required String previewId,
    String? paymentMethod,
    String? cutoffDate,
  }) async {
    final batchId = int.tryParse(previewId);
    if (batchId == null || batchId < 1) {
      throw const FormatException('Invalid settlement preview ID');
    }
    final response = await apiClient.dio.post(
      ApiConstants.batchCommit,
      data: {
        'batchId': batchId,
        'paymentMethod': ?paymentMethod,
      },
    );
    return response.data as Map<String, dynamic>;
  }

  @override
  Future<List<dynamic>> getSettlementHistory() async {
    final response = await apiClient.dio.get(ApiConstants.settlementsBatches);
    final data = response.data;
    if (data is List) return data;
    if (data is Map && data['batches'] is List) return data['batches'] as List;
    return [];
  }

  @override
  Future<Map<String, dynamic>> payBatch(
    String batchId, {
    required double amount,
    String? paymentMethod,
    String? notes,
  }) async {
    final response = await apiClient.dio.post(
      ApiConstants.settlementBatchPay(batchId),
      data: {
        'amount': amount,
        'paymentMethod': ?paymentMethod,
        'notes': ?notes,
      },
    );
    return response.data as Map<String, dynamic>;
  }

  @override
  Future<Map<String, dynamic>> getHisabReport(int paymentId) async {
    final response = await apiClient.dio.get(
      '${ApiConstants.hisabPaymentReport}/$paymentId',
    );
    return response.data as Map<String, dynamic>;
  }

  @override
  Future<Map<String, dynamic>> getBatchHisabReport(String previewId) async {
    final response = await apiClient.dio.get(
      '${ApiConstants.hisabBatchReport}/$previewId',
    );
    return response.data as Map<String, dynamic>;
  }
}
