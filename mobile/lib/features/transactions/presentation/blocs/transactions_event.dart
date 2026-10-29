import 'package:equatable/equatable.dart';

abstract class TransactionsEvent extends Equatable {
  const TransactionsEvent();
  @override
  List<Object?> get props => [];
}

class LoadTransactions extends TransactionsEvent {
  final String? type;
  final String? status;

  const LoadTransactions({this.type, this.status});

  @override
  List<Object?> get props => [type, status];
}

class LoadTransactionDetail extends TransactionsEvent {
  final String transactionId;

  const LoadTransactionDetail(this.transactionId);

  @override
  List<Object?> get props => [transactionId];
}

class CreateTransactionSubmitted extends TransactionsEvent {
  final String? transactionId;
  final String type;
  final String paymentTerms;
  final int? supplierId;
  final int? weaverId;
  final int? merchantId;
  final String? notes;
  final List<Map<String, dynamic>> lines;

  const CreateTransactionSubmitted({
    this.transactionId,
    required this.type,
    required this.paymentTerms,
    this.supplierId,
    this.weaverId,
    this.merchantId,
    this.notes,
    required this.lines,
  });

  @override
  List<Object?> get props => [
        transactionId,
        type,
        paymentTerms,
        supplierId,
        weaverId,
        merchantId,
      ];
}

class DeliverTransactionSubmitted extends TransactionsEvent {
  final String transactionId;

  const DeliverTransactionSubmitted(this.transactionId);

  @override
  List<Object?> get props => [transactionId];
}

class AddTransactionPaymentSubmitted extends TransactionsEvent {
  final String transactionId;
  final double amount;
  final String? paymentMethod;
  final String? notes;

  const AddTransactionPaymentSubmitted({
    required this.transactionId,
    required this.amount,
    this.paymentMethod,
    this.notes,
  });

  @override
  List<Object?> get props => [transactionId, amount, paymentMethod];
}

class CancelTransactionSubmitted extends TransactionsEvent {
  final String transactionId;

  const CancelTransactionSubmitted(this.transactionId);

  @override
  List<Object?> get props => [transactionId];
}
