import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/network/json_response.dart';
import '../models/available_fabric_model.dart';
import '../models/fabric_price_model.dart';

abstract class MerchantsRemoteDataSource {
  Future<List<AvailableFabricModel>> getAvailableFabrics();
  Future<List<FabricPriceModel>> getFabricPrices({int? fabricId});
  Future<List<Map<String, dynamic>>> getMyTransactions();
}

class MerchantsRemoteDataSourceImpl implements MerchantsRemoteDataSource {
  final ApiClient apiClient;

  MerchantsRemoteDataSourceImpl({required this.apiClient});

  @override
  Future<List<AvailableFabricModel>> getAvailableFabrics() async {
    final response = await apiClient.dio.get(
      ApiConstants.stockAvailableFabrics,
    );
    final list = response.data as List;
    return list
        .map((e) => AvailableFabricModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  @override
  Future<List<FabricPriceModel>> getFabricPrices({int? fabricId}) async {
    final queryParams = <String, dynamic>{};
    if (fabricId != null) queryParams['fabricId'] = fabricId;

    final response = await apiClient.dio.get(
      ApiConstants.catalogFabricPrices,
      queryParameters: queryParams,
    );
    final list = response.data as List;
    return list
        .map((e) => FabricPriceModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  @override
  Future<List<Map<String, dynamic>>> getMyTransactions() async {
    final response = await apiClient.dio.get(ApiConstants.merchantTransactions);
    final list = extractJsonList(response.data, key: 'transactions');
    return list.map((e) => e as Map<String, dynamic>).toList();
  }
}
