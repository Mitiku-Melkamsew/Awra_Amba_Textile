import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../blocs/stock/stock_bloc.dart';
import '../../../blocs/stock/stock_event.dart';
import '../../../blocs/stock/stock_state.dart';
import '../../../blocs/work_orders/work_orders_bloc.dart';
import '../../../blocs/work_orders/work_orders_event.dart';
import '../../../blocs/work_orders/work_orders_state.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../models/stock_item.dart';
import '../../widgets/custom_widgets.dart';

class ZigDetailScreen extends StatefulWidget {
  final String zigId;

  const ZigDetailScreen({super.key, required this.zigId});

  @override
  State<ZigDetailScreen> createState() => _ZigDetailScreenState();
}

class _ZigDetailScreenState extends State<ZigDetailScreen> {
  @override
  void initState() {
    super.initState();
    context.read<WorkOrdersBloc>().add(LoadWorkOrderDetail(widget.zigId));
    context.read<StockBloc>().add(LoadStockAndCatalog());
  }

  void _showAddYarnDialog(CatalogLookup lookup) {
    if (lookup.yarnTypes.isEmpty || lookup.colors.isEmpty) return;

    final qtyCtrl = TextEditingController(text: '10');
    final priceCtrl = TextEditingController(text: '400');
    YarnType selectedType = lookup.yarnTypes.first;
    NamedColor selectedColor = lookup.colors.first;
    Supplier? selectedSupplier =
        lookup.suppliers.isNotEmpty ? lookup.suppliers.first : null;

    showDialog(
      context: context,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              title: Text('Add Yarn to Zig #${widget.zigId}'),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    DropdownButtonFormField<YarnType>(
                      value: selectedType,
                      decoration: const InputDecoration(labelText: 'Material'),
                      items: lookup.yarnTypes
                          .map((yt) => DropdownMenuItem(
                                value: yt,
                                child: Text(yt.materialName),
                              ))
                          .toList(),
                      onChanged: (val) {
                        if (val != null) setDialogState(() => selectedType = val);
                      },
                    ),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<NamedColor>(
                      value: selectedColor,
                      decoration: const InputDecoration(labelText: 'Color'),
                      items: lookup.colors
                          .map((c) => DropdownMenuItem(
                                value: c,
                                child: Text(c.name),
                              ))
                          .toList(),
                      onChanged: (val) {
                        if (val != null) setDialogState(() => selectedColor = val);
                      },
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: qtyCtrl,
                      decoration: const InputDecoration(labelText: 'Quantity (Kg)'),
                      keyboardType: TextInputType.number,
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: priceCtrl,
                      decoration: const InputDecoration(labelText: 'Unit Price (ETB)'),
                      keyboardType: TextInputType.number,
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
                    final qty = double.tryParse(qtyCtrl.text) ?? 0.0;
                    final price = double.tryParse(priceCtrl.text) ?? 0.0;
                    if (qty > 0 && price > 0) {
                      context.read<WorkOrdersBloc>().add(
                            AddYarnGivenSubmitted(
                              zigId: widget.zigId,
                              lines: [
                                {
                                  'yarnTypeId': selectedType.yarnTypeId,
                                  'colorId': selectedColor.colorId,
                                  'supplierId': selectedSupplier?.supplierId,
                                  'quantity': qty,
                                  'unitPrice': price,
                                }
                              ],
                            ),
                          );
                      Navigator.pop(ctx);
                    }
                  },
                  child: const Text('Record Yarn'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  void _showAddReturnDialog() {
    final qtyCtrl = TextEditingController(text: '30');
    final weightCtrl = TextEditingController(text: '2400'); // total weight in grams
    final priceCtrl = TextEditingController(text: '1707');
    final remarkCtrl = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) {
        return AlertDialog(
          title: Text('Receive Fabric for Zig #${widget.zigId}'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: qtyCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Quantity Returned (Pieces / ቁራጭ)',
                  ),
                  keyboardType: TextInputType.number,
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: weightCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Total Weight in Grams (ጠቅላላ ክብደት)',
                    hintText: 'e.g. 2400 for 30 pcs (~80g/pc)',
                  ),
                  keyboardType: TextInputType.number,
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: priceCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Piece Base Price (ETB)',
                  ),
                  keyboardType: TextInputType.number,
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: remarkCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Remark (optional)',
                  ),
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
                final qty = int.tryParse(qtyCtrl.text) ?? 0;
                final weight = double.tryParse(weightCtrl.text) ?? 0.0;
                final price = double.tryParse(priceCtrl.text) ?? 0.0;
                if (qty > 0 && weight > 0 && price > 0) {
                  context.read<WorkOrdersBloc>().add(
                        AddFabricReturnSubmitted(
                          zigId: widget.zigId,
                          quantityReturned: qty,
                          totalWeight: weight,
                          unitPrice: price,
                          remark: remarkCtrl.text.isNotEmpty
                              ? remarkCtrl.text
                              : null,
                        ),
                      );
                  Navigator.pop(ctx);
                }
              },
              child: const Text('Record Return'),
            ),
          ],
        );
      },
    );
  }

  void _showChangeStatusDialog(String currentStatus) {
    const statuses = ['assigned', 'in_progress', 'returned', 'reconciled'];

    showDialog(
      context: context,
      builder: (ctx) {
        return SimpleDialog(
          title: const Text('Update Work Order Status'),
          children: statuses.map((s) {
            return SimpleDialogOption(
              onPressed: () {
                context.read<WorkOrdersBloc>().add(
                      UpdateWorkOrderStatusSubmitted(
                        zigId: widget.zigId,
                        status: s,
                      ),
                    );
                Navigator.pop(ctx);
              },
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 6),
                child: Row(
                  children: [
                    StatusBadge(status: s),
                    const SizedBox(width: 12),
                    Text(
                      s.replaceAll('_', ' ').toUpperCase(),
                      style: TextStyle(
                        fontWeight:
                            s == currentStatus ? FontWeight.w700 : FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
            );
          }).toList(),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Zig #${widget.zigId}'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              context
                  .read<WorkOrdersBloc>()
                  .add(LoadWorkOrderDetail(widget.zigId));
            },
          ),
        ],
      ),
      body: BlocConsumer<WorkOrdersBloc, WorkOrdersState>(
        listener: (context, state) {
          if (state.status == WorkOrdersStatus.actionSuccess &&
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
          final detail = state.selectedDetail;
          if (state.status == WorkOrdersStatus.loading && detail == null) {
            return const Center(child: CircularProgressIndicator());
          }

          if (detail == null) {
            return const Center(child: Text('Work order not found.'));
          }

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header Card
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
                              'Work Order #${detail.zigId}',
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w700,
                                color: AppColors.textPrimary,
                              ),
                            ),
                            InkWell(
                              onTap: () =>
                                  _showChangeStatusDialog(detail.status),
                              borderRadius: BorderRadius.circular(6),
                              child: Row(
                                children: [
                                  StatusBadge(status: detail.status),
                                  const SizedBox(width: 4),
                                  const Icon(Icons.edit,
                                      size: 14, color: AppColors.textMuted),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          detail.fabricVariant?.displayName ?? 'Fabric Product',
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: AppColors.textSecondary,
                          ),
                        ),
                        const Divider(height: 20),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'Weaver: ${detail.weaver?.fullName ?? "ID #${detail.weaverId}"}',
                              style: const TextStyle(
                                  fontSize: 13, fontWeight: FontWeight.w500),
                            ),
                            Text(
                              'Date: ${Formatters.date(detail.dateIssued)}',
                              style: const TextStyle(
                                  fontSize: 12.5, color: AppColors.textMuted),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 16),

                // Financial Overview Grid
                Row(
                  children: [
                    Expanded(
                      child: StatCard(
                        title: 'Fabric Credit',
                        value: Formatters.currency(detail.totalFabricCredit),
                        subtitle: '${detail.totalFabricQuantity} pieces returned',
                        icon: Icons.check_circle_outline,
                        color: AppColors.success,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: StatCard(
                        title: 'Yarn Cost (ድር)',
                        value: Formatters.currency(detail.totalYarnCost),
                        subtitle: '${detail.totalYarnQuantity} kg assigned',
                        icon: Icons.grain,
                        color: AppColors.danger,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                StatCard(
                  title: 'Net Profit (የዚግ ትርፍ)',
                  value: Formatters.currency(detail.netProfit),
                  subtitle: 'Fabric Credit - Yarn Cost',
                  icon: Icons.account_balance_wallet_outlined,
                  color: AppColors.adminPrimary,
                ),

                const SizedBox(height: 20),

                // Action buttons row
                BlocBuilder<StockBloc, StockState>(
                  builder: (context, stockState) {
                    final lookup = stockState.lookup;
                    return Row(
                      children: [
                        Expanded(
                          child: ElevatedButton.icon(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.adminPrimary,
                            ),
                            icon: const Icon(Icons.add, size: 18),
                            label: const Text('Add Yarn'),
                            onPressed: lookup != null
                                ? () => _showAddYarnDialog(lookup)
                                : null,
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: ElevatedButton.icon(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.success,
                            ),
                            icon: const Icon(Icons.download, size: 18),
                            label: const Text('Receive Fabric'),
                            onPressed: _showAddReturnDialog,
                          ),
                        ),
                      ],
                    );
                  },
                ),

                const SizedBox(height: 20),

                // Fabric Returns List
                SectionHeader(
                  title: 'Fabric Returns (የተመለሰ ጨርቅ)',
                  count: detail.fabricReturns.length,
                ),
                if (detail.fabricReturns.isEmpty)
                  const Card(
                    child: Padding(
                      padding: EdgeInsets.all(16),
                      child: Center(
                        child: Text(
                          'No fabric returns recorded yet.',
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
                    itemCount: detail.fabricReturns.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (context, index) {
                      final item = detail.fabricReturns[index];
                      return Card(
                        child: Padding(
                          padding: const EdgeInsets.all(14),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    '${item.quantityReturned} pieces · ${Formatters.date(item.dateReturned)}',
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w700,
                                      fontSize: 14,
                                    ),
                                  ),
                                  Text(
                                    Formatters.currency(item.lineTotal),
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w700,
                                      fontSize: 14,
                                      color: AppColors.success,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 6),
                              Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    'Avg Weight: ${item.avgWeight.floor()}g/pc',
                                    style: const TextStyle(
                                      fontSize: 12.5,
                                      color: AppColors.textSecondary,
                                    ),
                                  ),
                                  if ((item.calculatedDeduction ?? 0) > 0)
                                    Text(
                                      'Deduction: -${item.calculatedDeduction!.round()} ETB/pc',
                                      style: const TextStyle(
                                        fontSize: 12.5,
                                        color: AppColors.danger,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    )
                                  else
                                    const Text(
                                      'No Quality Deduction',
                                      style: TextStyle(
                                        fontSize: 12,
                                        color: AppColors.success,
                                      ),
                                    ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),

                const SizedBox(height: 20),

                // Yarn Given List
                SectionHeader(
                  title: 'Yarn Deliveries (የተሰጠ ድር)',
                  count: detail.yarnGiven.length,
                ),
                if (detail.yarnGiven.isEmpty)
                  const Card(
                    child: Padding(
                      padding: EdgeInsets.all(16),
                      child: Center(
                        child: Text(
                          'No yarn deliveries recorded.',
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
                    itemCount: detail.yarnGiven.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (context, index) {
                      final item = detail.yarnGiven[index];
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
                                    '${item.yarnMaterial} (${item.yarnColor})',
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w600,
                                      fontSize: 13.5,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    '${item.quantity} kg @ ${item.unitPrice.round()} ETB/kg',
                                    style: const TextStyle(
                                      fontSize: 12,
                                      color: AppColors.textSecondary,
                                    ),
                                  ),
                                ],
                              ),
                              Text(
                                Formatters.currency(item.totalCost),
                                style: const TextStyle(
                                  fontWeight: FontWeight.w700,
                                  fontSize: 14,
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
