import '../../../../core/usecase/usecase.dart';
import '../entities/product_entity.dart';
import '../repositories/products_repository.dart';

class GetYarnVariantsUseCase implements UseCase<List<YarnVariantEntity>, NoParams> {
  final ProductsRepository repository;
  GetYarnVariantsUseCase(this.repository);

  @override
  Future<List<YarnVariantEntity>> call(NoParams params) {
    return repository.getYarnVariants();
  }
}
