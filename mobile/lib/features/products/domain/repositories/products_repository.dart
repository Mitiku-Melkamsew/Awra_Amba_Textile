import '../entities/product_entity.dart';

abstract class ProductsRepository {
  Future<CatalogLookupEntity> getCatalogLookup();
  Future<Map<String, dynamic>> getStock();
  Future<List<FabricVariantEntity>> getFabricVariants();
  Future<List<YarnVariantEntity>> getYarnVariants();
  Future<Map<String, dynamic>> calculateDeduction({
    required double avgWeight,
    required double unitPrice,
    required int quantity,
    required double minWeightThreshold,
  });
}
