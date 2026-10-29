import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../products/domain/entities/product_entity.dart';
import '../../../products/presentation/blocs/stock_bloc.dart';
import '../../../products/presentation/blocs/stock_event.dart';
import '../../../products/presentation/blocs/stock_state.dart';
import '../../../work_orders/presentation/blocs/work_orders_bloc.dart';
import '../../../work_orders/presentation/blocs/work_orders_event.dart';
import '../../../work_orders/presentation/blocs/work_orders_state.dart';

class IssueZigPage extends StatefulWidget {
  final int weaverId;
  final String weaverName;

  const IssueZigPage({
    super.key,
    required this.weaverId,
    required this.weaverName,
  });

  @override
  State<IssueZigPage> createState() => _IssueZigPageState();
}

class _IssueZigPageState extends State<IssueZigPage> {
  final _formKey = GlobalKey<FormState>();
  final _zigIdController = TextEditingController();
  final _unitPriceController = TextEditingController();

  ProductEntity? _selectedProduct;
  NamedColorEntity? _selectedWarpColor;
  NamedColorEntity? _selectedWeftColor;

  // Yarn Lines
  final List<Map<String, dynamic>> _yarnLines = [];

  @override
  void initState() {
    super.initState();
    context.read<StockBloc>().add(LoadStockAndCatalog());
    _fetchNextId();
  }

  Future<void> _fetchNextId() async {
    try {
      final nextId = await context
          .read<WorkOrdersBloc>()
          .workOrdersRepository
          .getNextZigId();
      if (mounted) {
        _zigIdController.text = nextId;
      }
    } catch (_) {}
  }

  @override
  void dispose() {
    _zigIdController.dispose();
    _unitPriceController.dispose();
    super.dispose();
  }

  void _addYarnLine(CatalogLookupEntity lookup) {
    if (lookup.yarnTypes.isEmpty || lookup.colors.isEmpty) return;

    showDialog(
      context: context,
      builder: (ctx) {
        final qtyCtrl = TextEditingController(text: '10');
        final priceCtrl = TextEditingController(text: '400');
        YarnTypeEntity selectedType = lookup.yarnTypes.first;
        NamedColorEntity selectedColor = lookup.colors.first;
        SupplierEntity? selectedSupplier =
            lookup.suppliers.isNotEmpty ? lookup.suppliers.first : null;

        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              title: const Text('Add Yarn to Work Order (ድር ጨምር)'),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    DropdownButtonFormField<YarnTypeEntity>(
                      initialValue: selectedType,
                      decoration: const InputDecoration(labelText: 'Yarn Material'),
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
                    DropdownButtonFormField<NamedColorEntity>(
                      initialValue: selectedColor,
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
                      setState(() {
                        _yarnLines.add({
                          'yarnTypeId': selectedType.yarnTypeId,
                          'colorId': selectedColor.colorId,
                          'supplierId': selectedSupplier?.supplierId,
                          'quantity': qty,
                          'unitPrice': price,
                          'label':
                              '${selectedType.materialName} (${selectedColor.name}) - ${qty}kg @ ${price}ETB',
                        });
                      });
                      Navigator.pop(ctx);
                    }
                  },
                  child: const Text('Add'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  void _submit() {
    if (_formKey.currentState?.validate() ?? false) {
      if (_selectedProduct == null ||
          _selectedWarpColor == null ||
          _selectedWeftColor == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Please select product and colors')),
        );
        return;
      }

      context.read<WorkOrdersBloc>().add(
            CreateWorkOrderSubmitted(
              weaverId: widget.weaverId,
              zigId: _zigIdController.text.trim(),
              productId: _selectedProduct!.productId,
              warpColorId: _selectedWarpColor!.colorId,
              weftColorId: _selectedWeftColor!.colorId,
              unitPrice: double.tryParse(_unitPriceController.text),
              yarnLines: _yarnLines,
            ),
          );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Issue Zig (ዚግ ስጥ)'),
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.all(16),
        decoration: const BoxDecoration(
          color: Colors.white,
          border: Border(top: BorderSide(color: AppColors.border)),
        ),
        child: BlocConsumer<WorkOrdersBloc, WorkOrdersState>(
          listener: (context, state) {
            if (state.status == WorkOrdersStatus.actionSuccess) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(state.successMessage ?? 'Zig created!'),
                  backgroundColor: AppColors.success,
                ),
              );
              Navigator.pop(context);
            } else if (state.status == WorkOrdersStatus.error &&
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
            final isLoading = state.status == WorkOrdersStatus.loading;
            return ElevatedButton(
              onPressed: isLoading ? null : _submit,
              child: isLoading
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                      ),
                    )
                  : const Text('Issue Zig & Assign Yarn'),
            );
          },
        ),
      ),
      body: BlocBuilder<StockBloc, StockState>(
        builder: (context, stockState) {
          final lookup = stockState.lookup;
          if (stockState.status == StockStatus.loading && lookup == null) {
            return const Center(child: CircularProgressIndicator());
          }

          if (lookup == null) {
            return const Center(
              child: Text('Unable to load fabric catalog.'),
            );
          }

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.adminPrimary.withValues(alpha: 0.06),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                          color: AppColors.adminPrimary.withValues(alpha: 0.2)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.person, color: AppColors.adminPrimary),
                        const SizedBox(width: 10),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              widget.weaverName,
                              style: const TextStyle(
                                  fontWeight: FontWeight.w700, fontSize: 14),
                            ),
                            Text(
                              'Weaver ID: ${widget.weaverId}',
                              style: const TextStyle(
                                  fontSize: 12, color: AppColors.textMuted),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Work Order Details',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(height: 14),
                          TextFormField(
                            controller: _zigIdController,
                            decoration: const InputDecoration(
                              labelText: 'Zig ID (ዚግ ቁጥር) *',
                              hintText: 'e.g. 101 or z-101',
                            ),
                            validator: (val) =>
                                val == null || val.trim().isEmpty
                                    ? 'Required'
                                    : null,
                          ),
                          const SizedBox(height: 14),
                          DropdownButtonFormField<ProductEntity>(
                            initialValue: _selectedProduct,
                            decoration: const InputDecoration(
                              labelText: 'Fabric Product (የጨርቅ ዓይነት) *',
                            ),
                            items: lookup.products
                                .map((p) => DropdownMenuItem(
                                      value: p,
                                      child: Text(
                                          '${p.name} (${p.basePrice.round()} ETB)'),
                                    ))
                                .toList(),
                            onChanged: (val) {
                              setState(() {
                                _selectedProduct = val;
                                if (val != null) {
                                  _unitPriceController.text =
                                      val.basePrice.round().toString();
                                }
                              });
                            },
                          ),
                          const SizedBox(height: 14),
                          Row(
                            children: [
                              Expanded(
                                child: DropdownButtonFormField<NamedColorEntity>(
                                  initialValue: _selectedWarpColor,
                                  decoration: const InputDecoration(
                                    labelText: 'Warp (የድር ቀለም) *',
                                  ),
                                  items: lookup.colors
                                      .map((c) => DropdownMenuItem(
                                            value: c,
                                            child: Text(c.name),
                                          ))
                                      .toList(),
                                  onChanged: (val) =>
                                      setState(() => _selectedWarpColor = val),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: DropdownButtonFormField<NamedColorEntity>(
                                  initialValue: _selectedWeftColor,
                                  decoration: const InputDecoration(
                                    labelText: 'Weft (የማግ ቀለም) *',
                                  ),
                                  items: lookup.colors
                                      .map((c) => DropdownMenuItem(
                                            value: c,
                                            child: Text(c.name),
                                          ))
                                      .toList(),
                                  onChanged: (val) =>
                                      setState(() => _selectedWeftColor = val),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 14),
                          TextFormField(
                            controller: _unitPriceController,
                            decoration: const InputDecoration(
                              labelText: 'Piece Base Price (የአንዱ ዋጋ ETB)',
                            ),
                            keyboardType: TextInputType.number,
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text(
                                'Initial Yarn Given (የተሰጠ ድር)',
                                style: TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              TextButton.icon(
                                icon: const Icon(Icons.add, size: 18),
                                label: const Text('Add Yarn'),
                                onPressed: () => _addYarnLine(lookup),
                              ),
                            ],
                          ),
                          if (_yarnLines.isEmpty)
                            const Padding(
                              padding: EdgeInsets.symmetric(vertical: 12),
                              child: Text(
                                'No yarn added yet. Tap "Add Yarn" to record initial deliveries.',
                                style: TextStyle(
                                  fontSize: 12.5,
                                  color: AppColors.textMuted,
                                ),
                              ),
                            )
                          else
                            ListView.separated(
                              shrinkWrap: true,
                              physics: const NeverScrollableScrollPhysics(),
                              itemCount: _yarnLines.length,
                              separatorBuilder: (_, _) =>
                                  const Divider(height: 1),
                              itemBuilder: (context, index) {
                                final line = _yarnLines[index];
                                return ListTile(
                                  dense: true,
                                  contentPadding: EdgeInsets.zero,
                                  leading: const Icon(Icons.grain,
                                      size: 20, color: AppColors.adminPrimary),
                                  title: Text(line['label'],
                                      style: const TextStyle(fontSize: 13)),
                                  trailing: IconButton(
                                    icon: const Icon(Icons.delete_outline,
                                        size: 18, color: AppColors.danger),
                                    onPressed: () {
                                      setState(() {
                                        _yarnLines.removeAt(index);
                                      });
                                    },
                                  ),
                                );
                              },
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
  }
}
