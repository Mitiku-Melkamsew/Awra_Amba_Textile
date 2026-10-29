import '../../domain/entities/transaction_entity.dart';
import '../../domain/repositories/transactions_repository.dart';
import '../datasources/transactions_remote_data_source.dart';

class TransactionsRepositoryImpl implements TransactionsRepository {
  final TransactionsRemoteDataSource remoteDataSource;

  TransactionsRepositoryImpl({required this.remoteDataSource});

  @override
  Future<List<CommercialTransactionEntity>> getTransactions({
    String? type,
    String? status,
  }) =>
      remoteDataSource.getTransactions(type: type, status: status);

  @override
  Future<CommercialTransactionEntity> getTransaction(String transactionId) =>
      remoteDataSource.getTransaction(transactionId);

  @override
  Future<String> getNextId() =>
      remoteDataSource.getNextId();

  @override
  Future<CommercialTransactionEntity> createTransaction({
    String? transactionId,
    required String type,
    required String paymentTerms,
    int? supplierId,
    int? weaverId,
    int? merchantId,
    String? notes,
    required List<Map<String, dynamic>> lines,
  }) =>
      remoteDataSource.createTransaction(
        transactionId: transactionId,
        type: type,
        paymentTerms: paymentTerms,
        supplierId: supplierId,
        weaverId: weaverId,
        merchantId: merchantId,
        notes: notes,
        lines: lines,
      );

  @override
  Future<CommercialTransactionEntity> deliver(String transactionId) =>
      remoteDataSource.deliver(transactionId);

  @override
  Future<CommercialTransactionEntity> addPayment({
    required String transactionId,
    required double amount,
    String? paymentMethod,
    String? notes,
  }) =>
      remoteDataSource.addPayment(
        transactionId: transactionId,
        amount: amount,
        paymentMethod: paymentMethod,
        notes: notes,
      );

  @override
  Future<CommercialTransactionEntity> cancel(String transactionId) =>
      remoteDataSource.cancel(transactionId);
}
