import '../../../../core/usecase/usecase.dart';
import '../entities/product_entity.dart';
import '../repositories/products_repository.dart';

class GetCatalogLookupUseCase implements UseCase<CatalogLookupEntity, NoParams> {
  final ProductsRepository repository;
  GetCatalogLookupUseCase(this.repository);

  @override
  Future<CatalogLookupEntity> call(NoParams params) {
    return repository.getCatalogLookup();
  }
}
