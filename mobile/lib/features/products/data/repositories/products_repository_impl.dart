import '../../domain/entities/product_entity.dart';
import '../../domain/repositories/products_repository.dart';
import '../datasources/products_remote_data_source.dart';

class ProductsRepositoryImpl implements ProductsRepository {
  final ProductsRemoteDataSource remoteDataSource;

  ProductsRepositoryImpl({required this.remoteDataSource});

  @override
  Future<CatalogLookupEntity> getCatalogLookup() =>
      remoteDataSource.getCatalogLookup();

  @override
  Future<Map<String, dynamic>> getStock() =>
      remoteDataSource.getStock();

  @override
  Future<List<FabricVariantEntity>> getFabricVariants() =>
      remoteDataSource.getFabricVariants();

  @override
  Future<List<YarnVariantEntity>> getYarnVariants() =>
      remoteDataSource.getYarnVariants();

  @override
  Future<Map<String, dynamic>> calculateDeduction({
    required double avgWeight,
    required double unitPrice,
    required int quantity,
    required double minWeightThreshold,
  }) =>
      remoteDataSource.calculateDeduction(
        avgWeight: avgWeight,
        unitPrice: unitPrice,
        quantity: quantity,
        minWeightThreshold: minWeightThreshold,
      );
}
