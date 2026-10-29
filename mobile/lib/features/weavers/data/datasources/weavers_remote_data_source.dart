import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/api_client.dart';
import '../models/weaver_model.dart';

abstract class WeaversRemoteDataSource {
  Future<List<WeaverModel>> getWeavers({String? search, String? sort});
  Future<WeaverModel> getWeaver(int id);
  Future<WeaverModel> createWeaver({
    required String firstName,
    required String lastName,
    String? phone,
    String? email,
    String? bankAccountNumber,
  });
  Future<Map<String, dynamic>> getUnsettled(int weaverId);
}

class WeaversRemoteDataSourceImpl implements WeaversRemoteDataSource {
  final ApiClient apiClient;

  WeaversRemoteDataSourceImpl({required this.apiClient});

  @override
  Future<List<WeaverModel>> getWeavers({String? search, String? sort}) async {
    final queryParams = <String, dynamic>{};
    if (search != null && search.isNotEmpty) queryParams['search'] = search;
    if (sort != null) queryParams['sort'] = sort;

    final response = await apiClient.dio.get(
      ApiConstants.weavers,
      queryParameters: queryParams,
    );

    final list = response.data as List;
    return list.map((e) => WeaverModel.fromJson(e)).toList();
  }

  @override
  Future<WeaverModel> getWeaver(int id) async {
    final response = await apiClient.dio.get('${ApiConstants.weavers}/$id');
    return WeaverModel.fromJson(response.data);
  }

  @override
  Future<WeaverModel> createWeaver({
    required String firstName,
    required String lastName,
    String? phone,
    String? email,
    String? bankAccountNumber,
  }) async {
    final response = await apiClient.dio.post(
      ApiConstants.weavers,
      data: {
        'firstName': firstName,
        'lastName': lastName,
        'phone': phone,
        'email': email,
        'bankAccountNumber': bankAccountNumber,
      },
    );
    return WeaverModel.fromJson(response.data);
  }

  @override
  Future<Map<String, dynamic>> getUnsettled(int weaverId) async {
    final response = await apiClient.dio.get(
      '${ApiConstants.weavers}/$weaverId/unsettled',
    );
    return response.data as Map<String, dynamic>;
  }
}
