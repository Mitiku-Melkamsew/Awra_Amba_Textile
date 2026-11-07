import '../../../../core/usecase/usecase.dart';
import '../repositories/products_repository.dart';

class GetStockUseCase implements UseCase<Map<String, dynamic>, NoParams> {
  final ProductsRepository repository;
  GetStockUseCase(this.repository);

  @override
  Future<Map<String, dynamic>> call(NoParams params) {
    return repository.getStock();
  }
}
