import '../entities/transaction_entity.dart';

abstract class TransactionsRepository {
  Future<List<CommercialTransactionEntity>> getTransactions({
    String? type,
    String? status,
  });
  Future<CommercialTransactionEntity> getTransaction(String transactionId);
  Future<String> getNextId();
  Future<CommercialTransactionEntity> createTransaction({
    String? transactionId,
    required String type,
    required String paymentTerms,
    int? supplierId,
    int? weaverId,
    int? merchantId,
    String? notes,
    required List<Map<String, dynamic>> lines,
  });
  Future<CommercialTransactionEntity> deliver(String transactionId);
  Future<CommercialTransactionEntity> addPayment({
    required String transactionId,
    required double amount,
    String? paymentMethod,
    String? notes,
  });
  Future<CommercialTransactionEntity> cancel(String transactionId);
}
