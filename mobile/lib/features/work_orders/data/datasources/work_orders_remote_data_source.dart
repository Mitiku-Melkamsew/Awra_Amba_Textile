import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/api_client.dart';
import '../models/work_order_model.dart';

abstract class WorkOrdersRemoteDataSource {
  Future<List<WorkOrderModel>> getWorkOrders({String? status, int? weaverId});
  Future<WorkOrderDetailModel> getWorkOrderDetail(String zigId);
  Future<String> getNextZigId();
  Future<WorkOrderModel> createWorkOrder({
    required int weaverId,
    String? zigId,
    required int productId,
    required int warpColorId,
    required int weftColorId,
    int? designId,
    double? unitPrice,
    List<Map<String, dynamic>>? yarnLines,
  });
  Future<WorkOrderModel> updateStatus(String zigId, String status);
  Future<void> addYarnGiven({
    required String zigId,
    required List<Map<String, dynamic>> lines,
  });
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
  });
}

class WorkOrdersRemoteDataSourceImpl implements WorkOrdersRemoteDataSource {
  final ApiClient apiClient;

  WorkOrdersRemoteDataSourceImpl({required this.apiClient});

  @override
  Future<List<WorkOrderModel>> getWorkOrders({String? status, int? weaverId}) async {
    final queryParams = <String, dynamic>{};
    if (status != null && status.isNotEmpty) queryParams['status'] = status;
    if (weaverId != null) queryParams['weaverId'] = weaverId;

    final response = await apiClient.dio.get(
      ApiConstants.workOrders,
      queryParameters: queryParams,
    );

    final list = response.data as List;
    return list.map((e) => WorkOrderModel.fromJson(e)).toList();
  }

  @override
  Future<WorkOrderDetailModel> getWorkOrderDetail(String zigId) async {
    final response = await apiClient.dio.get('${ApiConstants.workOrders}/$zigId');
    return WorkOrderDetailModel.fromJson(response.data);
  }

  @override
  Future<String> getNextZigId() async {
    final response = await apiClient.dio.get('${ApiConstants.workOrders}/next-id');
    return response.data['zigId']?.toString() ?? '';
  }

  @override
  Future<WorkOrderModel> createWorkOrder({
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
        'designId': ?designId,
        'unitPrice': ?unitPrice,
        if (yarnLines != null && yarnLines.isNotEmpty) 'yarnLines': yarnLines,
      },
    );
    return WorkOrderModel.fromJson(response.data);
  }

  @override
  Future<WorkOrderModel> updateStatus(String zigId, String status) async {
    final response = await apiClient.dio.patch(
      '${ApiConstants.workOrders}/$zigId/status',
      data: {'status': status},
    );
    return WorkOrderModel.fromJson(response.data);
  }

  @override
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

  @override
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
        'fabricVariantId': ?fabricVariantId,
        'warpColorId': ?warpColorId,
        'weftColorId': ?weftColorId,
        'designId': ?designId,
        'quantityReturned': quantityReturned,
        'totalWeight': totalWeight,
        'unitPrice': unitPrice,
        'lengthCm': ?lengthCm,
        'widthCm': ?widthCm,
        'remark': ?remark,
      },
    );
  }
}
