import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/utils/formatters.dart';
import '../../../products/domain/entities/product_entity.dart';
import '../../../products/presentation/blocs/stock_bloc.dart';
import '../blocs/procurement_bloc.dart';
import '../blocs/procurement_event.dart';
import '../blocs/procurement_state.dart';

class ProcurementPage extends StatefulWidget {
  const ProcurementPage({super.key});

  @override
  State<ProcurementPage> createState() => _ProcurementPageState();
}

class _ProcurementPageState extends State<ProcurementPage> {
  @override
  void initState() {
    super.initState();
    context.read<ProcurementBloc>().add(LoadProcurements());
  }

  void _showAddProcurementDialog() {
    final stockState = context.read<StockBloc>().state;
    final lookup = stockState.lookup;
    final yarnVariants = stockState.yarnVariants;

    if (lookup == null || lookup.suppliers.isEmpty || yarnVariants.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please wait for catalog and suppliers to load.'),
        ),
      );
      return;
    }

    SupplierEntity selectedSupplier = lookup.suppliers.first;
    YarnVariantEntity selectedYarn = yarnVariants.first;
    final qtyCtrl = TextEditingController(text: '50');
    final priceCtrl = TextEditingController(text: '350');
    final notesCtrl = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (dCtx, setDialogState) => AlertDialog(
          title: const Text('Record Yarn Purchase / የድር ግዢ'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                DropdownButtonFormField<SupplierEntity>(
                  initialValue: selectedSupplier,
                  decoration: const InputDecoration(
                    labelText: 'Supplier (አቅራቢ)',
                  ),
                  items: lookup.suppliers
                      .map(
                        (s) => DropdownMenuItem(value: s, child: Text(s.name)),
                      )
                      .toList(),
                  onChanged: (val) {
                    if (val != null) {
                      setDialogState(() => selectedSupplier = val);
                    }
                  },
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<YarnVariantEntity>(
                  initialValue: selectedYarn,
                  decoration: const InputDecoration(
                    labelText: 'Yarn Material / ድር አይነት',
                  ),
                  items: yarnVariants
                      .map(
                        (y) => DropdownMenuItem(
                          value: y,
                          child: Text('${y.displayName} · ${y.sku}'),
                        ),
                      )
                      .toList(),
                  onChanged: (val) {
                    if (val != null) setDialogState(() => selectedYarn = val);
                  },
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: qtyCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Quantity (pieces)',
                  ),
                  keyboardType: TextInputType.number,
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: priceCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Unit Cost (ETB/piece)',
                  ),
                  keyboardType: TextInputType.number,
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: notesCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Notes / Invoice Ref',
                  ),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dCtx),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () {
                final qty = int.tryParse(qtyCtrl.text) ?? 0;
                final price = double.tryParse(priceCtrl.text) ?? 0.0;
                if (qty <= 0 || price <= 0) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Please enter valid quantity and price'),
                    ),
                  );
                  return;
                }
                context.read<ProcurementBloc>().add(
                  CreateProcurementSubmitted(
                    supplierId: selectedSupplier.supplierId,
                    notes: notesCtrl.text.isNotEmpty ? notesCtrl.text : null,
                    lines: [
                      {
                        'yarnVariantId': selectedYarn.yarnVariantId,
                        'quantity': qty,
                        'unitPrice': price,
                      },
                    ],
                  ),
                );
                Navigator.pop(dCtx);
              },
              child: const Text('Save Purchase'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Yarn Procurement / የክር ግዢ'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () =>
                context.read<ProcurementBloc>().add(LoadProcurements()),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: AppColors.adminPrimary,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add_shopping_cart),
        label: const Text('New Purchase'),
        onPressed: _showAddProcurementDialog,
      ),
      body: BlocConsumer<ProcurementBloc, ProcurementState>(
        listener: (context, state) {
          if (state.status == ProcurementStatus.actionSuccess &&
              state.successMessage != null) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.successMessage!),
                backgroundColor: AppColors.success,
              ),
            );
          }
          if (state.status == ProcurementStatus.error &&
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
          if (state.status == ProcurementStatus.loading &&
              state.procurements.isEmpty) {
            return const Center(child: CircularProgressIndicator());
          }

          if (state.procurements.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(
                    Icons.inventory_2_outlined,
                    size: 64,
                    color: AppColors.textMuted,
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'No yarn procurements recorded yet.',
                    style: TextStyle(
                      fontSize: 16,
                      color: AppColors.textSecondary,
                    ),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton.icon(
                    icon: const Icon(Icons.add),
                    label: const Text('Record First Purchase'),
                    onPressed: _showAddProcurementDialog,
                  ),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () async {
              context.read<ProcurementBloc>().add(LoadProcurements());
            },
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: state.procurements.length,
              separatorBuilder: (_, _) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final p = state.procurements[index];
                return Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              p.supplierName.isNotEmpty
                                  ? p.supplierName
                                  : 'Supplier #${p.supplierId}',
                              style: const TextStyle(
                                fontWeight: FontWeight.w700,
                                fontSize: 15,
                              ),
                            ),
                            Text(
                              Formatters.currency(p.totalCost),
                              style: const TextStyle(
                                fontWeight: FontWeight.w700,
                                fontSize: 15,
                                color: AppColors.adminPrimary,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Text(
                          'Purchase #${p.procurementId} · ${Formatters.date(p.purchaseDate)}',
                          style: const TextStyle(
                            fontSize: 12.5,
                            color: AppColors.textSecondary,
                          ),
                        ),
                        if (p.notes != null && p.notes!.isNotEmpty) ...[
                          const SizedBox(height: 6),
                          Text(
                            p.notes!,
                            style: const TextStyle(
                              fontSize: 12,
                              color: AppColors.textMuted,
                            ),
                          ),
                        ],
                        const Divider(height: 20),
                        const Text(
                          'Delivered Yarn Lines:',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 4),
                        ...p.lines.map(
                          (l) => Padding(
                            padding: const EdgeInsets.symmetric(vertical: 2),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  '${l.yarnName} (${l.quantity} pieces @ ${l.unitPrice.round()} ETB/piece)',
                                  style: const TextStyle(fontSize: 12.5),
                                ),
                                Text(
                                  Formatters.currency(l.lineTotal),
                                  style: const TextStyle(
                                    fontSize: 12.5,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }
}
