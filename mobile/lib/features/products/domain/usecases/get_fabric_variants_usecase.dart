import '../../../../core/usecase/usecase.dart';
import '../entities/product_entity.dart';
import '../repositories/products_repository.dart';

class GetFabricVariantsUseCase implements UseCase<List<FabricVariantEntity>, NoParams> {
  final ProductsRepository repository;
  GetFabricVariantsUseCase(this.repository);

  @override
  Future<List<FabricVariantEntity>> call(NoParams params) {
    return repository.getFabricVariants();
  }
}
