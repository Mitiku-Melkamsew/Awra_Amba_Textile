import '../../domain/entities/price_entity.dart';
import '../../domain/repositories/pricing_repository.dart';
import '../datasources/pricing_remote_data_source.dart';

class PricingRepositoryImpl implements PricingRepository {
  final PricingRemoteDataSource remoteDataSource;

  PricingRepositoryImpl({required this.remoteDataSource});

  @override
  Future<List<FabricPriceItemEntity>> getFabricPrices() =>
      remoteDataSource.getFabricPrices();

  @override
  Future<FabricPriceItemEntity> createFabricPrice({
    required int fabricVariantId,
    required double unitPrice,
    String? effectiveDate,
  }) =>
      remoteDataSource.createFabricPrice(
        fabricVariantId: fabricVariantId,
        unitPrice: unitPrice,
        effectiveDate: effectiveDate,
      );

  @override
  Future<List<YarnPriceItemEntity>> getYarnPrices() =>
      remoteDataSource.getYarnPrices();

  @override
  Future<YarnPriceItemEntity> createYarnPrice({
    required int yarnVariantId,
    required double costPerKg,
    String? effectiveDate,
  }) =>
      remoteDataSource.createYarnPrice(
        yarnVariantId: yarnVariantId,
        costPerKg: costPerKg,
        effectiveDate: effectiveDate,
      );
}
