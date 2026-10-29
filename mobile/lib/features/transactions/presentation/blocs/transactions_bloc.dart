import 'package:flutter_bloc/flutter_bloc.dart';
import '../../domain/usecases/transactions_usecases.dart';
import '../../domain/repositories/transactions_repository.dart';
import 'transactions_event.dart';
import 'transactions_state.dart';

class TransactionsBloc extends Bloc<TransactionsEvent, TransactionsState> {
  final GetTransactionsUseCase getTransactionsUseCase;
  final GetTransactionDetailUseCase getTransactionDetailUseCase;
  final CreateTransactionUseCase createTransactionUseCase;
  final DeliverTransactionUseCase deliverTransactionUseCase;
  final AddTransactionPaymentUseCase addTransactionPaymentUseCase;
  final CancelTransactionUseCase cancelTransactionUseCase;
  final TransactionsRepository transactionsRepository;

  TransactionsBloc({
    required this.getTransactionsUseCase,
    required this.getTransactionDetailUseCase,
    required this.createTransactionUseCase,
    required this.deliverTransactionUseCase,
    required this.addTransactionPaymentUseCase,
    required this.cancelTransactionUseCase,
    required this.transactionsRepository,
  }) : super(const TransactionsState()) {
    on<LoadTransactions>(_onLoadTransactions);
    on<LoadTransactionDetail>(_onLoadTransactionDetail);
    on<CreateTransactionSubmitted>(_onCreateTransactionSubmitted);
    on<DeliverTransactionSubmitted>(_onDeliverTransactionSubmitted);
    on<AddTransactionPaymentSubmitted>(_onAddTransactionPaymentSubmitted);
    on<CancelTransactionSubmitted>(_onCancelTransactionSubmitted);
  }

  Future<void> _onLoadTransactions(
    LoadTransactions event,
    Emitter<TransactionsState> emit,
  ) async {
    emit(state.copyWith(
      status: TransactionsStatus.loading,
      typeFilter: event.type,
      statusFilter: event.status,
      errorMessage: null,
      successMessage: null,
    ));
    try {
      final list = await getTransactionsUseCase(
        GetTransactionsParams(type: event.type, status: event.status),
      );
      emit(state.copyWith(
        status: TransactionsStatus.success,
        transactions: list,
      ));
    } catch (e) {
      emit(state.copyWith(
        status: TransactionsStatus.error,
        errorMessage: e.toString().replaceAll('Exception: ', ''),
      ));
    }
  }

  Future<void> _onLoadTransactionDetail(
    LoadTransactionDetail event,
    Emitter<TransactionsState> emit,
  ) async {
    emit(state.copyWith(status: TransactionsStatus.loading, errorMessage: null));
    try {
      final txn = await getTransactionDetailUseCase(event.transactionId);
      emit(state.copyWith(
        status: TransactionsStatus.success,
        selectedTransaction: txn,
      ));
    } catch (e) {
      emit(state.copyWith(
        status: TransactionsStatus.error,
        errorMessage: e.toString().replaceAll('Exception: ', ''),
      ));
    }
  }

  Future<void> _onCreateTransactionSubmitted(
    CreateTransactionSubmitted event,
    Emitter<TransactionsState> emit,
  ) async {
    emit(state.copyWith(status: TransactionsStatus.loading, errorMessage: null));
    try {
      final txn = await createTransactionUseCase(
        CreateTransactionParams(
          transactionId: event.transactionId,
          type: event.type,
          paymentTerms: event.paymentTerms,
          supplierId: event.supplierId,
          weaverId: event.weaverId,
          merchantId: event.merchantId,
          notes: event.notes,
          lines: event.lines,
        ),
      );
      final list = await getTransactionsUseCase(
        GetTransactionsParams(type: state.typeFilter, status: state.statusFilter),
      );
      emit(state.copyWith(
        status: TransactionsStatus.actionSuccess,
        transactions: list,
        selectedTransaction: txn,
        successMessage: 'Transaction #${txn.transactionId} created.',
      ));
    } catch (e) {
      emit(state.copyWith(
        status: TransactionsStatus.error,
        errorMessage: e.toString().replaceAll('Exception: ', ''),
      ));
    }
  }

  Future<void> _onDeliverTransactionSubmitted(
    DeliverTransactionSubmitted event,
    Emitter<TransactionsState> emit,
  ) async {
    emit(state.copyWith(status: TransactionsStatus.loading, errorMessage: null));
    try {
      final txn = await deliverTransactionUseCase(event.transactionId);
      final list = await getTransactionsUseCase(
        GetTransactionsParams(type: state.typeFilter, status: state.statusFilter),
      );
      emit(state.copyWith(
        status: TransactionsStatus.actionSuccess,
        transactions: list,
        selectedTransaction: txn,
        successMessage: 'Goods delivered for #${event.transactionId}.',
      ));
    } catch (e) {
      emit(state.copyWith(
        status: TransactionsStatus.error,
        errorMessage: e.toString().replaceAll('Exception: ', ''),
      ));
    }
  }

  Future<void> _onAddTransactionPaymentSubmitted(
    AddTransactionPaymentSubmitted event,
    Emitter<TransactionsState> emit,
  ) async {
    emit(state.copyWith(status: TransactionsStatus.loading, errorMessage: null));
    try {
      final txn = await addTransactionPaymentUseCase(
        AddTransactionPaymentParams(
          transactionId: event.transactionId,
          amount: event.amount,
          paymentMethod: event.paymentMethod,
          notes: event.notes,
        ),
      );
      final list = await getTransactionsUseCase(
        GetTransactionsParams(type: state.typeFilter, status: state.statusFilter),
      );
      emit(state.copyWith(
        status: TransactionsStatus.actionSuccess,
        transactions: list,
        selectedTransaction: txn,
        successMessage: 'Payment recorded for #${event.transactionId}.',
      ));
    } catch (e) {
      emit(state.copyWith(
        status: TransactionsStatus.error,
        errorMessage: e.toString().replaceAll('Exception: ', ''),
      ));
    }
  }

  Future<void> _onCancelTransactionSubmitted(
    CancelTransactionSubmitted event,
    Emitter<TransactionsState> emit,
  ) async {
    emit(state.copyWith(status: TransactionsStatus.loading, errorMessage: null));
    try {
      final txn = await cancelTransactionUseCase(event.transactionId);
      final list = await getTransactionsUseCase(
        GetTransactionsParams(type: state.typeFilter, status: state.statusFilter),
      );
      emit(state.copyWith(
        status: TransactionsStatus.actionSuccess,
        transactions: list,
        selectedTransaction: txn,
        successMessage: 'Transaction #${event.transactionId} cancelled.',
      ));
    } catch (e) {
      emit(state.copyWith(
        status: TransactionsStatus.error,
        errorMessage: e.toString().replaceAll('Exception: ', ''),
      ));
    }
  }
}
