import '../../../../core/usecase/usecase.dart';
import '../entities/price_entity.dart';
import '../repositories/pricing_repository.dart';

class GetPricingFabricPricesUseCase implements UseCase<List<FabricPriceItemEntity>, NoParams> {
  final PricingRepository repository;
  GetPricingFabricPricesUseCase(this.repository);

  @override
  Future<List<FabricPriceItemEntity>> call(NoParams params) {
    return repository.getFabricPrices();
  }
}

class CreateFabricPriceParams {
  final int fabricVariantId;
  final double unitPrice;
  final String? effectiveDate;

  const CreateFabricPriceParams({
    required this.fabricVariantId,
    required this.unitPrice,
    this.effectiveDate,
  });
}

class CreateFabricPriceUseCase implements UseCase<FabricPriceItemEntity, CreateFabricPriceParams> {
  final PricingRepository repository;
  CreateFabricPriceUseCase(this.repository);

  @override
  Future<FabricPriceItemEntity> call(CreateFabricPriceParams params) {
    return repository.createFabricPrice(
      fabricVariantId: params.fabricVariantId,
      unitPrice: params.unitPrice,
      effectiveDate: params.effectiveDate,
    );
  }
}

class GetYarnPricesUseCase implements UseCase<List<YarnPriceItemEntity>, NoParams> {
  final PricingRepository repository;
  GetYarnPricesUseCase(this.repository);

  @override
  Future<List<YarnPriceItemEntity>> call(NoParams params) {
    return repository.getYarnPrices();
  }
}

class CreateYarnPriceParams {
  final int yarnVariantId;
  final double costPerKg;
  final String? effectiveDate;

  const CreateYarnPriceParams({
    required this.yarnVariantId,
    required this.costPerKg,
    this.effectiveDate,
  });
}

class CreateYarnPriceUseCase implements UseCase<YarnPriceItemEntity, CreateYarnPriceParams> {
  final PricingRepository repository;
  CreateYarnPriceUseCase(this.repository);

  @override
  Future<YarnPriceItemEntity> call(CreateYarnPriceParams params) {
    return repository.createYarnPrice(
      yarnVariantId: params.yarnVariantId,
      costPerKg: params.costPerKg,
      effectiveDate: params.effectiveDate,
    );
  }
}
