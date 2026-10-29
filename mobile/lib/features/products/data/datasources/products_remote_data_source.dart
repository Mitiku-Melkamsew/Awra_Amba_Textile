import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/api_client.dart';
import '../models/product_model.dart';

abstract class ProductsRemoteDataSource {
  Future<CatalogLookupModel> getCatalogLookup();
  Future<Map<String, dynamic>> getStock();
  Future<List<FabricVariantModel>> getFabricVariants();
  Future<List<YarnVariantModel>> getYarnVariants();
  Future<Map<String, dynamic>> calculateDeduction({
    required double avgWeight,
    required double unitPrice,
    required int quantity,
    required double minWeightThreshold,
  });
}

class ProductsRemoteDataSourceImpl implements ProductsRemoteDataSource {
  final ApiClient apiClient;

  ProductsRemoteDataSourceImpl({required this.apiClient});

  @override
  Future<CatalogLookupModel> getCatalogLookup() async {
    final response = await apiClient.dio.get(ApiConstants.catalogLookup);
    return CatalogLookupModel.fromJson(response.data);
  }

  @override
  Future<Map<String, dynamic>> getStock() async {
    final response = await apiClient.dio.get(ApiConstants.stock);
    return response.data as Map<String, dynamic>;
  }

  @override
  Future<List<FabricVariantModel>> getFabricVariants() async {
    final response = await apiClient.dio.get('/catalog/fabric-variants');
    final list = response.data as List;
    return list.map((e) => FabricVariantModel.fromJson(e)).toList();
  }

  @override
  Future<List<YarnVariantModel>> getYarnVariants() async {
    final response = await apiClient.dio.get('/catalog/yarn-variants');
    final list = response.data as List;
    return list.map((e) => YarnVariantModel.fromJson(e)).toList();
  }

  @override
  Future<Map<String, dynamic>> calculateDeduction({
    required double avgWeight,
    required double unitPrice,
    required int quantity,
    required double minWeightThreshold,
  }) async {
    final response = await apiClient.dio.post(
      ApiConstants.deductionCalc,
      data: {
        'avgWeight': avgWeight,
        'unitPrice': unitPrice,
        'quantity': quantity,
        'minWeightThreshold': minWeightThreshold,
      },
    );
    return response.data as Map<String, dynamic>;
  }
}
