import 'package:equatable/equatable.dart';
import '../../models/transaction.dart';

enum TransactionsStatus { initial, loading, success, actionSuccess, error }

class TransactionsState extends Equatable {
  final TransactionsStatus status;
  final List<CommercialTransaction> transactions;
  final CommercialTransaction? selectedTransaction;
  final String? typeFilter;
  final String? statusFilter;
  final String? errorMessage;
  final String? successMessage;

  const TransactionsState({
    this.status = TransactionsStatus.initial,
    this.transactions = const [],
    this.selectedTransaction,
    this.typeFilter,
    this.statusFilter,
    this.errorMessage,
    this.successMessage,
  });

  TransactionsState copyWith({
    TransactionsStatus? status,
    List<CommercialTransaction>? transactions,
    CommercialTransaction? selectedTransaction,
    String? typeFilter,
    String? statusFilter,
    String? errorMessage,
    String? successMessage,
  }) {
    return TransactionsState(
      status: status ?? this.status,
      transactions: transactions ?? this.transactions,
      selectedTransaction: selectedTransaction ?? this.selectedTransaction,
      typeFilter: typeFilter ?? this.typeFilter,
      statusFilter: statusFilter ?? this.statusFilter,
      errorMessage: errorMessage ?? this.errorMessage,
      successMessage: successMessage ?? this.successMessage,
    );
  }

  @override
  List<Object?> get props => [
        status,
        transactions,
        selectedTransaction,
        typeFilter,
        statusFilter,
        errorMessage,
        successMessage,
      ];
}
