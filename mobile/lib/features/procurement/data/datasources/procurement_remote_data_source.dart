import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/network/json_response.dart';
import '../models/procurement_model.dart';

abstract class ProcurementRemoteDataSource {
  Future<List<ProcurementModel>> getYarnPurchases();
  Future<ProcurementModel> getYarnPurchase(int id);
  Future<ProcurementModel> createYarnPurchase({
    required int supplierId,
    String? purchaseDate,
    String? notes,
    required List<Map<String, dynamic>> lines,
  });
}

class ProcurementRemoteDataSourceImpl implements ProcurementRemoteDataSource {
  final ApiClient apiClient;

  ProcurementRemoteDataSourceImpl({required this.apiClient});

  @override
  Future<List<ProcurementModel>> getYarnPurchases() async {
    final response = await apiClient.dio.get(
      ApiConstants.procurementYarnPurchases,
    );
    final list = extractJsonList(response.data, key: 'purchases');
    return list
        .map((e) => ProcurementModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  @override
  Future<ProcurementModel> getYarnPurchase(int id) async {
    final response = await apiClient.dio.get(
      ApiConstants.procurementYarnPurchaseById(id),
    );
    return ProcurementModel.fromJson(response.data as Map<String, dynamic>);
  }

  @override
  Future<ProcurementModel> createYarnPurchase({
    required int supplierId,
    String? purchaseDate,
    String? notes,
    required List<Map<String, dynamic>> lines,
  }) async {
    final response = await apiClient.dio.post(
      ApiConstants.procurementYarnPurchases,
      data: {
        'supplierId': supplierId,
        if (purchaseDate != null && purchaseDate.isNotEmpty)
          'purchaseDate': purchaseDate,
        if (notes != null && notes.isNotEmpty) 'notes': notes,
        'lines': lines,
      },
    );
    return ProcurementModel.fromJson(response.data as Map<String, dynamic>);
  }
}
