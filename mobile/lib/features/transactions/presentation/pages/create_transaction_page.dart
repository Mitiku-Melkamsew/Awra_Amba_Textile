import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../products/domain/entities/product_entity.dart';
import '../../../products/presentation/blocs/stock_bloc.dart';
import '../../../products/presentation/blocs/stock_event.dart';
import '../../../products/presentation/blocs/stock_state.dart';
import '../../../weavers/domain/entities/weaver_entity.dart';
import '../../../weavers/presentation/blocs/weavers_bloc.dart';
import '../../../weavers/presentation/blocs/weavers_event.dart';
import '../../../weavers/presentation/blocs/weavers_state.dart';
import '../blocs/transactions_bloc.dart';
import '../blocs/transactions_event.dart';
import '../blocs/transactions_state.dart';

class CreateTransactionPage extends StatefulWidget {
  const CreateTransactionPage({super.key});

  @override
  State<CreateTransactionPage> createState() =>
      _CreateTransactionPageState();
}

class _CreateTransactionPageState extends State<CreateTransactionPage> {
  final _formKey = GlobalKey<FormState>();
  final _txnIdController = TextEditingController();
  final _notesController = TextEditingController();

  String _selectedType = 'yarn_purchase';
  String _paymentTerms = 'on_delivery';

  SupplierEntity? _selectedSupplier;
  WeaverEntity? _selectedWeaver;

  final List<Map<String, dynamic>> _lines = [];

  final List<Map<String, String>> _typeOptions = [
    {'value': 'yarn_purchase', 'label': 'Yarn Purchase (from Supplier)'},
    {'value': 'fabric_purchase', 'label': 'Fabric Purchase (from Weaver)'},
    {'value': 'yarn_sale', 'label': 'Yarn Sale (to Weaver)'},
    {'value': 'fabric_sale', 'label': 'Fabric Sale (to Merchant)'},
  ];

  @override
  void initState() {
    super.initState();
    context.read<StockBloc>().add(LoadStockAndCatalog());
    context.read<WeaversBloc>().add(const LoadWeavers());
    _fetchNextId();
  }

  Future<void> _fetchNextId() async {
    try {
      final nextId = await context
          .read<TransactionsBloc>()
          .transactionsRepository
          .getNextId();
      if (mounted) {
        _txnIdController.text = nextId;
      }
    } catch (_) {}
  }

  @override
  void dispose() {
    _txnIdController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  void _addLine() {
    final descCtrl = TextEditingController();
    final qtyCtrl = TextEditingController(text: '10');
    final priceCtrl = TextEditingController(text: '500');

    showDialog(
      context: context,
      builder: (ctx) {
        return AlertDialog(
          title: const Text('Add Transaction Line'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: descCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Item Description',
                    hintText: 'e.g. Cotton Yarn 20/1 or Standard Fabric',
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: qtyCtrl,
                  decoration: const InputDecoration(labelText: 'Quantity'),
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
                    _lines.add({
                      'description': descCtrl.text.isNotEmpty
                          ? descCtrl.text
                          : 'Goods item',
                      'quantity': qty,
                      'unitPrice': price,
                    });
                  });
                  Navigator.pop(ctx);
                }
              },
              child: const Text('Add Line'),
            ),
          ],
        );
      },
    );
  }

  void _submit() {
    if (_formKey.currentState?.validate() ?? false) {
      if (_lines.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Please add at least one line item')),
        );
        return;
      }

      int? supplierId;
      int? weaverId;

      if (_selectedType == 'yarn_purchase') {
        supplierId = _selectedSupplier?.supplierId;
      } else if (_selectedType == 'fabric_purchase' ||
          _selectedType == 'yarn_sale') {
        weaverId = _selectedWeaver?.weaverId;
      }

      context.read<TransactionsBloc>().add(
            CreateTransactionSubmitted(
              transactionId: _txnIdController.text.trim().isNotEmpty
                  ? _txnIdController.text.trim()
                  : null,
              type: _selectedType,
              paymentTerms: _paymentTerms,
              supplierId: supplierId,
              weaverId: weaverId,
              notes: _notesController.text.trim(),
              lines: _lines,
            ),
          );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('New Transaction'),
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.all(16),
        decoration: const BoxDecoration(
          color: Colors.white,
          border: Border(top: BorderSide(color: AppColors.border)),
        ),
        child: BlocConsumer<TransactionsBloc, TransactionsState>(
          listener: (context, state) {
            if (state.status == TransactionsStatus.actionSuccess) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(state.successMessage ?? 'Transaction created!'),
                  backgroundColor: AppColors.success,
                ),
              );
              Navigator.pop(context);
            } else if (state.status == TransactionsStatus.error &&
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
            final isLoading = state.status == TransactionsStatus.loading;
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
                  : const Text('Save & Submit Transaction'),
            );
          },
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Transaction Details',
                        style: TextStyle(
                            fontSize: 15, fontWeight: FontWeight.w700),
                      ),
                      const SizedBox(height: 14),
                      TextFormField(
                        controller: _txnIdController,
                        decoration: const InputDecoration(
                          labelText: 'Transaction # (optional)',
                          hintText: 'e.g. TXN-101',
                        ),
                      ),
                      const SizedBox(height: 14),
                      DropdownButtonFormField<String>(
                        initialValue: _selectedType,
                        decoration: const InputDecoration(labelText: 'Type'),
                        items: _typeOptions
                            .map((t) => DropdownMenuItem(
                                  value: t['value'],
                                  child: Text(t['label']!),
                                ))
                            .toList(),
                        onChanged: (val) {
                          if (val != null) setState(() => _selectedType = val);
                        },
                      ),
                      const SizedBox(height: 14),
                      DropdownButtonFormField<String>(
                        initialValue: _paymentTerms,
                        decoration:
                            const InputDecoration(labelText: 'Payment Terms'),
                        items: const [
                          DropdownMenuItem(
                              value: 'prepaid', child: Text('Prepaid')),
                          DropdownMenuItem(
                              value: 'on_delivery', child: Text('On Delivery')),
                          DropdownMenuItem(
                              value: 'installment', child: Text('Installment')),
                        ],
                        onChanged: (val) {
                          if (val != null) setState(() => _paymentTerms = val);
                        },
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              if (_selectedType == 'yarn_purchase')
                BlocBuilder<StockBloc, StockState>(
                  builder: (context, state) {
                    final suppliers = state.lookup?.suppliers ?? [];
                    return Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: DropdownButtonFormField<SupplierEntity>(
                          initialValue: _selectedSupplier,
                          decoration:
                              const InputDecoration(labelText: 'Supplier (አቅራቢ)'),
                          items: suppliers
                              .map((s) => DropdownMenuItem(
                                    value: s,
                                    child: Text(s.name),
                                  ))
                              .toList(),
                          onChanged: (val) =>
                              setState(() => _selectedSupplier = val),
                        ),
                      ),
                    );
                  },
                )
              else if (_selectedType == 'fabric_purchase' ||
                  _selectedType == 'yarn_sale')
                BlocBuilder<WeaversBloc, WeaversState>(
                  builder: (context, state) {
                    return Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: DropdownButtonFormField<WeaverEntity>(
                          initialValue: _selectedWeaver,
                          decoration:
                              const InputDecoration(labelText: 'Weaver (አሸጋይ)'),
                          items: state.weavers
                              .map((w) => DropdownMenuItem(
                                    value: w,
                                    child: Text(w.fullName),
                                  ))
                              .toList(),
                          onChanged: (val) =>
                              setState(() => _selectedWeaver = val),
                        ),
                      ),
                    );
                  },
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
                            'Lines (ዕቃዎች)',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          TextButton.icon(
                            icon: const Icon(Icons.add, size: 18),
                            label: const Text('Add Line'),
                            onPressed: _addLine,
                          ),
                        ],
                      ),
                      if (_lines.isEmpty)
                        const Padding(
                          padding: EdgeInsets.symmetric(vertical: 12),
                          child: Text(
                            'No items added yet. Tap "Add Line" above.',
                            style: TextStyle(
                                fontSize: 13, color: AppColors.textMuted),
                          ),
                        )
                      else
                        ListView.separated(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: _lines.length,
                          separatorBuilder: (_, _) => const Divider(height: 1),
                          itemBuilder: (context, index) {
                            final line = _lines[index];
                            final total = (line['quantity'] as double) *
                                (line['unitPrice'] as double);
                            return ListTile(
                              dense: true,
                              contentPadding: EdgeInsets.zero,
                              title: Text(line['description']),
                              subtitle: Text(
                                  '${line['quantity']} × ${line['unitPrice']} ETB'),
                              trailing: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text(
                                    '${total.round()} ETB',
                                    style: const TextStyle(
                                        fontWeight: FontWeight.w700),
                                  ),
                                  IconButton(
                                    icon: const Icon(Icons.delete_outline,
                                        size: 18, color: AppColors.danger),
                                    onPressed: () {
                                      setState(() {
                                        _lines.removeAt(index);
                                      });
                                    },
                                  ),
                                ],
                              ),
                            );
                          },
                        ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _notesController,
                decoration: const InputDecoration(
                  labelText: 'Notes (ማስታወሻ)',
                  hintText: 'Additional terms, receipt numbers, etc.',
                ),
                maxLines: 2,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
