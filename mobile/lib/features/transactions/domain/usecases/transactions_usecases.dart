import '../../../../core/usecase/usecase.dart';
import '../entities/transaction_entity.dart';
import '../repositories/transactions_repository.dart';

class GetTransactionsParams {
  final String? type;
  final String? status;
  const GetTransactionsParams({this.type, this.status});
}

class GetTransactionsUseCase implements UseCase<List<CommercialTransactionEntity>, GetTransactionsParams> {
  final TransactionsRepository repository;
  GetTransactionsUseCase(this.repository);

  @override
  Future<List<CommercialTransactionEntity>> call(GetTransactionsParams params) {
    return repository.getTransactions(type: params.type, status: params.status);
  }
}

class GetTransactionDetailUseCase implements UseCase<CommercialTransactionEntity, String> {
  final TransactionsRepository repository;
  GetTransactionDetailUseCase(this.repository);

  @override
  Future<CommercialTransactionEntity> call(String transactionId) {
    return repository.getTransaction(transactionId);
  }
}

class CreateTransactionParams {
  final String? transactionId;
  final String type;
  final String paymentTerms;
  final int? supplierId;
  final int? weaverId;
  final int? merchantId;
  final String? notes;
  final List<Map<String, dynamic>> lines;

  const CreateTransactionParams({
    this.transactionId,
    required this.type,
    required this.paymentTerms,
    this.supplierId,
    this.weaverId,
    this.merchantId,
    this.notes,
    required this.lines,
  });
}

class CreateTransactionUseCase implements UseCase<CommercialTransactionEntity, CreateTransactionParams> {
  final TransactionsRepository repository;
  CreateTransactionUseCase(this.repository);

  @override
  Future<CommercialTransactionEntity> call(CreateTransactionParams params) {
    return repository.createTransaction(
      transactionId: params.transactionId,
      type: params.type,
      paymentTerms: params.paymentTerms,
      supplierId: params.supplierId,
      weaverId: params.weaverId,
      merchantId: params.merchantId,
      notes: params.notes,
      lines: params.lines,
    );
  }
}

class DeliverTransactionUseCase implements UseCase<CommercialTransactionEntity, String> {
  final TransactionsRepository repository;
  DeliverTransactionUseCase(this.repository);

  @override
  Future<CommercialTransactionEntity> call(String transactionId) {
    return repository.deliver(transactionId);
  }
}

class AddTransactionPaymentParams {
  final String transactionId;
  final double amount;
  final String? paymentMethod;
  final String? notes;

  const AddTransactionPaymentParams({
    required this.transactionId,
    required this.amount,
    this.paymentMethod,
    this.notes,
  });
}

class AddTransactionPaymentUseCase implements UseCase<CommercialTransactionEntity, AddTransactionPaymentParams> {
  final TransactionsRepository repository;
  AddTransactionPaymentUseCase(this.repository);

  @override
  Future<CommercialTransactionEntity> call(AddTransactionPaymentParams params) {
    return repository.addPayment(
      transactionId: params.transactionId,
      amount: params.amount,
      paymentMethod: params.paymentMethod,
      notes: params.notes,
    );
  }
}

class CancelTransactionUseCase implements UseCase<CommercialTransactionEntity, String> {
  final TransactionsRepository repository;
  CancelTransactionUseCase(this.repository);

  @override
  Future<CommercialTransactionEntity> call(String transactionId) {
    return repository.cancel(transactionId);
  }
}

class GetNextTransactionIdUseCase implements UseCase<String, NoParams> {
  final TransactionsRepository repository;
  GetNextTransactionIdUseCase(this.repository);

  @override
  Future<String> call(NoParams params) {
    return repository.getNextId();
  }
}
