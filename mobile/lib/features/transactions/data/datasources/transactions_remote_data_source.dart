import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/api_client.dart';
import '../models/transaction_model.dart';

abstract class TransactionsRemoteDataSource {
  Future<List<CommercialTransactionModel>> getTransactions({
    String? type,
    String? status,
  });
  Future<CommercialTransactionModel> getTransaction(String transactionId);
  Future<String> getNextId();
  Future<CommercialTransactionModel> createTransaction({
    String? transactionId,
    required String type,
    required String paymentTerms,
    int? supplierId,
    int? weaverId,
    int? merchantId,
    String? notes,
    required List<Map<String, dynamic>> lines,
  });
  Future<CommercialTransactionModel> deliver(String transactionId);
  Future<CommercialTransactionModel> addPayment({
    required String transactionId,
    required double amount,
    String? paymentMethod,
    String? notes,
  });
  Future<CommercialTransactionModel> cancel(String transactionId);
}

class TransactionsRemoteDataSourceImpl implements TransactionsRemoteDataSource {
  final ApiClient apiClient;

  TransactionsRemoteDataSourceImpl({required this.apiClient});

  @override
  Future<List<CommercialTransactionModel>> getTransactions({
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
    return list.map((e) => CommercialTransactionModel.fromJson(e)).toList();
  }

  @override
  Future<CommercialTransactionModel> getTransaction(String transactionId) async {
    final response = await apiClient.dio.get(
      '${ApiConstants.transactions}/$transactionId',
    );
    return CommercialTransactionModel.fromJson(response.data);
  }

  @override
  Future<String> getNextId() async {
    final response = await apiClient.dio.get('${ApiConstants.transactions}/next-id');
    return response.data['transactionId']?.toString() ?? '';
  }

  @override
  Future<CommercialTransactionModel> createTransaction({
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
        'supplierId': ?supplierId,
        'weaverId': ?weaverId,
        'merchantId': ?merchantId,
        if (notes != null && notes.isNotEmpty) 'notes': notes,
        'lines': lines,
      },
    );
    return CommercialTransactionModel.fromJson(response.data);
  }

  @override
  Future<CommercialTransactionModel> deliver(String transactionId) async {
    final response = await apiClient.dio.post(
      '${ApiConstants.transactions}/$transactionId/deliver',
    );
    return CommercialTransactionModel.fromJson(response.data);
  }

  @override
  Future<CommercialTransactionModel> addPayment({
    required String transactionId,
    required double amount,
    String? paymentMethod,
    String? notes,
  }) async {
    final response = await apiClient.dio.post(
      '${ApiConstants.transactions}/$transactionId/payments',
      data: {
        'amount': amount,
        'paymentMethod': ?paymentMethod,
        'notes': ?notes,
      },
    );
    return CommercialTransactionModel.fromJson(response.data);
  }

  @override
  Future<CommercialTransactionModel> cancel(String transactionId) async {
    final response = await apiClient.dio.patch(
      '${ApiConstants.transactions}/$transactionId/cancel',
    );
    return CommercialTransactionModel.fromJson(response.data);
  }
}
