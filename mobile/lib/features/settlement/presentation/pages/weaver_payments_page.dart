import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:awra_amba_textile/core/constants/app_colors.dart';
import 'package:awra_amba_textile/core/utils/formatters.dart';
import 'package:awra_amba_textile/core/widgets/custom_widgets.dart';
import 'package:awra_amba_textile/features/authentication/presentation/blocs/auth_bloc.dart';
import 'package:awra_amba_textile/features/transactions/domain/entities/transaction_entity.dart';
import 'package:awra_amba_textile/features/transactions/presentation/blocs/transactions_bloc.dart';
import 'package:awra_amba_textile/features/transactions/presentation/blocs/transactions_event.dart';
import 'package:awra_amba_textile/features/transactions/presentation/blocs/transactions_state.dart';
import 'package:awra_amba_textile/features/weavers/domain/repositories/weavers_repository.dart';

class WeaverPaymentsPage extends StatefulWidget {
  const WeaverPaymentsPage({super.key});

  @override
  State<WeaverPaymentsPage> createState() => _WeaverPaymentsPageState();
}

class _WeaverPaymentsPageState extends State<WeaverPaymentsPage> {
  Map<String, dynamic>? _unsettledData;
  bool _loadingUnsettled = false;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  void _loadData() {
    final authState = context.read<AuthBloc>().state;
    final weaverId = authState.user?.weaverId;

    if (weaverId != null) {
      _loadUnsettledBalance(weaverId);
    }

    context.read<TransactionsBloc>().add(
          const LoadTransactions(type: 'fabric_purchase'),
        );
  }

  Future<void> _loadUnsettledBalance(int weaverId) async {
    setState(() => _loadingUnsettled = true);
    try {
      final repo = context.read<WeaversRepository>();
      final data = await repo.getUnsettled(weaverId);
      if (mounted) {
        setState(() {
          _unsettledData = data;
          _loadingUnsettled = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() => _loadingUnsettled = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Payments (የእኔ ክፍያዎች)'),
      ),
      body: RefreshIndicator(
        onRefresh: () async => _loadData(),
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Unsettled / Pending Balance Card
              Card(
                color: Colors.white,
                elevation: 2,
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment:
                            MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Estimated Pending Credit',
                            style: TextStyle(
                              fontSize: 13,
                              color: AppColors.textSecondary,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: AppColors.warning.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: const Text(
                              'Unsettled (ያልተከፈለ)',
                              style: TextStyle(
                                fontSize: 11,
                                color: AppColors.warning,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      if (_loadingUnsettled)
                        const Padding(
                          padding: EdgeInsets.symmetric(vertical: 8),
                          child: LinearProgressIndicator(),
                        )
                      else ...[
                        Text(
                          Formatters.currency(
                            (_unsettledData?['estimatedCredit'] as num?)
                                    ?.toDouble() ??
                                0.0,
                          ),
                          style: const TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.w800,
                            color: AppColors.success,
                          ),
                        ),
                        const SizedBox(height: 12),
                        const Divider(height: 1),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(
                              child: _SummaryItem(
                                label: 'Returns Pending',
                                value:
                                    '${_unsettledData?['unsettledReturnsCount'] ?? 0} items',
                              ),
                            ),
                            Expanded(
                              child: _SummaryItem(
                                label: 'Weft Balance',
                                value:
                                    '${(_unsettledData?['netWeftBalanceKg'] as num?)?.toStringAsFixed(1) ?? '0.0'} kg',
                              ),
                            ),
                          ],
                        ),
                      ],
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 24),

              // Payment History Header
              const SectionHeader(
                title: 'Settled Payments (የተከፈሉ ክፍያዎች)',
              ),
              const SizedBox(height: 8),

              BlocBuilder<TransactionsBloc, TransactionsState>(
                builder: (context, state) {
                  if (state.status == TransactionsStatus.loading &&
                      state.transactions.isEmpty) {
                    return const Center(
                      child: Padding(
                        padding: EdgeInsets.all(32),
                        child: CircularProgressIndicator(),
                      ),
                    );
                  }

                  if (state.transactions.isEmpty) {
                    return const EmptyState(
                      icon: Icons.receipt_long_outlined,
                      title: 'No Payments',
                      message: 'No completed settlement records yet',
                    );
                  }

                  return Column(
                    children: state.transactions
                        .map((txn) => _PaymentCard(txn: txn))
                        .toList(),
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SummaryItem extends StatelessWidget {
  final String label;
  final String value;

  const _SummaryItem({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 11,
            color: AppColors.textMuted,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          value,
          style: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }
}

class _PaymentCard extends StatelessWidget {
  final CommercialTransactionEntity txn;

  const _PaymentCard({required this.txn});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  radius: 18,
                  backgroundColor: AppColors.success.withValues(alpha: 0.1),
                  child: const Icon(Icons.arrow_downward,
                      size: 18, color: AppColors.success),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Settlement #${txn.transactionId}',
                        style: const TextStyle(
                          fontWeight: FontWeight.w700,
                          fontSize: 14,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        Formatters.date(txn.createdAt),
                        style: const TextStyle(
                          fontSize: 11.5,
                          color: AppColors.textMuted,
                        ),
                      ),
                    ],
                  ),
                ),
                Text(
                  Formatters.currency(txn.totalAmount),
                  style: const TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 15,
                    color: AppColors.success,
                  ),
                ),
              ],
            ),
            if (txn.payments.isNotEmpty) ...[
              const Divider(height: 18),
              ...txn.payments.map((p) => Padding(
                    padding: const EdgeInsets.symmetric(vertical: 2),
                    child: Row(
                      mainAxisAlignment:
                          MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Paid via ${p.paymentMethod} • ${Formatters.date(p.paymentDate)}',
                          style: const TextStyle(
                            fontSize: 11.5,
                            color: AppColors.textSecondary,
                          ),
                        ),
                        Text(
                          Formatters.currency(p.amount),
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  )),
            ],
          ],
        ),
      ),
    );
  }
}
