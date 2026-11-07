import '../entities/procurement_entity.dart';

abstract class ProcurementRepository {
  Future<List<ProcurementEntity>> getYarnPurchases();
  Future<ProcurementEntity> getYarnPurchase(int id);
  Future<ProcurementEntity> createYarnPurchase({
    required int supplierId,
    String? purchaseDate,
    String? notes,
    required List<Map<String, dynamic>> lines,
  });
}
