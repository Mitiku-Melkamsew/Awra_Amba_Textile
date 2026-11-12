import '../entities/product_entity.dart';

abstract class ProductsRepository {
  Future<CatalogLookupEntity> getCatalogLookup();
  Future<Map<String, dynamic>> getStock();
  Future<List<FabricVariantEntity>> getFabricVariants();
  Future<List<YarnVariantEntity>> getYarnVariants();
  Future<void> createCatalogEntry(String resource, Map<String, dynamic> data);
  Future<void> updateCatalogEntry(
    String resource,
    int id,
    Map<String, dynamic> data,
  );
  Future<Map<String, dynamic>> calculateDeduction({
    required double avgWeight,
    required double unitPrice,
    required int quantity,
    required double minWeightThreshold,
  });
  Future<FabricVariantEntity> createFabricVariant({
    required int fabricId,
    int? warpColorId,
    int? weftColorId,
    int? designId,
  });
}
