import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/utils/formatters.dart';
import '../blocs/settlement_bloc.dart';
import '../blocs/settlement_event.dart';
import '../blocs/settlement_state.dart';
import 'master_hisab_preview_page.dart';

class SettlementHistoryPage extends StatefulWidget {
  const SettlementHistoryPage({super.key});

  @override
  State<SettlementHistoryPage> createState() => _SettlementHistoryPageState();
}

class _SettlementHistoryPageState extends State<SettlementHistoryPage> {
  @override
  void initState() {
    super.initState();
    context.read<SettlementBloc>().add(LoadSettlementHistory());
  }

  void _showPayoutModal(Map<String, dynamic> batch) {
    final batchId = batch['previewId']?.toString() ??
        batch['batchId']?.toString() ??
        batch['id']?.toString() ??
        '';
    final grandTotal = (batch['grandTotal'] as num?)?.toDouble() ?? 0.0;
    final paidTotal = (batch['paidTotal'] as num?)?.toDouble() ?? 0.0;
    final balance = (batch['balance'] as num?)?.toDouble() ??
        (grandTotal - paidTotal > 0 ? grandTotal - paidTotal : 0.0);

    final amountCtrl = TextEditingController(
      text: (balance > 0 ? balance : grandTotal).round().toString(),
    );
    String selectedMethod =
        batch['paymentMethod']?.toString() ?? 'cash';
    final notesCtrl = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (modalCtx) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Padding(
              padding: EdgeInsets.only(
                left: 20,
                right: 20,
                top: 20,
                bottom: MediaQuery.of(context).viewInsets.bottom + 20,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Disburse Payout · Batch #$batchId',
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close),
                        onPressed: () => Navigator.pop(modalCtx),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Balance Due: ${Formatters.currency(balance)} / Total: ${Formatters.currency(grandTotal)}',
                    style: const TextStyle(
                      fontSize: 13,
                      color: AppColors.textSecondary,
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: amountCtrl,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      labelText: 'Disbursement Amount (ETB)',
                      prefixIcon: Icon(Icons.payments_outlined),
                    ),
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    initialValue: selectedMethod.toLowerCase() == 'cbe' ||
                            selectedMethod.toLowerCase() == 'telebirr'
                        ? selectedMethod.toLowerCase()
                        : 'cash',
                    decoration: const InputDecoration(
                      labelText: 'Payment Method',
                      prefixIcon: Icon(Icons.account_balance_outlined),
                    ),
                    items: const [
                      DropdownMenuItem(value: 'cash', child: Text('Cash (ጥሬ ገንዘብ)')),
                      DropdownMenuItem(value: 'cbe', child: Text('CBE Bank Transfer')),
                      DropdownMenuItem(value: 'telebirr', child: Text('Telebirr')),
                    ],
                    onChanged: (val) {
                      if (val != null) {
                        setModalState(() => selectedMethod = val);
                      }
                    },
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: notesCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Disbursement Notes (optional)',
                      prefixIcon: Icon(Icons.note_alt_outlined),
                    ),
                  ),
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.success,
                      ),
                      onPressed: () {
                        final amt = double.tryParse(amountCtrl.text) ?? 0.0;
                        if (amt <= 0) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Please enter a valid positive payment amount.'),
                            ),
                          );
                          return;
                        }
                        this.context.read<SettlementBloc>().add(
                              PayBatchSubmitted(
                                batchId: batchId,
                                amount: amt,
                                paymentMethod: selectedMethod,
                                notes: notesCtrl.text.trim().isNotEmpty
                                    ? notesCtrl.text.trim()
                                    : null,
                              ),
                            );
                        Navigator.pop(modalCtx);
                      },
                      child: const Text(
                        'Confirm Disbursement',
                        style: TextStyle(fontWeight: FontWeight.w700),
                      ),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Settlement History (የሂሳብ ታሪክ)'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              context.read<SettlementBloc>().add(LoadSettlementHistory());
            },
          ),
        ],
      ),
      body: BlocConsumer<SettlementBloc, SettlementState>(
        listener: (context, state) {
          if (state.status == SettlementStatus.committed &&
              state.successMessage != null) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.successMessage!),
                backgroundColor: AppColors.success,
              ),
            );
            context.read<SettlementBloc>().add(LoadSettlementHistory());
          }
          if (state.status == SettlementStatus.error &&
              state.errorMessage != null) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.errorMessage!),
                backgroundColor: AppColors.danger,
              ),
            );
          }
        },
        builder: (context, state) {
          if (state.status == SettlementStatus.previewing &&
              state.batches.isEmpty) {
            return const Center(child: CircularProgressIndicator());
          }

          if (state.batches.isEmpty) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(
                      Icons.history_toggle_off,
                      size: 64,
                      color: AppColors.textMuted,
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      'No batch settlements confirmed yet.',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Confirmed payroll runs and historical disbursement receipts will be listed here.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 13,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
            );
          }

          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: state.batches.length,
            separatorBuilder: (context, index) => const SizedBox(height: 12),
            itemBuilder: (context, index) {
              final raw = state.batches[index];
              final batch = raw is Map<String, dynamic>
                  ? raw
                  : <String, dynamic>{};
              final batchId = batch['previewId']?.toString() ??
                  batch['batchId']?.toString() ??
                  batch['id']?.toString() ??
                  '#$index';
              final grandTotal =
                  (batch['grandTotal'] as num?)?.toDouble() ?? 0.0;
              final paidTotal =
                  (batch['paidTotal'] as num?)?.toDouble() ?? 0.0;
              final balance = (batch['balance'] as num?)?.toDouble() ??
                  (grandTotal - paidTotal > 0 ? grandTotal - paidTotal : 0.0);
              final weaverCount = batch['weaverCount'] ??
                  (batch['weavers'] as List?)?.length ??
                  0;
              final paymentStatus =
                  batch['paymentStatus']?.toString().toLowerCase() ??
                      (balance <= 0 ? 'paid' : 'pending');
              final confirmedAt = batch['confirmedAt']?.toString() ??
                  batch['createdAt']?.toString() ??
                  '';
              final cutoffDate = batch['cutoffDate']?.toString() ?? '';
              final paymentMethod =
                  batch['paymentMethod']?.toString().toUpperCase() ?? 'CASH';

              final isFullyPaid =
                  paymentStatus == 'paid' || balance <= 0.01;

              return Card(
                elevation: 1,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                  side: BorderSide(
                    color: isFullyPaid
                        ? const Color(0xFFBBF7D0)
                        : const Color(0xFFFED7AA),
                  ),
                ),
                child: InkWell(
                  borderRadius: BorderRadius.circular(12),
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => MasterHisabPreviewPage(
                          previewId: batchId,
                        ),
                      ),
                    );
                  },
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Row(
                              children: [
                                const Icon(
                                  Icons.receipt_long,
                                  color: AppColors.adminPrimary,
                                  size: 20,
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  'Batch #$batchId',
                                  style: const TextStyle(
                                    fontSize: 15,
                                    fontWeight: FontWeight.w700,
                                    color: AppColors.textPrimary,
                                  ),
                                ),
                              ],
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 10,
                                vertical: 4,
                              ),
                              decoration: BoxDecoration(
                                color: isFullyPaid
                                    ? AppColors.successLight
                                    : AppColors.warningLight,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                isFullyPaid ? 'PAID' : 'PENDING PAYOUT',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                  color: isFullyPaid
                                      ? AppColors.success
                                      : AppColors.warning,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              '$weaverCount Artisans Settled',
                              style: const TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: AppColors.textSecondary,
                              ),
                            ),
                            Text(
                              Formatters.currency(grandTotal),
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                                color: AppColors.adminPrimary,
                              ),
                            ),
                          ],
                        ),
                        if (confirmedAt.isNotEmpty || cutoffDate.isNotEmpty) ...[
                          const SizedBox(height: 6),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              if (cutoffDate.isNotEmpty)
                                Text(
                                  'Cutoff: ${Formatters.date(cutoffDate)}',
                                  style: const TextStyle(
                                    fontSize: 12,
                                    color: AppColors.textMuted,
                                  ),
                                ),
                              if (confirmedAt.isNotEmpty)
                                Text(
                                  'Date: ${Formatters.date(confirmedAt)}',
                                  style: const TextStyle(
                                    fontSize: 12,
                                    color: AppColors.textMuted,
                                  ),
                                ),
                            ],
                          ),
                        ],
                        const Divider(height: 20),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'Method: $paymentMethod',
                              style: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w500,
                                color: AppColors.textMuted,
                              ),
                            ),
                            if (!isFullyPaid)
                              ElevatedButton.icon(
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppColors.success,
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 14,
                                    vertical: 8,
                                  ),
                                ),
                                icon: const Icon(
                                  Icons.payments_outlined,
                                  size: 16,
                                ),
                                label: const Text(
                                  'Disburse Payout',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                                onPressed: () => _showPayoutModal(batch),
                              )
                            else
                              const Row(
                                children: [
                                  Icon(
                                    Icons.check_circle,
                                    size: 16,
                                    color: AppColors.success,
                                  ),
                                  SizedBox(width: 4),
                                  Text(
                                    'Disbursed',
                                    style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w600,
                                      color: AppColors.success,
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
          );
        },
      ),
    );
  }
}
