import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/api_client.dart';
import '../models/audit_model.dart';

abstract class AuditRemoteDataSource {
  Future<List<AuditLogItemModel>> getAuditLogs({
    String? entityType,
    String? action,
    int? limit,
  });
}

class AuditRemoteDataSourceImpl implements AuditRemoteDataSource {
  final ApiClient apiClient;

  AuditRemoteDataSourceImpl({required this.apiClient});

  @override
  Future<List<AuditLogItemModel>> getAuditLogs({
    String? entityType,
    String? action,
    int? limit,
  }) async {
    final queryParams = <String, dynamic>{};
    if (entityType != null && entityType.isNotEmpty) queryParams['entityType'] = entityType;
    if (action != null && action.isNotEmpty) queryParams['action'] = action;
    if (limit != null) queryParams['limit'] = limit;

    final response = await apiClient.dio.get(
      ApiConstants.auditLogs,
      queryParameters: queryParams,
    );

    final raw = response.data;
    final List list = raw is Map && raw.containsKey('logs')
        ? raw['logs'] as List
        : (raw is List ? raw : []);

    return list.map((e) => AuditLogItemModel.fromJson(e as Map<String, dynamic>)).toList();
  }
}
