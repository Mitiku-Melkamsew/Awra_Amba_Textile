import '../../domain/entities/settlement_entity.dart';
import '../../domain/repositories/settlement_repository.dart';
import '../datasources/settlement_remote_data_source.dart';

class SettlementRepositoryImpl implements SettlementRepository {
  final SettlementRemoteDataSource remoteDataSource;

  SettlementRepositoryImpl({required this.remoteDataSource});

  @override
  Future<BatchSettlementPreviewEntity> generateBatchPreview({String? cutoffDate}) =>
      remoteDataSource.generateBatchPreview(cutoffDate: cutoffDate);

  @override
  Future<BatchSettlementPreviewEntity> getPreview(String previewId) =>
      remoteDataSource.getPreview(previewId);

  @override
  Future<Map<String, dynamic>> commitBatch({
    required String previewId,
    String? paymentMethod,
    String? cutoffDate,
  }) =>
      remoteDataSource.commitBatch(
        previewId: previewId,
        paymentMethod: paymentMethod,
        cutoffDate: cutoffDate,
      );

  @override
  Future<Map<String, dynamic>> getHisabReport(int paymentId) =>
      remoteDataSource.getHisabReport(paymentId);

  @override
  Future<Map<String, dynamic>> getBatchHisabReport(String previewId) =>
      remoteDataSource.getBatchHisabReport(previewId);
}
