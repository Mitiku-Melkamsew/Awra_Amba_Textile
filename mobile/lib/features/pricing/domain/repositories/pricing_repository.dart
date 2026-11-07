import '../entities/price_entity.dart';

abstract class PricingRepository {
  Future<List<FabricPriceItemEntity>> getFabricPrices();
  Future<FabricPriceItemEntity> createFabricPrice({
    required int fabricVariantId,
    required double unitPrice,
    String? effectiveDate,
  });

  Future<List<YarnPriceItemEntity>> getYarnPrices();
  Future<YarnPriceItemEntity> createYarnPrice({
    required int yarnVariantId,
    required double costPerKg,
    String? effectiveDate,
  });
}
