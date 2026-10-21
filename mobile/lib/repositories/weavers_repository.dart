import '../core/constants/api_constants.dart';
import '../core/network/api_client.dart';
import '../models/weaver.dart';

class WeaversRepository {
  final ApiClient apiClient;

  WeaversRepository({required this.apiClient});

  Future<List<Weaver>> getWeavers({String? search, String? sort}) async {
    final queryParams = <String, dynamic>{};
    if (search != null && search.isNotEmpty) queryParams['search'] = search;
    if (sort != null) queryParams['sort'] = sort;

    final response = await apiClient.dio.get(
      ApiConstants.weavers,
      queryParameters: queryParams,
    );

    final list = response.data as List;
    return list.map((e) => Weaver.fromJson(e)).toList();
  }

  Future<Weaver> getWeaver(int id) async {
    final response = await apiClient.dio.get('${ApiConstants.weavers}/$id');
    return Weaver.fromJson(response.data);
  }

  Future<Weaver> createWeaver({
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
    return Weaver.fromJson(response.data);
  }

  Future<Map<String, dynamic>> getUnsettled(int weaverId) async {
    final response = await apiClient.dio.get(
      '${ApiConstants.weavers}/$weaverId/unsettled',
    );
    return response.data as Map<String, dynamic>;
  }
}
