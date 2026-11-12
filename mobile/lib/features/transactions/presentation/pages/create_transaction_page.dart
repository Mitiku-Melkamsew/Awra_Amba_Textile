import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/utils/formatters.dart';
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
  State<CreateTransactionPage> createState() => _CreateTransactionPageState();
}

class _CreateTransactionPageState extends State<CreateTransactionPage> {
  final _formKey = GlobalKey<FormState>();
  final _txnIdController = TextEditingController();
  final _notesController = TextEditingController();
  final _merchantNameController = TextEditingController();

  String _selectedType = 'fabric_sale';
  String _paymentTerms = 'on_delivery';

  SupplierEntity? _selectedSupplier;
  WeaverEntity? _selectedWeaver;

  final List<Map<String, dynamic>> _lines = [];

  final List<Map<String, String>> _typeOptions = [
    {'value': 'fabric_sale', 'label': 'Fabric Sale (to Merchant / ደንበኛ)'},
    {'value': 'yarn_sale', 'label': 'Yarn Sale (to Weaver / አሸጋይ)'},
    {'value': 'fabric_purchase', 'label': 'Fabric Purchase (from Weaver / አሸጋይ)'},
    {'value': 'yarn_purchase', 'label': 'Yarn Purchase (from Supplier / አቅራቢ)'},
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
      if (mounted && nextId.isNotEmpty) {
        _txnIdController.text = nextId;
      }
    } catch (_) {}
  }

  @override
  void dispose() {
    _txnIdController.dispose();
    _notesController.dispose();
    _merchantNameController.dispose();
    super.dispose();
  }

  bool get _isSale =>
      _selectedType == 'fabric_sale' || _selectedType == 'yarn_sale';
  bool get _isFabric =>
      _selectedType == 'fabric_sale' || _selectedType == 'fabric_purchase';

  void _showAddLineDialog(StockState stockState) {
    final lookup = stockState.lookup;
    final fabricVariants = stockState.fabricVariants;
    final yarnVariants = stockState.yarnVariants;

    if (_isFabric) {
      if (_selectedType == 'fabric_sale') {
        // Only show variants with stock or available
        final inStockVariants = fabricVariants.where((v) => v.stockSnapshot > 0).toList();
        final availableList = inStockVariants.isNotEmpty ? inStockVariants : fabricVariants;
        if (availableList.isEmpty) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('No fabric variants found in catalog.')),
          );
          return;
        }

        FabricVariantEntity selectedVar = availableList.first;
        final qtyCtrl = TextEditingController(text: '1');
        final priceCtrl = TextEditingController(
          text: (selectedVar.basePrice ?? selectedVar.product?.basePrice ?? 0)
              .toString(),
        );

        showDialog(
          context: context,
          builder: (dialogCtx) {
            return StatefulBuilder(
              builder: (ctx, setDialogState) {
                final qty = double.tryParse(qtyCtrl.text) ?? 0.0;
                final stock = selectedVar.stockSnapshot;
                final hasShortage = qty > stock;
                final stockAfter = (stock - qty).round();

                return AlertDialog(
                  title: const Text('Add Fabric for Sale (የሚሸጥ ጨርቅ)'),
                  content: SingleChildScrollView(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        DropdownButtonFormField<FabricVariantEntity>(
                          initialValue: selectedVar,
                          decoration: const InputDecoration(labelText: 'Fabric Variant'),
                          items: availableList.map((v) {
                            return DropdownMenuItem(
                              value: v,
                              child: Text(
                                '${v.displayName} (Stock: ${v.stockSnapshot.round()})',
                                overflow: TextOverflow.ellipsis,
                              ),
                            );
                          }).toList(),
                          onChanged: (val) {
                            if (val != null) {
                              setDialogState(() {
                                selectedVar = val;
                                priceCtrl.text = (val.basePrice ?? val.product?.basePrice ?? 0).toString();
                              });
                            }
                          },
                        ),
                        const SizedBox(height: 12),
                        TextField(
                          controller: qtyCtrl,
                          decoration: const InputDecoration(labelText: 'Quantity (pieces)'),
                          keyboardType: TextInputType.number,
                          onChanged: (_) => setDialogState(() {}),
                        ),
                        const SizedBox(height: 12),
                        TextField(
                          controller: priceCtrl,
                          decoration: const InputDecoration(labelText: 'Unit Selling Price (ETB)'),
                          keyboardType: TextInputType.number,
                        ),
                        const SizedBox(height: 12),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                          decoration: BoxDecoration(
                            color: hasShortage ? const Color(0xFFFEF2F2) : const Color(0xFFF0FDF4),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(
                              color: hasShortage ? const Color(0xFFFCA5A5) : const Color(0xFFBBF7D0),
                            ),
                          ),
                          child: Text(
                            hasShortage
                                ? 'Shortage: Only ${stock.round()} in stock!'
                                : 'Stock after: $stockAfter pcs',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: hasShortage ? AppColors.danger : AppColors.success,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.pop(dialogCtx),
                      child: const Text('Cancel'),
                    ),
                    ElevatedButton(
                      onPressed: () {
                        final q = double.tryParse(qtyCtrl.text) ?? 0.0;
                        final p = double.tryParse(priceCtrl.text) ?? 0.0;
                        if (q <= 0 || p <= 0) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Enter valid quantity and price.')),
                          );
                          return;
                        }
                        setState(() {
                          _lines.add({
                            'fabricVariantId': selectedVar.fabricVariantId,
                            'description': selectedVar.displayName,
                            'quantity': q,
                            'unitPrice': p,
                            'stockSnapshot': selectedVar.stockSnapshot,
                          });
                        });
                        Navigator.pop(dialogCtx);
                      },
                      child: const Text('Add Line'),
                    ),
                  ],
                );
              },
            );
          },
        );
      } else {
        // Fabric purchase from weaver
        final products = lookup?.products.where((p) => p.category == 'fabric').toList() ?? [];
        final qtyCtrl = TextEditingController(text: '10');
        final priceCtrl = TextEditingController(text: '120');
        ProductEntity? selectedProduct = products.isNotEmpty ? products.first : null;

        showDialog(
          context: context,
          builder: (dialogCtx) => AlertDialog(
            title: const Text('Purchase Fabric (ጨርቅ ግዢ)'),
            content: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (products.isNotEmpty)
                    DropdownButtonFormField<ProductEntity>(
                      initialValue: selectedProduct,
                      decoration: const InputDecoration(labelText: 'Product Type'),
                      items: products
                          .map((p) => DropdownMenuItem(value: p, child: Text(p.name)))
                          .toList(),
                      onChanged: (val) {
                        if (val != null) {
                          selectedProduct = val;
                          priceCtrl.text = val.basePrice.toString();
                        }
                      },
                    ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: qtyCtrl,
                    decoration: const InputDecoration(labelText: 'Quantity (pieces)'),
                    keyboardType: TextInputType.number,
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: priceCtrl,
                    decoration: const InputDecoration(labelText: 'Unit Purchase Price (ETB)'),
                    keyboardType: TextInputType.number,
                  ),
                ],
              ),
            ),
            actions: [
              TextButton(onPressed: () => Navigator.pop(dialogCtx), child: const Text('Cancel')),
              ElevatedButton(
                onPressed: () {
                  final q = double.tryParse(qtyCtrl.text) ?? 0.0;
                  final p = double.tryParse(priceCtrl.text) ?? 0.0;
                  if (q <= 0 || p <= 0) return;
                  setState(() {
                    _lines.add({
                      'fabricId': selectedProduct?.productId,
                      'description': selectedProduct?.name ?? 'Fabric purchase',
                      'quantity': q,
                      'unitPrice': p,
                    });
                  });
                  Navigator.pop(dialogCtx);
                },
                child: const Text('Add Line'),
              ),
            ],
          ),
        );
      }
    } else {
      // Yarn
      if (_selectedType == 'yarn_sale') {
        final inStockYarns = yarnVariants.where((v) => v.stockSnapshot > 0).toList();
        final availableList = inStockYarns.isNotEmpty ? inStockYarns : yarnVariants;
        if (availableList.isEmpty) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('No yarn variants found.')),
          );
          return;
        }

        YarnVariantEntity selectedVar = availableList.first;
        final qtyCtrl = TextEditingController(text: '1');
        final priceCtrl = TextEditingController(text: selectedVar.basePrice.toString());

        showDialog(
          context: context,
          builder: (dialogCtx) => StatefulBuilder(
            builder: (ctx, setDialogState) {
              final qty = double.tryParse(qtyCtrl.text) ?? 0.0;
              final stock = selectedVar.stockSnapshot;
              final hasShortage = qty > stock;
              final stockAfter = (stock - qty).round();

              return AlertDialog(
                title: const Text('Add Yarn for Sale (የሚሸጥ ክር)'),
                content: SingleChildScrollView(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      DropdownButtonFormField<YarnVariantEntity>(
                        initialValue: selectedVar,
                        decoration: const InputDecoration(labelText: 'Yarn Variant'),
                        items: availableList.map((v) {
                          return DropdownMenuItem(
                            value: v,
                            child: Text(
                              '${v.displayName} (Stock: ${v.stockSnapshot.round()})',
                              overflow: TextOverflow.ellipsis,
                            ),
                          );
                        }).toList(),
                        onChanged: (val) {
                          if (val != null) {
                            setDialogState(() {
                              selectedVar = val;
                              priceCtrl.text = val.basePrice.toString();
                            });
                          }
                        },
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: qtyCtrl,
                        decoration: const InputDecoration(labelText: 'Quantity (pieces)'),
                        keyboardType: TextInputType.number,
                        onChanged: (_) => setDialogState(() {}),
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: priceCtrl,
                        decoration: const InputDecoration(labelText: 'Unit Price (ETB)'),
                        keyboardType: TextInputType.number,
                      ),
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(
                          color: hasShortage ? const Color(0xFFFEF2F2) : const Color(0xFFF0FDF4),
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(
                            color: hasShortage ? const Color(0xFFFCA5A5) : const Color(0xFFBBF7D0),
                          ),
                        ),
                        child: Text(
                          hasShortage
                              ? 'Shortage: Only ${stock.round()} in stock!'
                              : 'Stock after: $stockAfter pcs',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: hasShortage ? AppColors.danger : AppColors.success,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                actions: [
                  TextButton(onPressed: () => Navigator.pop(dialogCtx), child: const Text('Cancel')),
                  ElevatedButton(
                    onPressed: () {
                      final q = double.tryParse(qtyCtrl.text) ?? 0.0;
                      final p = double.tryParse(priceCtrl.text) ?? 0.0;
                      if (q <= 0 || p <= 0) return;
                      setState(() {
                        _lines.add({
                          'yarnVariantId': selectedVar.yarnVariantId,
                          'description': selectedVar.displayName,
                          'quantity': q,
                          'unitPrice': p,
                          'stockSnapshot': selectedVar.stockSnapshot,
                        });
                      });
                      Navigator.pop(dialogCtx);
                    },
                    child: const Text('Add Line'),
                  ),
                ],
              );
            },
          ),
        );
      } else {
        // Yarn purchase from supplier
        final yarnTypes = lookup?.yarnTypes ?? [];
        final colors = lookup?.colors ?? [];
        final qtyCtrl = TextEditingController(text: '20');
        final priceCtrl = TextEditingController(text: '350');
        YarnTypeEntity? selectedType = yarnTypes.isNotEmpty ? yarnTypes.first : null;
        NamedColorEntity? selectedColor = colors.isNotEmpty ? colors.first : null;

        showDialog(
          context: context,
          builder: (dialogCtx) => StatefulBuilder(
            builder: (ctx, setDialogState) => AlertDialog(
              title: const Text('Purchase Yarn (ክር ግዢ)'),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (yarnTypes.isNotEmpty)
                      DropdownButtonFormField<YarnTypeEntity>(
                        initialValue: selectedType,
                        decoration: const InputDecoration(labelText: 'Material'),
                        items: yarnTypes
                            .map((yt) => DropdownMenuItem(value: yt, child: Text(yt.materialName)))
                            .toList(),
                        onChanged: (val) => setDialogState(() => selectedType = val),
                      ),
                    const SizedBox(height: 12),
                    if (colors.isNotEmpty)
                      DropdownButtonFormField<NamedColorEntity>(
                        initialValue: selectedColor,
                        decoration: const InputDecoration(labelText: 'Color'),
                        items: colors
                            .map((c) => DropdownMenuItem(value: c, child: Text(c.name)))
                            .toList(),
                        onChanged: (val) => setDialogState(() => selectedColor = val),
                      ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: qtyCtrl,
                      decoration: const InputDecoration(labelText: 'Quantity (pieces)'),
                      keyboardType: TextInputType.number,
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: priceCtrl,
                      decoration: const InputDecoration(labelText: 'Unit Purchase Price (ETB)'),
                      keyboardType: TextInputType.number,
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(onPressed: () => Navigator.pop(dialogCtx), child: const Text('Cancel')),
                ElevatedButton(
                  onPressed: () {
                    final q = double.tryParse(qtyCtrl.text) ?? 0.0;
                    final p = double.tryParse(priceCtrl.text) ?? 0.0;
                    if (q <= 0 || p <= 0) return;
                    setState(() {
                      _lines.add({
                        'yarnTypeId': selectedType?.yarnTypeId,
                        'colorId': selectedColor?.colorId,
                        'description':
                            '${selectedType?.materialName ?? "Yarn"} · ${selectedColor?.name ?? ""}',
                        'quantity': q,
                        'unitPrice': p,
                      });
                    });
                    Navigator.pop(dialogCtx);
                  },
                  child: const Text('Add Line'),
                ),
              ],
            ),
          ),
        );
      }
    }
  }

  bool get _hasAnyShortage {
    if (!_isSale) return false;
    for (final line in _lines) {
      final stock = (line['stockSnapshot'] as num?)?.toDouble() ?? 0.0;
      final qty = (line['quantity'] as num?)?.toDouble() ?? 0.0;
      if (qty > stock) return true;
    }
    return false;
  }

  double get _grandTotal {
    return _lines.fold(0.0, (sum, line) {
      final q = (line['quantity'] as num?)?.toDouble() ?? 0.0;
      final p = (line['unitPrice'] as num?)?.toDouble() ?? 0.0;
      return sum + (q * p);
    });
  }

  int get _totalPieces {
    return _lines.fold(0, (sum, line) {
      final q = (line['quantity'] as num?)?.toInt() ?? 0;
      return sum + q;
    });
  }

  void _submit() {
    if (_formKey.currentState?.validate() ?? false) {
      if (_lines.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Please add at least one line item')),
        );
        return;
      }

      if (_hasAnyShortage) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Cannot submit: One or more sale items exceed available stock.'),
            backgroundColor: AppColors.danger,
          ),
        );
        return;
      }

      int? supplierId;
      int? weaverId;

      if (_selectedType == 'yarn_purchase') {
        supplierId = _selectedSupplier?.supplierId;
      } else if (_selectedType == 'fabric_purchase' || _selectedType == 'yarn_sale') {
        weaverId = _selectedWeaver?.weaverId;
      }

      final notesText = [
        if (_merchantNameController.text.trim().isNotEmpty)
          'Merchant: ${_merchantNameController.text.trim()}',
        if (_notesController.text.trim().isNotEmpty) _notesController.text.trim(),
      ].join(' · ');

      context.read<TransactionsBloc>().add(
            CreateTransactionSubmitted(
              transactionId: _txnIdController.text.trim().isNotEmpty
                  ? _txnIdController.text.trim()
                  : null,
              type: _selectedType,
              paymentTerms: _paymentTerms,
              supplierId: supplierId,
              weaverId: weaverId,
              notes: notesText.isNotEmpty ? notesText : null,
              lines: _lines,
            ),
          );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('New Transaction (አዲስ ግብይት)')),
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
              onPressed: (isLoading || _hasAnyShortage) ? null : _submit,
              child: isLoading
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                      ),
                    )
                  : Text('Save Transaction · ${Formatters.currency(_grandTotal)}'),
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
                        'Transaction Classification',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 14),
                      DropdownButtonFormField<String>(
                        initialValue: _selectedType,
                        decoration: const InputDecoration(labelText: 'Transaction Type'),
                        items: _typeOptions
                            .map(
                              (t) => DropdownMenuItem(
                                value: t['value'],
                                child: Text(t['label']!),
                              ),
                            )
                            .toList(),
                        onChanged: (val) {
                          if (val != null) {
                            setState(() {
                              _selectedType = val;
                              _lines.clear();
                            });
                          }
                        },
                      ),
                      const SizedBox(height: 14),
                      DropdownButtonFormField<String>(
                        initialValue: _paymentTerms,
                        decoration: const InputDecoration(
                          labelText: 'Payment Terms',
                        ),
                        items: const [
                          DropdownMenuItem(value: 'on_delivery', child: Text('On Delivery (ሲረከብ)')),
                          DropdownMenuItem(value: 'prepaid', child: Text('Prepaid (ቅድመ ክፍያ)')),
                          DropdownMenuItem(value: 'credit_30', child: Text('Credit 30 Days (የ 30 ቀን ብድር)')),
                          DropdownMenuItem(value: 'installment', child: Text('Installments (በክፍልፋይ)')),
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
              // Counterparty Selection Card
              if (_selectedType == 'yarn_purchase')
                BlocBuilder<StockBloc, StockState>(
                  builder: (context, state) {
                    final suppliers = state.lookup?.suppliers ?? [];
                    return Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: DropdownButtonFormField<SupplierEntity>(
                          initialValue: _selectedSupplier,
                          decoration: const InputDecoration(
                            labelText: 'Supplier (አቅራቢ ድርጅት)',
                          ),
                          items: suppliers
                              .map(
                                (s) => DropdownMenuItem(
                                  value: s,
                                  child: Text(s.name),
                                ),
                              )
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
                          decoration: const InputDecoration(
                            labelText: 'Artisan Weaver (ሸማኝ)',
                          ),
                          items: state.weavers
                              .map(
                                (w) => DropdownMenuItem(
                                  value: w,
                                  child: Text(w.fullName),
                                ),
                              )
                              .toList(),
                          onChanged: (val) =>
                              setState(() => _selectedWeaver = val),
                        ),
                      ),
                    );
                  },
                )
              else if (_selectedType == 'fabric_sale')
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Merchant / Customer Information',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 10),
                        TextField(
                          controller: _merchantNameController,
                          decoration: const InputDecoration(
                            labelText: 'Customer or Merchant Name',
                            hintText: 'e.g. Merkato Wholesaler / Ato Kebede',
                            prefixIcon: Icon(Icons.storefront_outlined),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              const SizedBox(height: 16),
              // Itemized Lines Card
              BlocBuilder<StockBloc, StockState>(
                builder: (context, stockState) {
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
                                'Line Items (${_lines.length})',
                                style: const TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              ElevatedButton.icon(
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppColors.adminPrimary,
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 12,
                                    vertical: 8,
                                  ),
                                ),
                                icon: const Icon(Icons.add, size: 16),
                                label: const Text('Add Item'),
                                onPressed: () => _showAddLineDialog(stockState),
                              ),
                            ],
                          ),
                          if (_lines.isEmpty)
                            const Padding(
                              padding: EdgeInsets.symmetric(vertical: 24),
                              child: Center(
                                child: Text(
                                  'No items added. Tap "Add Item" to add goods.',
                                  style: TextStyle(
                                    fontSize: 13,
                                    color: AppColors.textMuted,
                                  ),
                                ),
                              ),
                            )
                          else
                            ListView.separated(
                              shrinkWrap: true,
                              physics: const NeverScrollableScrollPhysics(),
                              itemCount: _lines.length,
                              separatorBuilder: (context, index) =>
                                  const Divider(height: 16),
                              itemBuilder: (context, index) {
                                final line = _lines[index];
                                final q = (line['quantity'] as num?)?.toDouble() ?? 0.0;
                                final p = (line['unitPrice'] as num?)?.toDouble() ?? 0.0;
                                final subtotal = q * p;
                                final stock = (line['stockSnapshot'] as num?)?.toDouble();
                                final isShortage = _isSale && stock != null && q > stock;
                                final stockAfter = stock != null ? (stock - q).round() : null;

                                return Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Expanded(
                                          child: Text(
                                            line['description'] ?? 'Item #${index + 1}',
                                            style: const TextStyle(
                                              fontWeight: FontWeight.w600,
                                              fontSize: 13.5,
                                            ),
                                          ),
                                        ),
                                        IconButton(
                                          icon: const Icon(
                                            Icons.delete_outline,
                                            size: 18,
                                            color: AppColors.danger,
                                          ),
                                          onPressed: () {
                                            setState(() => _lines.removeAt(index));
                                          },
                                        ),
                                      ],
                                    ),
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Text(
                                          '${q.round()} pcs @ ${Formatters.currency(p)}',
                                          style: const TextStyle(
                                            fontSize: 12.5,
                                            color: AppColors.textSecondary,
                                          ),
                                        ),
                                        Text(
                                          Formatters.currency(subtotal),
                                          style: const TextStyle(
                                            fontWeight: FontWeight.w700,
                                            fontSize: 13.5,
                                            color: AppColors.adminPrimary,
                                          ),
                                        ),
                                      ],
                                    ),
                                    if (stock != null && _isSale) ...[
                                      const SizedBox(height: 4),
                                      Container(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 8,
                                          vertical: 3,
                                        ),
                                        decoration: BoxDecoration(
                                          color: isShortage
                                              ? const Color(0xFFFEF2F2)
                                              : const Color(0xFFF0FDF4),
                                          borderRadius: BorderRadius.circular(4),
                                          border: Border.all(
                                            color: isShortage
                                                ? const Color(0xFFFCA5A5)
                                                : const Color(0xFFBBF7D0),
                                          ),
                                        ),
                                        child: Text(
                                          isShortage
                                              ? 'Shortage: only ${stock.round()} in stock!'
                                              : 'Stock after: $stockAfter pcs',
                                          style: TextStyle(
                                            fontSize: 11,
                                            fontWeight: FontWeight.w600,
                                            color: isShortage
                                                ? AppColors.danger
                                                : AppColors.success,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ],
                                );
                              },
                            ),
                          if (_lines.isNotEmpty) ...[
                            const Divider(height: 24),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  'Total: $_totalPieces pieces',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w600,
                                    fontSize: 13,
                                  ),
                                ),
                                Text(
                                  Formatters.currency(_grandTotal),
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w700,
                                    fontSize: 16,
                                    color: AppColors.adminPrimary,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ],
                      ),
                    ),
                  );
                },
              ),
              if (_hasAnyShortage) ...[
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFEF2F2),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: const Color(0xFFFCA5A5)),
                  ),
                  child: const Row(
                    children: [
                      Icon(Icons.error_outline, color: AppColors.danger, size: 20),
                      SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Some items have quantities greater than available stock. Adjust quantities to continue.',
                          style: TextStyle(
                            fontSize: 12,
                            color: AppColors.danger,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
              const SizedBox(height: 16),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Additional Information',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: _txnIdController,
                        decoration: const InputDecoration(
                          labelText: 'Transaction # (optional)',
                          hintText: 'Auto-assigned if left blank',
                        ),
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: _notesController,
                        decoration: const InputDecoration(
                          labelText: 'Notes & Remarks',
                          hintText: 'e.g. CBE Ref #123456, special delivery notes',
                        ),
                        maxLines: 2,
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
