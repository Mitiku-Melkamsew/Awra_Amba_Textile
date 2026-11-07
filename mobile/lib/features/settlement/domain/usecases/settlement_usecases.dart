import '../../../../core/usecase/usecase.dart';
import '../entities/settlement_entity.dart';
import '../repositories/settlement_repository.dart';

class GenerateBatchPreviewParams {
  final String? cutoffDate;
  const GenerateBatchPreviewParams({this.cutoffDate});
}

class GenerateBatchPreviewUseCase implements UseCase<BatchSettlementPreviewEntity, GenerateBatchPreviewParams> {
  final SettlementRepository repository;
  GenerateBatchPreviewUseCase(this.repository);

  @override
  Future<BatchSettlementPreviewEntity> call(GenerateBatchPreviewParams params) {
    return repository.generateBatchPreview(cutoffDate: params.cutoffDate);
  }
}

class GetSettlementPreviewUseCase implements UseCase<BatchSettlementPreviewEntity, String> {
  final SettlementRepository repository;
  GetSettlementPreviewUseCase(this.repository);

  @override
  Future<BatchSettlementPreviewEntity> call(String previewId) {
    return repository.getPreview(previewId);
  }
}

class CommitBatchParams {
  final String previewId;
  final String? paymentMethod;
  final String? cutoffDate;

  const CommitBatchParams({
    required this.previewId,
    this.paymentMethod,
    this.cutoffDate,
  });
}

class CommitBatchUseCase implements UseCase<Map<String, dynamic>, CommitBatchParams> {
  final SettlementRepository repository;
  CommitBatchUseCase(this.repository);

  @override
  Future<Map<String, dynamic>> call(CommitBatchParams params) {
    return repository.commitBatch(
      previewId: params.previewId,
      paymentMethod: params.paymentMethod,
      cutoffDate: params.cutoffDate,
    );
  }
}

class GetHisabReportUseCase implements UseCase<Map<String, dynamic>, int> {
  final SettlementRepository repository;
  GetHisabReportUseCase(this.repository);

  @override
  Future<Map<String, dynamic>> call(int paymentId) {
    return repository.getHisabReport(paymentId);
  }
}

class GetBatchHisabReportUseCase implements UseCase<Map<String, dynamic>, String> {
  final SettlementRepository repository;
  GetBatchHisabReportUseCase(this.repository);

  @override
  Future<Map<String, dynamic>> call(String previewId) {
    return repository.getBatchHisabReport(previewId);
  }
}
