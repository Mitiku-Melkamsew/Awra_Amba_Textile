import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../blocs/auth/auth_bloc.dart';
import '../../blocs/transactions/transactions_bloc.dart';
import '../../blocs/transactions/transactions_event.dart';
import '../../blocs/transactions/transactions_state.dart';
import '../../core/constants/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../models/transaction.dart';
import '../../repositories/weavers_repository.dart';
import '../widgets/custom_widgets.dart';

class WeaverPaymentsScreen extends StatefulWidget {
  const WeaverPaymentsScreen({super.key});

  @override
  State<WeaverPaymentsScreen> createState() => _WeaverPaymentsScreenState();
}

class _WeaverPaymentsScreenState extends State<WeaverPaymentsScreen> {
  Map<String, dynamic>? _unsettledData;
  bool _loadingUnsettled = false;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  void _loadData() {
    final weaverId = context.read<AuthBloc>().state.user?.weaverId;
    if (weaverId != null) {
      context.read<TransactionsBloc>().add(
            const LoadTransactions(type: 'weaver_payout'),
          );
      _loadUnsettled(weaverId);
    }
  }

  Future<void> _loadUnsettled(int weaverId) async {
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
    final weaverId = context.watch<AuthBloc>().state.user?.weaverId;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Payments & Payouts (ክፍያዎች)'),
        backgroundColor: AppColors.weaverPrimary,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadData,
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async => _loadData(),
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Unsettled / Pending balance card
            _buildUnsettledCard(),
            const SizedBox(height: 20),

            // Payout history header
            const SectionHeader(
              title: 'Payout History (የተከፈሉ ሂሳቦች)',
              subtitle: 'Settled payments and disbursements',
            ),
            const SizedBox(height: 10),

            // Payouts list
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

                if (state.status == TransactionsStatus.error &&
                    state.transactions.isEmpty) {
                  return ErrorBanner(
                    message: state.errorMessage ?? 'Failed to load payments',
                  );
                }

                final myPayouts = state.transactions.where((t) {
                  if (weaverId == null) return true;
                  return t.weaverId == weaverId ||
                      (t.type == 'weaver_payout' &&
                          t.weaver?.weaverId == weaverId);
                }).toList();

                if (myPayouts.isEmpty) {
                  return const EmptyState(
                    icon: Icons.receipt_long_outlined,
                    title: 'No Payout History',
                    subtitle: 'Completed payout records will appear here.',
                  );
                }

                return Column(
                  children: myPayouts
                      .map((txn) => _WeaverPayoutCard(transaction: txn))
                      .toList(),
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildUnsettledCard() {
    if (_loadingUnsettled) {
      return const Card(
        child: Padding(
          padding: EdgeInsets.all(24),
          child: Center(child: CircularProgressIndicator()),
        ),
      );
    }

    final returns = (_unsettledData?['returns'] as List?) ?? [];
    final yarn = (_unsettledData?['yarnGiven'] as List?) ?? [];

    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppColors.weaverPrimary,
            AppColors.weaverSecondary,
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: AppColors.weaverPrimary.withOpacity(0.2),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Pending Settlement / ያልተወራረደ',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: Colors.white70,
                ),
              ),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Text(
                  'Awaiting Payroll',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '${returns.length} Returns',
                      style: const TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 2),
                    const Text(
                      'Fabric waiting for hisab',
                      style: TextStyle(fontSize: 11, color: Colors.white70),
                    ),
                  ],
                ),
              ),
              Container(
                height: 36,
                width: 1,
                color: Colors.white24,
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '${yarn.length} Dispatches',
                      style: const TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 2),
                    const Text(
                      'Active yarn balances',
                      style: TextStyle(fontSize: 11, color: Colors.white70),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _WeaverPayoutCard extends StatelessWidget {
  final CommercialTransaction transaction;

  const _WeaverPayoutCard({required this.transaction});

  @override
  Widget build(BuildContext context) {
    final isPaid = transaction.isFullyPaid ||
        transaction.status.toLowerCase() == 'completed' ||
        transaction.status.toLowerCase() == 'paid';

    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: (isPaid ? AppColors.success : AppColors.info)
                            .withOpacity(0.12),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Icon(
                        Icons.payments_outlined,
                        size: 20,
                        color: isPaid ? AppColors.success : AppColors.info,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Payment #${transaction.transactionId}',
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          Formatters.date(transaction.createdAt),
                          style: const TextStyle(
                            fontSize: 11.5,
                            color: AppColors.textMuted,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
                Text(
                  Formatters.currency(transaction.totalAmount),
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: isPaid ? AppColors.success : AppColors.textPrimary,
                  ),
                ),
              ],
            ),
            if (transaction.notes != null && transaction.notes!.isNotEmpty) ...[
              const SizedBox(height: 8),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: AppColors.surfaceVariant,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  transaction.notes!,
                  style: const TextStyle(
                    fontSize: 11.5,
                    color: AppColors.textSecondary,
                  ),
                ),
              ),
            ],
            if (transaction.payments.isNotEmpty) ...[
              const SizedBox(height: 8),
              const Divider(height: 12),
              ...transaction.payments.map(
                (p) => Padding(
                  padding: const EdgeInsets.symmetric(vertical: 2),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        '${p.paymentMethod ?? 'Direct Payout'} (${Formatters.date(p.paymentDate)})',
                        style: const TextStyle(
                          fontSize: 11.5,
                          color: AppColors.textMuted,
                        ),
                      ),
                      Text(
                        Formatters.currency(p.amount),
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
