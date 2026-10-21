import '../core/constants/api_constants.dart';
import '../core/network/api_client.dart';
import '../models/work_order.dart';

class WorkOrdersRepository {
  final ApiClient apiClient;

  WorkOrdersRepository({required this.apiClient});

  Future<List<WorkOrder>> getWorkOrders({String? status, int? weaverId}) async {
    final queryParams = <String, dynamic>{};
    if (status != null && status.isNotEmpty) queryParams['status'] = status;
    if (weaverId != null) queryParams['weaverId'] = weaverId;

    final response = await apiClient.dio.get(
      ApiConstants.workOrders,
      queryParameters: queryParams,
    );

    final list = response.data as List;
    return list.map((e) => WorkOrder.fromJson(e)).toList();
  }

  Future<WorkOrderDetail> getWorkOrderDetail(String zigId) async {
    final response = await apiClient.dio.get('${ApiConstants.workOrders}/$zigId');
    return WorkOrderDetail.fromJson(response.data);
  }

  Future<String> getNextZigId() async {
    final response = await apiClient.dio.get('${ApiConstants.workOrders}/next-id');
    return response.data['zigId']?.toString() ?? '';
  }

  Future<WorkOrder> createWorkOrder({
    required int weaverId,
    String? zigId,
    required int productId,
    required int warpColorId,
    required int weftColorId,
    int? designId,
    double? unitPrice,
    List<Map<String, dynamic>>? yarnLines,
  }) async {
    final response = await apiClient.dio.post(
      ApiConstants.workOrders,
      data: {
        'weaverId': weaverId,
        if (zigId != null && zigId.isNotEmpty) 'zigId': zigId,
        'productId': productId,
        'warpColorId': warpColorId,
        'weftColorId': weftColorId,
        if (designId != null) 'designId': designId,
        if (unitPrice != null) 'unitPrice': unitPrice,
        if (yarnLines != null && yarnLines.isNotEmpty) 'yarnLines': yarnLines,
      },
    );
    return WorkOrder.fromJson(response.data);
  }

  Future<WorkOrder> updateStatus(String zigId, String status) async {
    final response = await apiClient.dio.patch(
      '${ApiConstants.workOrders}/$zigId/status',
      data: {'status': status},
    );
    return WorkOrder.fromJson(response.data);
  }

  Future<void> addYarnGiven({
    required String zigId,
    required List<Map<String, dynamic>> lines,
  }) async {
    await apiClient.dio.post(
      ApiConstants.yarnGiven,
      data: {
        'zigId': zigId,
        'lines': lines,
      },
    );
  }

  Future<void> addFabricReturn({
    required String zigId,
    int? fabricVariantId,
    int? warpColorId,
    int? weftColorId,
    int? designId,
    required int quantityReturned,
    required double totalWeight,
    required double unitPrice,
    double? lengthCm,
    double? widthCm,
    String? remark,
  }) async {
    await apiClient.dio.post(
      ApiConstants.fabricReturns,
      data: {
        'zigId': zigId,
        if (fabricVariantId != null) 'fabricVariantId': fabricVariantId,
        if (warpColorId != null) 'warpColorId': warpColorId,
        if (weftColorId != null) 'weftColorId': weftColorId,
        if (designId != null) 'designId': designId,
        'quantityReturned': quantityReturned,
        'totalWeight': totalWeight,
        'unitPrice': unitPrice,
        if (lengthCm != null) 'lengthCm': lengthCm,
        if (widthCm != null) 'widthCm': widthCm,
        if (remark != null) 'remark': remark,
      },
    );
  }
}
