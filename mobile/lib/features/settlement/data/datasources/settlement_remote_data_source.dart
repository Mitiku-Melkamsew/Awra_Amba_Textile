import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/api_client.dart';
import '../models/settlement_model.dart';

abstract class SettlementRemoteDataSource {
  Future<BatchSettlementPreviewModel> generateBatchPreview({String? cutoffDate});
  Future<BatchSettlementPreviewModel> getPreview(String previewId);
  Future<Map<String, dynamic>> commitBatch({
    required String previewId,
    String? paymentMethod,
    String? cutoffDate,
  });
  Future<Map<String, dynamic>> getHisabReport(int paymentId);
  Future<Map<String, dynamic>> getBatchHisabReport(String previewId);
}

class SettlementRemoteDataSourceImpl implements SettlementRemoteDataSource {
  final ApiClient apiClient;

  SettlementRemoteDataSourceImpl({required this.apiClient});

  @override
  Future<BatchSettlementPreviewModel> generateBatchPreview({String? cutoffDate}) async {
    final response = await apiClient.dio.post(
      ApiConstants.batchPreview,
      data: {
        if (cutoffDate != null && cutoffDate.isNotEmpty) 'cutoffDate': cutoffDate,
      },
    );
    return BatchSettlementPreviewModel.fromJson(response.data);
  }

  @override
  Future<BatchSettlementPreviewModel> getPreview(String previewId) async {
    final response = await apiClient.dio.get(
      '${ApiConstants.settlementPreview}/$previewId',
    );
    return BatchSettlementPreviewModel.fromJson(response.data);
  }

  @override
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
