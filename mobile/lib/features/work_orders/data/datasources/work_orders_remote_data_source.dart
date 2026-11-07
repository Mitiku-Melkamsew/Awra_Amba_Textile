import 'package:dio/dio.dart';
import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/network/json_response.dart';
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
  Future<void> markReturned(String zigId);
  Future<void> cancelWorkOrder(String zigId);
  Future<void> recordYarnReturn({
    required String zigId,
    required int yarnVariantId,
    required double quantity,
    String? remark,
  });
  Future<void> recordFabricReturnToWeaver({
    required String zigId,
    required int fabricVariantId,
    required int quantity,
    String? remark,
  });
  Future<void> addYarnGiven({
    required String zigId,
    required List<Map<String, dynamic>> lines,
  });
  Future<void> updateYarnGiven({
    required int id,
    required double quantityGiven,
    double? unitCost,
    String? notes,
  });
  Future<void> deleteYarnGiven(int id);
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
    bool isDefective = false,
    double? deductionAmount,
    String? defectReason,
  });
  Future<void> updateFabricReturn({
    required int id,
    required int quantityReturned,
    required double totalWeight,
    required double unitPrice,
    double? lengthCm,
    double? widthCm,
    String? remark,
    bool? isDefective,
    double? deductionAmount,
  });
  Future<void> deleteFabricReturn(int id);
}

class WorkOrdersRemoteDataSourceImpl implements WorkOrdersRemoteDataSource {
  final ApiClient apiClient;

  WorkOrdersRemoteDataSourceImpl({required this.apiClient});

  @override
  Future<List<WorkOrderModel>> getWorkOrders({
    String? status,
    int? weaverId,
  }) async {
    final queryParams = <String, dynamic>{};
    if (status != null && status.isNotEmpty) queryParams['status'] = status;

    // Use /weaver/work-orders if weaverId is passed, falling back gracefully
    final endpoint = weaverId != null
        ? ApiConstants.weaverWorkOrders
        : ApiConstants.workOrders;
    if (endpoint == ApiConstants.workOrders && weaverId != null) {
      queryParams['weaverId'] = weaverId;
    }

    try {
      final response = await apiClient.dio.get(
        endpoint,
        queryParameters: queryParams,
      );
      final list = extractJsonList(response.data, key: 'workOrders');
      return list.map((e) => WorkOrderModel.fromJson(e)).toList();
    } on DioException {
      if (endpoint == ApiConstants.weaverWorkOrders) {
        final fallback = await apiClient.dio.get(
          ApiConstants.workOrders,
          queryParameters: {'weaverId': weaverId, 'status': ?status},
        );
        final list = extractJsonList(fallback.data, key: 'workOrders');
        return list.map((e) => WorkOrderModel.fromJson(e)).toList();
      }
      rethrow;
    }
  }

  @override
  Future<WorkOrderDetailModel> getWorkOrderDetail(String zigId) async {
    try {
      final response = await apiClient.dio.get(
        '${ApiConstants.workOrders}/$zigId',
      );
      return WorkOrderDetailModel.fromJson(response.data);
    } on DioException {
      final fallback = await apiClient.dio.get(
        ApiConstants.weaverWorkOrderDetail(zigId),
      );
      return WorkOrderDetailModel.fromJson(fallback.data);
    }
  }

  @override
  Future<String> getNextZigId() async {
    final response = await apiClient.dio.get(ApiConstants.workOrdersNextId);
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
      ApiConstants.workOrderStatus(zigId),
      data: {'status': status},
    );
    return WorkOrderModel.fromJson(response.data);
  }

  @override
  Future<void> markReturned(String zigId) async {
    await apiClient.dio.patch(
      ApiConstants.workOrderStatus(zigId),
      data: {'status': 'returned'},
    );
  }

  @override
  Future<void> cancelWorkOrder(String zigId) async {
    await apiClient.dio.post(ApiConstants.workOrderCancel(zigId));
  }

  @override
  Future<void> recordYarnReturn({
    required String zigId,
    required int yarnVariantId,
    required double quantity,
    String? remark,
  }) async {
    await apiClient.dio.post(
      ApiConstants.workOrderYarnReturns(zigId),
      data: {
        'yarnVariantId': yarnVariantId,
        'quantity': quantity,
        if (remark != null && remark.trim().isNotEmpty) 'remark': remark.trim(),
      },
    );
  }

  @override
  Future<void> recordFabricReturnToWeaver({
    required String zigId,
    required int fabricVariantId,
    required int quantity,
    String? remark,
  }) async {
    await apiClient.dio.post(
      ApiConstants.workOrderReturnsToWeaver(zigId),
      data: {
        'fabricVariantId': fabricVariantId,
        'quantity': quantity,
        if (remark != null && remark.trim().isNotEmpty) 'remark': remark.trim(),
      },
    );
  }

  @override
  Future<void> addYarnGiven({
    required String zigId,
    required List<Map<String, dynamic>> lines,
  }) async {
    await apiClient.dio.post(
      ApiConstants.workOrderYarnGiven(zigId),
      data: {'lines': lines},
    );
  }

  @override
  Future<void> updateYarnGiven({
    required int id,
    required double quantityGiven,
    double? unitCost,
    String? notes,
  }) async {
    await apiClient.dio.patch(
      ApiConstants.yarnGivenItem(id),
      data: {
        'quantityGiven': quantityGiven,
        'unitCost': ?unitCost,
        'notes': ?notes,
      },
    );
  }

  @override
  Future<void> deleteYarnGiven(int id) async {
    await apiClient.dio.delete(ApiConstants.yarnGivenItem(id));
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
    bool isDefective = false,
    double? deductionAmount,
    String? defectReason,
  }) async {
    await apiClient.dio.post(
      ApiConstants.workOrderFabricReturns(zigId),
      data: {
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
        'isDefective': isDefective,
        'deductionAmount': ?deductionAmount,
        'defectReason': ?defectReason,
      },
    );
  }

  @override
  Future<void> updateFabricReturn({
    required int id,
    required int quantityReturned,
    required double totalWeight,
    required double unitPrice,
    double? lengthCm,
    double? widthCm,
    String? remark,
    bool? isDefective,
    double? deductionAmount,
  }) async {
    await apiClient.dio.patch(
      ApiConstants.fabricReturnItem(id),
      data: {
        'quantityReturned': quantityReturned,
        'totalWeight': totalWeight,
        'unitPrice': unitPrice,
        'lengthCm': ?lengthCm,
        'widthCm': ?widthCm,
        'remark': ?remark,
        'isDefective': ?isDefective,
        'deductionAmount': ?deductionAmount,
      },
    );
  }

  @override
  Future<void> deleteFabricReturn(int id) async {
    await apiClient.dio.delete(ApiConstants.fabricReturnItem(id));
  }
}
