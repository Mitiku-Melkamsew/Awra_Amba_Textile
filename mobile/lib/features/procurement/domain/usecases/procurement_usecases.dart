import '../../../../core/usecase/usecase.dart';
import '../entities/procurement_entity.dart';
import '../repositories/procurement_repository.dart';

class GetYarnPurchasesUseCase implements UseCase<List<ProcurementEntity>, NoParams> {
  final ProcurementRepository repository;
  GetYarnPurchasesUseCase(this.repository);

  @override
  Future<List<ProcurementEntity>> call(NoParams params) {
    return repository.getYarnPurchases();
  }
}

class CreateYarnPurchaseParams {
  final int supplierId;
  final String? purchaseDate;
  final String? notes;
  final List<Map<String, dynamic>> lines;

  const CreateYarnPurchaseParams({
    required this.supplierId,
    this.purchaseDate,
    this.notes,
    required this.lines,
  });
}

class CreateYarnPurchaseUseCase implements UseCase<ProcurementEntity, CreateYarnPurchaseParams> {
  final ProcurementRepository repository;
  CreateYarnPurchaseUseCase(this.repository);

  @override
  Future<ProcurementEntity> call(CreateYarnPurchaseParams params) {
    return repository.createYarnPurchase(
      supplierId: params.supplierId,
      purchaseDate: params.purchaseDate,
      notes: params.notes,
      lines: params.lines,
    );
  }
}
