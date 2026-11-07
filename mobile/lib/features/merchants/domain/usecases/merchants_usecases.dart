import '../../../../core/usecase/usecase.dart';
import '../entities/available_fabric_entity.dart';
import '../entities/fabric_price_entity.dart';
import '../repositories/merchants_repository.dart';

class GetAvailableFabricsUseCase implements UseCase<List<AvailableFabricEntity>, NoParams> {
  final MerchantsRepository repository;

  GetAvailableFabricsUseCase(this.repository);

  @override
  Future<List<AvailableFabricEntity>> call(NoParams params) {
    return repository.getAvailableFabrics();
  }
}

class GetFabricPricesUseCase implements UseCase<List<FabricPriceEntity>, int?> {
  final MerchantsRepository repository;

  GetFabricPricesUseCase(this.repository);

  @override
  Future<List<FabricPriceEntity>> call(int? fabricId) {
    return repository.getFabricPrices(fabricId: fabricId);
  }
}
