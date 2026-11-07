import '../../domain/entities/procurement_entity.dart';
import '../../domain/repositories/procurement_repository.dart';
import '../datasources/procurement_remote_data_source.dart';

class ProcurementRepositoryImpl implements ProcurementRepository {
  final ProcurementRemoteDataSource remoteDataSource;

  ProcurementRepositoryImpl({required this.remoteDataSource});

  @override
  Future<List<ProcurementEntity>> getYarnPurchases() =>
      remoteDataSource.getYarnPurchases();

  @override
  Future<ProcurementEntity> getYarnPurchase(int id) =>
      remoteDataSource.getYarnPurchase(id);

  @override
  Future<ProcurementEntity> createYarnPurchase({
    required int supplierId,
    String? purchaseDate,
    String? notes,
    required List<Map<String, dynamic>> lines,
  }) =>
      remoteDataSource.createYarnPurchase(
        supplierId: supplierId,
        purchaseDate: purchaseDate,
        notes: notes,
        lines: lines,
      );
}
