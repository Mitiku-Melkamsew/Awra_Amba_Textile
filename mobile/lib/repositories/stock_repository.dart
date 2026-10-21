import '../core/constants/api_constants.dart';
import '../core/network/api_client.dart';
import '../models/stock_item.dart';

class StockRepository {
  final ApiClient apiClient;

  StockRepository({required this.apiClient});

  Future<CatalogLookup> getCatalogLookup() async {
    final response = await apiClient.dio.get(ApiConstants.catalogLookup);
    return CatalogLookup.fromJson(response.data);
  }

  Future<Map<String, dynamic>> getStock() async {
    final response = await apiClient.dio.get(ApiConstants.stock);
    return response.data as Map<String, dynamic>;
  }

  Future<List<FabricVariant>> getFabricVariants() async {
    final response = await apiClient.dio.get('/catalog/fabric-variants');
    final list = response.data as List;
    return list.map((e) => FabricVariant.fromJson(e)).toList();
  }

  Future<List<YarnVariant>> getYarnVariants() async {
    final response = await apiClient.dio.get('/catalog/yarn-variants');
    final list = response.data as List;
    return list.map((e) => YarnVariant.fromJson(e)).toList();
  }

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
