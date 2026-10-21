import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../blocs/transactions/transactions_bloc.dart';
import '../../../blocs/transactions/transactions_event.dart';
import '../../../blocs/transactions/transactions_state.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../widgets/custom_widgets.dart';
import 'create_transaction_screen.dart';
import 'transaction_detail_screen.dart';

class TransactionsListScreen extends StatefulWidget {
  const TransactionsListScreen({super.key});

  @override
  State<TransactionsListScreen> createState() => _TransactionsListScreenState();
}

class _TransactionsListScreenState extends State<TransactionsListScreen> {
  String? _selectedType;

  final List<Map<String, String?>> _types = [
    {'label': 'All', 'value': null},
    {'label': 'Yarn Purchases', 'value': 'yarn_purchase'},
    {'label': 'Fabric Purchases', 'value': 'fabric_purchase'},
    {'label': 'Yarn Sales', 'value': 'yarn_sale'},
    {'label': 'Fabric Sales', 'value': 'fabric_sale'},
  ];

  @override
  void initState() {
    super.initState();
    context.read<TransactionsBloc>().add(const LoadTransactions());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Transactions (ግብይቶች)'),
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: AppColors.adminPrimary,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add),
        label: const Text('New Transaction'),
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => const CreateTransactionScreen(),
            ),
          ).then((_) {
            context.read<TransactionsBloc>().add(
                  LoadTransactions(type: _selectedType),
                );
          });
        },
      ),
      body: Column(
        children: [
          // Filter Chips
          Container(
            color: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: _types.map((filter) {
                  final isSelected = _selectedType == filter['value'];
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: FilterChip(
                      label: Text(filter['label']!),
                      selected: isSelected,
                      selectedColor: AppColors.adminPrimary.withOpacity(0.15),
                      labelStyle: TextStyle(
                        fontSize: 12.5,
                        fontWeight:
                            isSelected ? FontWeight.w700 : FontWeight.w500,
                        color: isSelected
                            ? AppColors.adminPrimary
                            : AppColors.textSecondary,
                      ),
                      onSelected: (selected) {
                        setState(() {
                          _selectedType = filter['value'];
                        });
                        context.read<TransactionsBloc>().add(
                              LoadTransactions(type: _selectedType),
                            );
                      },
                    ),
                  );
                }).toList(),
              ),
            ),
          ),

          // Transactions List
          Expanded(
            child: BlocBuilder<TransactionsBloc, TransactionsState>(
              builder: (context, state) {
                if (state.status == TransactionsStatus.loading &&
                    state.transactions.isEmpty) {
                  return const Center(child: CircularProgressIndicator());
                }

                if (state.status == TransactionsStatus.error &&
                    state.transactions.isEmpty) {
                  return Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.error_outline,
                              size: 40, color: AppColors.danger),
                          const SizedBox(height: 12),
                          Text(state.errorMessage ?? 'Failed to load transactions'),
                          const SizedBox(height: 12),
                          ElevatedButton(
                            onPressed: () => context
                                .read<TransactionsBloc>()
                                .add(LoadTransactions(type: _selectedType)),
                            child: const Text('Retry'),
                          ),
                        ],
                      ),
                    ),
                  );
                }

                if (state.transactions.isEmpty) {
                  return EmptyState(
                    title: 'No Transactions',
                    message: _selectedType != null
                        ? 'No transactions matching this filter.'
                        : 'No commercial transactions recorded yet.',
                  );
                }

                return RefreshIndicator(
                  onRefresh: () async {
                    context.read<TransactionsBloc>().add(
                          LoadTransactions(type: _selectedType),
                        );
                  },
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: state.transactions.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (context, index) {
                      final txn = state.transactions[index];
                      return Card(
                        child: InkWell(
                          borderRadius: BorderRadius.circular(12),
                          onTap: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => TransactionDetailScreen(
                                  transactionId: txn.transactionId,
                                ),
                              ),
                            ).then((_) {
                              context.read<TransactionsBloc>().add(
                                    LoadTransactions(type: _selectedType),
                                  );
                            });
                          },
                          child: Padding(
                            padding: const EdgeInsets.all(14),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Text(
                                      '#${txn.transactionId}',
                                      style: const TextStyle(
                                        fontWeight: FontWeight.w700,
                                        fontSize: 15,
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    StatusBadge(status: txn.status),
                                    const Spacer(),
                                    Text(
                                      Formatters.currency(txn.totalAmount),
                                      style: const TextStyle(
                                        fontWeight: FontWeight.w700,
                                        fontSize: 15,
                                        color: AppColors.textPrimary,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  txn.typeLabel,
                                  style: const TextStyle(
                                    fontSize: 13,
                                    color: AppColors.textSecondary,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                                const Divider(height: 18),
                                Row(
                                  mainAxisAlignment:
                                      MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(
                                      txn.counterpartyName,
                                      style: const TextStyle(
                                        fontSize: 12.5,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                    Row(
                                      children: [
                                        if (txn.isFullyPaid)
                                          const Text(
                                            'Paid',
                                            style: TextStyle(
                                              fontSize: 12,
                                              color: AppColors.success,
                                              fontWeight: FontWeight.w600,
                                            ),
                                          )
                                        else
                                          Text(
                                            'Due: ${Formatters.currency(txn.balanceDue)}',
                                            style: const TextStyle(
                                              fontSize: 12,
                                              color: AppColors.danger,
                                              fontWeight: FontWeight.w600,
                                            ),
                                          ),
                                        const SizedBox(width: 8),
                                        Text(
                                          Formatters.date(txn.createdAt),
                                          style: const TextStyle(
                                            fontSize: 11.5,
                                            color: AppColors.textMuted,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
