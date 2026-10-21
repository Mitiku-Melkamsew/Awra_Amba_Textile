import '../core/constants/api_constants.dart';
import '../core/network/api_client.dart';
import '../models/transaction.dart';

class TransactionsRepository {
  final ApiClient apiClient;

  TransactionsRepository({required this.apiClient});

  Future<List<CommercialTransaction>> getTransactions({
    String? type,
    String? status,
  }) async {
    final queryParams = <String, dynamic>{};
    if (type != null && type.isNotEmpty) queryParams['type'] = type;
    if (status != null && status.isNotEmpty) queryParams['status'] = status;

    final response = await apiClient.dio.get(
      ApiConstants.transactions,
      queryParameters: queryParams,
    );

    final list = response.data as List;
    return list.map((e) => CommercialTransaction.fromJson(e)).toList();
  }

  Future<CommercialTransaction> getTransaction(String transactionId) async {
    final response = await apiClient.dio.get(
      '${ApiConstants.transactions}/$transactionId',
    );
    return CommercialTransaction.fromJson(response.data);
  }

  Future<String> getNextId() async {
    final response = await apiClient.dio.get('${ApiConstants.transactions}/next-id');
    return response.data['transactionId']?.toString() ?? '';
  }

  Future<CommercialTransaction> createTransaction({
    String? transactionId,
    required String type,
    required String paymentTerms,
    int? supplierId,
    int? weaverId,
    int? merchantId,
    String? notes,
    required List<Map<String, dynamic>> lines,
  }) async {
    final response = await apiClient.dio.post(
      ApiConstants.transactions,
      data: {
        if (transactionId != null && transactionId.isNotEmpty)
          'transactionId': transactionId,
        'type': type,
        'paymentTerms': paymentTerms,
        if (supplierId != null) 'supplierId': supplierId,
        if (weaverId != null) 'weaverId': weaverId,
        if (merchantId != null) 'merchantId': merchantId,
        if (notes != null && notes.isNotEmpty) 'notes': notes,
        'lines': lines,
      },
    );
    return CommercialTransaction.fromJson(response.data);
  }

  Future<CommercialTransaction> deliver(String transactionId) async {
    final response = await apiClient.dio.post(
      '${ApiConstants.transactions}/$transactionId/deliver',
    );
    return CommercialTransaction.fromJson(response.data);
  }

  Future<CommercialTransaction> addPayment({
    required String transactionId,
    required double amount,
    String? paymentMethod,
    String? notes,
  }) async {
    final response = await apiClient.dio.post(
      '${ApiConstants.transactions}/$transactionId/payments',
      data: {
        'amount': amount,
        if (paymentMethod != null) 'paymentMethod': paymentMethod,
        if (notes != null) 'notes': notes,
      },
    );
    return CommercialTransaction.fromJson(response.data);
  }

  Future<CommercialTransaction> cancel(String transactionId) async {
    final response = await apiClient.dio.patch(
      '${ApiConstants.transactions}/$transactionId/cancel',
    );
    return CommercialTransaction.fromJson(response.data);
  }
}
