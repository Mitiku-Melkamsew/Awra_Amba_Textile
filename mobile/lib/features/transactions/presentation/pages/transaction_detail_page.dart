import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/custom_widgets.dart';
import '../blocs/transactions_bloc.dart';
import '../blocs/transactions_event.dart';
import '../blocs/transactions_state.dart';

class TransactionDetailPage extends StatefulWidget {
  final String transactionId;

  const TransactionDetailPage({super.key, required this.transactionId});

  @override
  State<TransactionDetailPage> createState() =>
      _TransactionDetailPageState();
}

class _TransactionDetailPageState extends State<TransactionDetailPage> {
  @override
  void initState() {
    super.initState();
    context
        .read<TransactionsBloc>()
        .add(LoadTransactionDetail(widget.transactionId));
  }

  void _showAddPaymentDialog(double balanceDue) {
    final amountCtrl =
        TextEditingController(text: balanceDue.round().toString());
    final methodCtrl = TextEditingController(text: 'Cash');
    final notesCtrl = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) {
        return AlertDialog(
          title: const Text('Record Payment (ክፍያ መዝግብ)'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: amountCtrl,
                  decoration: const InputDecoration(labelText: 'Amount (ETB)'),
                  keyboardType: TextInputType.number,
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: methodCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Payment Method (e.g. Cash, CBE, Telebirr)',
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: notesCtrl,
                  decoration: const InputDecoration(labelText: 'Notes (optional)'),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () {
                final amt = double.tryParse(amountCtrl.text) ?? 0.0;
                if (amt > 0) {
                  context.read<TransactionsBloc>().add(
                        AddTransactionPaymentSubmitted(
                          transactionId: widget.transactionId,
                          amount: amt,
                          paymentMethod: methodCtrl.text.isNotEmpty
                              ? methodCtrl.text
                              : null,
                          notes: notesCtrl.text.isNotEmpty
                              ? notesCtrl.text
                              : null,
                        ),
                      );
                  Navigator.pop(ctx);
                }
              },
              child: const Text('Record Payment'),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Transaction #${widget.transactionId}'),
      ),
      body: BlocConsumer<TransactionsBloc, TransactionsState>(
        listener: (context, state) {
          if (state.status == TransactionsStatus.actionSuccess &&
              state.successMessage != null) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.successMessage!),
                backgroundColor: AppColors.success,
              ),
            );
          }
        },
        builder: (context, state) {
          final txn = state.selectedTransaction;
          if (state.status == TransactionsStatus.loading && txn == null) {
            return const Center(child: CircularProgressIndicator());
          }

          if (txn == null) {
            return const Center(child: Text('Transaction not found.'));
          }

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              txn.typeLabel,
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            StatusBadge(status: txn.status),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Party: ${txn.counterpartyName}',
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: AppColors.textSecondary,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Terms: ${txn.paymentTerms.replaceAll('_', ' ').toUpperCase()} · Created: ${Formatters.date(txn.createdAt)}',
                          style: const TextStyle(
                            fontSize: 12,
                            color: AppColors.textMuted,
                          ),
                        ),
                        if (txn.deliveredAt != null) ...[
                          const SizedBox(height: 4),
                          Text(
                            'Delivered: ${Formatters.dateTime(txn.deliveredAt)}',
                            style: const TextStyle(
                              fontSize: 12,
                              color: AppColors.success,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: StatCard(
                        title: 'Total Amount',
                        value: Formatters.currency(txn.totalAmount),
                        icon: Icons.receipt_long,
                        color: AppColors.adminPrimary,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: StatCard(
                        title: 'Balance Due',
                        value: Formatters.currency(txn.balanceDue),
                        icon: Icons.pending_actions,
                        color: txn.balanceDue > 0
                            ? AppColors.danger
                            : AppColors.success,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    if (!txn.isFullyPaid && txn.status != 'cancelled')
                      Expanded(
                        child: ElevatedButton.icon(
                          icon: const Icon(Icons.payment, size: 18),
                          label: const Text('Add Payment'),
                          onPressed: () => _showAddPaymentDialog(txn.balanceDue),
                        ),
                      ),
                    if (!txn.isFullyPaid && txn.status != 'cancelled')
                      const SizedBox(width: 10),
                    if (!txn.isDelivered && txn.status != 'cancelled')
                      Expanded(
                        child: OutlinedButton.icon(
                          icon: const Icon(Icons.local_shipping_outlined,
                              size: 18),
                          label: const Text('Mark Delivered'),
                          onPressed: () {
                            context.read<TransactionsBloc>().add(
                                  DeliverTransactionSubmitted(
                                      txn.transactionId),
                                );
                          },
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 20),
                SectionHeader(
                  title: 'Line Items (ዕቃዎች)',
                  count: txn.lines.length,
                ),
                ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: txn.lines.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 8),
                  itemBuilder: (context, index) {
                    final line = txn.lines[index];
                    return Card(
                      child: Padding(
                        padding: const EdgeInsets.all(14),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    line.itemLabel,
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w600,
                                      fontSize: 14,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    '${line.quantity} × ${Formatters.currency(line.unitPrice)}',
                                    style: const TextStyle(
                                      fontSize: 12.5,
                                      color: AppColors.textSecondary,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Text(
                              Formatters.currency(line.subtotal),
                              style: const TextStyle(
                                fontWeight: FontWeight.w700,
                                fontSize: 14.5,
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
                const SizedBox(height: 20),
                SectionHeader(
                  title: 'Payments (ክፍያዎች)',
                  count: txn.payments.length,
                ),
                if (txn.payments.isEmpty)
                  const Card(
                    child: Padding(
                      padding: EdgeInsets.all(16),
                      child: Center(
                        child: Text(
                          'No payments recorded yet.',
                          style: TextStyle(
                              fontSize: 13, color: AppColors.textMuted),
                        ),
                      ),
                    ),
                  )
                else
                  ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: txn.payments.length,
                    separatorBuilder: (_, _) => const SizedBox(height: 8),
                    itemBuilder: (context, index) {
                      final p = txn.payments[index];
                      return Card(
                        child: Padding(
                          padding: const EdgeInsets.all(14),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    p.paymentMethod ?? 'Payment',
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w600,
                                      fontSize: 13.5,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    Formatters.date(p.paymentDate),
                                    style: const TextStyle(
                                      fontSize: 12,
                                      color: AppColors.textMuted,
                                    ),
                                  ),
                                ],
                              ),
                              Text(
                                Formatters.currency(p.amount),
                                style: const TextStyle(
                                  fontWeight: FontWeight.w700,
                                  fontSize: 14,
                                  color: AppColors.success,
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
              ],
            ),
          );
        },
      ),
    );
  }
}
