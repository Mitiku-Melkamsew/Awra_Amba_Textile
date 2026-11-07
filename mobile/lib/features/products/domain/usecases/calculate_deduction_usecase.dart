import '../../../../core/usecase/usecase.dart';
import '../repositories/products_repository.dart';

class CalculateDeductionParams {
  final double avgWeight;
  final double unitPrice;
  final int quantity;
  final double minWeightThreshold;

  const CalculateDeductionParams({
    required this.avgWeight,
    required this.unitPrice,
    required this.quantity,
    required this.minWeightThreshold,
  });
}

class CalculateDeductionUseCase implements UseCase<Map<String, dynamic>, CalculateDeductionParams> {
  final ProductsRepository repository;
  CalculateDeductionUseCase(this.repository);

  @override
  Future<Map<String, dynamic>> call(CalculateDeductionParams params) {
    return repository.calculateDeduction(
      avgWeight: params.avgWeight,
      unitPrice: params.unitPrice,
      quantity: params.quantity,
      minWeightThreshold: params.minWeightThreshold,
    );
  }
}
