import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../products/domain/entities/product_entity.dart';
import '../../../products/domain/repositories/products_repository.dart';
import '../../../products/presentation/blocs/stock_bloc.dart';
import '../../../products/presentation/blocs/stock_event.dart';
import '../../../products/presentation/blocs/stock_state.dart';
import '../../../work_orders/domain/entities/work_order_entity.dart';
import '../../../work_orders/presentation/blocs/work_orders_bloc.dart';
import '../../../work_orders/presentation/blocs/work_orders_event.dart';
import '../../../work_orders/presentation/blocs/work_orders_state.dart';
import '../widgets/fabric_selection_sheet.dart';

class _YarnLineState {
  final String id;
  int? yarnVariantId;
  String quantity;
  double unitPrice;

  _YarnLineState({
    required this.id,
    this.yarnVariantId,
    this.quantity = '40',
    this.unitPrice = 0.0,
  });
}

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
  final _notesController = TextEditingController();

  WorkOrderDetailEntity? _lastZig;

  // Selected Fabric State
  int? _selectedVariantId;
  int? _selectedFabricId;
  int? _selectedWarpColorId;
  int? _selectedWeftColorId;
  int? _selectedDesignId;
  String _fabricDisplayName = 'Select fabric';
  double _weaverRate = 0.0;
  int _stdWeight = 64;
  String _stdDimensions = '120 × 80';

  // Yarn Lines State
  final List<_YarnLineState> _yarnLines = [];

  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    context.read<StockBloc>().add(LoadStockAndCatalog());
    _loadLastZig();

    // Default first yarn line
    _yarnLines.add(
      _YarnLineState(
        id: 'yarn-${DateTime.now().millisecondsSinceEpoch}',
        quantity: '40',
      ),
    );
  }

  Future<void> _loadLastZig() async {
    try {
      final orders = await context
          .read<WorkOrdersBloc>()
          .workOrdersRepository
          .getWorkOrders(weaverId: widget.weaverId);
      if (mounted && orders.isNotEmpty) {
        final detail = await context
            .read<WorkOrdersBloc>()
            .workOrdersRepository
            .getWorkOrderDetail(orders.first.zigId);
        if (mounted) {
          setState(() {
            _lastZig = detail;
          });
        }
      }
    } catch (_) {}
  }

  void _applyDefaultFabric(List<FabricVariantEntity> variants, CatalogLookupEntity lookup) {
    if (_selectedVariantId != null || _selectedFabricId != null) return;
    if (variants.isNotEmpty) {
      final first = variants.first;
      _selectedVariantId = first.fabricVariantId;
      _selectedFabricId = first.product?.productId;
      _selectedWarpColorId = first.warpColor?.colorId;
      _selectedWeftColorId = first.weftColor?.colorId;
      _selectedDesignId = first.design?.designId;
      _fabricDisplayName = _formatVariantName(first);
      _weaverRate = first.basePrice ?? 0.0;
      _updateSpecs(first.product);
    }
  }

  void _updateSpecs(ProductEntity? p) {
    if (p != null) {
      _stdWeight = 64;
      final len = p.standardLengthCm ?? 120.0;
      final wid = p.standardWidthCm ?? 80.0;
      _stdDimensions = '${len.round()} × ${wid.round()}';
    }
  }

  String _formatVariantName(FabricVariantEntity v) {
    final prod = v.product?.name ?? 'Fabric';
    final warp = v.warpColor?.name ?? '';
    final weft = v.weftColor?.name ?? '';
    final des = v.design?.name ?? '';

    final parts = [prod];
    if (warp.isNotEmpty) parts.add(warp);
    if (weft.isNotEmpty && weft != warp) parts.add(weft);
    if (des.isNotEmpty) parts.add(des);
    return parts.join(' · ');
  }

  String _formatYarnName(YarnVariantEntity y) {
    return '${y.yarnTypeName} · ${y.colorName}';
  }

  void _useSameSetup(List<YarnVariantEntity> yarnVariants) {
    if (_lastZig == null) return;

    setState(() {
      if (_lastZig!.fabricVariant != null) {
        final fv = _lastZig!.fabricVariant!;
        _selectedVariantId = fv.fabricVariantId;
        _selectedFabricId = fv.product?.productId;
        _selectedWarpColorId = fv.warpColor?.colorId;
        _selectedWeftColorId = fv.weftColor?.colorId;
        _selectedDesignId = fv.design?.designId;
        _fabricDisplayName = _formatVariantName(fv);
        _weaverRate = fv.basePrice ?? 0.0;
        _updateSpecs(fv.product);
      }

      // Copy yarn lines from last zig if available
      final ygList = _lastZig!.yarnGiven;
      if (ygList.isNotEmpty) {
        _yarnLines.clear();
        for (var i = 0; i < ygList.length; i++) {
          final yg = ygList[i];
          final matched = yarnVariants
              .where((y) => y.yarnVariantId == yg.yarnVariantId)
              .firstOrNull;
          _yarnLines.add(
            _YarnLineState(
              id: 'yarn-copy-$i-${DateTime.now().millisecondsSinceEpoch}',
              yarnVariantId: yg.yarnVariantId > 0 ? yg.yarnVariantId : null,
              quantity: yg.quantity.round().toString(),
              unitPrice: matched?.basePrice ?? yg.unitPrice,
            ),
          );
        }
      }
    });
  }

  Future<void> _openFabricSelectionModal(
    List<FabricVariantEntity> variants,
    CatalogLookupEntity lookup,
  ) async {
    final res = await FabricSelectionSheet.show(
      context,
      fabricVariants: variants,
      lookup: lookup,
      currentVariantId: _selectedVariantId,
    );

    if (res != null && mounted) {
      setState(() {
        _selectedVariantId = res.variant?.fabricVariantId;
        _selectedFabricId = res.fabricId;
        _selectedWarpColorId = res.warpColorId;
        _selectedWeftColorId = res.weftColorId;
        _selectedDesignId = res.designId;
        _fabricDisplayName = res.displayName;
        if (res.weaverRate != null) _weaverRate = res.weaverRate!;
        if (res.variant?.product != null) _updateSpecs(res.variant!.product);
      });
    }
  }

  void _addYarnLine(List<YarnVariantEntity> yarnVariants) {
    final inStock = yarnVariants.where((y) => y.stockSnapshot > 0).firstOrNull;
    final chosen = inStock ?? yarnVariants.firstOrNull;

    setState(() {
      _yarnLines.add(
        _YarnLineState(
          id: 'yarn-${DateTime.now().millisecondsSinceEpoch}-${_yarnLines.length}',
          yarnVariantId: chosen?.yarnVariantId,
          quantity: '40',
          unitPrice: chosen?.basePrice ?? 0.0,
        ),
      );
    });
  }

  void _removeYarnLine(String id) {
    setState(() {
      _yarnLines.removeWhere((l) => l.id == id);
    });
  }

  // Live Validations & Calculations
  List<String> _computeValidationProblems(List<YarnVariantEntity> yarnVariants) {
    final problems = <String>[];
    if (_selectedVariantId == null && _selectedFabricId == null) {
      problems.add('Please select a fabric.');
    }

    for (var i = 0; i < _yarnLines.length; i++) {
      final line = _yarnLines[i];
      if (line.yarnVariantId == null) {
        problems.add('Yarn line ${i + 1}: please choose a yarn variant or remove the line.');
        continue;
      }
      final qty = double.tryParse(line.quantity) ?? -1;
      if (qty < 0) {
        problems.add('Yarn line ${i + 1}: quantity cannot be negative.');
        continue;
      }

      final variant = yarnVariants
          .where((y) => y.yarnVariantId == line.yarnVariantId)
          .firstOrNull;
      final stock = variant?.stockSnapshot ?? 0.0;
      if (qty > stock) {
        problems.add(
          'Yarn line ${i + 1} is more than stock available (only ${stock.round()} in stock).',
        );
      }
    }

    return problems;
  }

  Future<void> _submit(List<YarnVariantEntity> yarnVariants) async {
    final problems = _computeValidationProblems(yarnVariants);
    if (problems.isNotEmpty) return;

    setState(() => _isSubmitting = true);

    try {
      int finalVariantId = _selectedVariantId ?? 0;

      // Auto-create variant if new combination was described
      if (finalVariantId == 0 && _selectedFabricId != null) {
        final productsRepo = RepositoryProvider.of<ProductsRepository>(context);
        final created = await productsRepo.createFabricVariant(
          fabricId: _selectedFabricId!,
          warpColorId: _selectedWarpColorId,
          weftColorId: _selectedWeftColorId,
          designId: _selectedDesignId,
        );
        finalVariantId = created.fabricVariantId;
      }

      if (finalVariantId == 0) {
        throw Exception('Please select or describe a valid fabric');
      }

      // Filter lines where qty > 0
      final validLines = _yarnLines
          .where((l) => l.yarnVariantId != null && (double.tryParse(l.quantity) ?? 0) > 0)
          .map((l) => {
                'yarnVariantId': l.yarnVariantId,
                'quantity': double.parse(l.quantity),
                'unitPrice': l.unitPrice,
              })
          .toList();

      if (!mounted) return;
      context.read<WorkOrdersBloc>().add(
            CreateWorkOrderSubmitted(
              weaverUserId: widget.weaverId,
              fabricVariantId: finalVariantId,
              yarnLines: validLines,
            ),
          );
    } catch (e) {
      if (mounted) {
        setState(() => _isSubmitting = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceAll('Exception: ', '')),
            backgroundColor: AppColors.danger,
          ),
        );
      }
    }
  }

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'አዲስ ዝግ · NEW ZIG',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: Color(0xFFEA580C),
                letterSpacing: 0.5,
              ),
            ),
            Text(
              'Issue zig for ${widget.weaverName}',
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: Color(0xFF0F172A),
              ),
            ),
          ],
        ),
        backgroundColor: Colors.white,
        elevation: 0.5,
        iconTheme: const IconThemeData(color: Color(0xFF0F172A)),
      ),
      body: BlocConsumer<WorkOrdersBloc, WorkOrdersState>(
        listener: (context, state) {
          if (state.status == WorkOrdersStatus.actionSuccess) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.successMessage ?? 'Work order created!'),
                backgroundColor: AppColors.success,
              ),
            );
            Navigator.pop(context, true);
          } else if (state.status == WorkOrdersStatus.error && state.errorMessage != null) {
            setState(() => _isSubmitting = false);
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.errorMessage!),
                backgroundColor: AppColors.danger,
              ),
            );
          }
        },
        builder: (context, workOrderState) {
          return BlocBuilder<StockBloc, StockState>(
            builder: (context, stockState) {
              final lookup = stockState.lookup;
              final fabricVariants = stockState.fabricVariants;
              final yarnVariants = stockState.yarnVariants;

              if (stockState.status == StockStatus.loading && lookup == null) {
                return const Center(child: CircularProgressIndicator());
              }

              if (lookup == null) {
                return const Center(child: Text('Unable to load catalog data.'));
              }

              // Apply default fabric if none selected
              _applyDefaultFabric(fabricVariants, lookup);

              // Auto-fill first yarn line variant if unselected
              if (_yarnLines.isNotEmpty && _yarnLines[0].yarnVariantId == null && yarnVariants.isNotEmpty) {
                final inStock = yarnVariants.where((y) => y.stockSnapshot > 0).firstOrNull ?? yarnVariants.first;
                _yarnLines[0].yarnVariantId = inStock.yarnVariantId;
                _yarnLines[0].unitPrice = inStock.basePrice ?? 0.0;
              }

              final validationProblems = _computeValidationProblems(yarnVariants);

              // Compute Summary Totals
              int totalLines = 0;
              double totalQuantity = 0.0;
              double totalYarnValue = 0.0;
              for (final line in _yarnLines) {
                if (line.yarnVariantId != null) {
                  final qty = double.tryParse(line.quantity) ?? 0.0;
                  if (qty > 0) {
                    totalLines++;
                    totalQuantity += qty;
                    totalYarnValue += (qty * line.unitPrice);
                  }
                }
              }

              return SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 40),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Last Zig Banner (Image 2)
                    if (_lastZig != null)
                      Container(
                        margin: const EdgeInsets.only(bottom: 16),
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFFF7ED),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: const Color(0xFFFED7AA)),
                        ),
                        child: Row(
                          children: [
                            Expanded(
                              child: RichText(
                                text: TextSpan(
                                  style: const TextStyle(fontSize: 12.5, color: Color(0xFF7C2D12)),
                                  children: [
                                    const TextSpan(
                                      text: 'Last zig for this weaver: ',
                                      style: TextStyle(fontWeight: FontWeight.w700),
                                    ),
                                    TextSpan(
                                      text: _lastZig!.fabricVariant != null
                                          ? '${_lastZig!.zigId} · ${_formatVariantName(_lastZig!.fabricVariant!)}'
                                          : _lastZig!.zigId,
                                    ),
                                  ],
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            OutlinedButton(
                              onPressed: () => _useSameSetup(yarnVariants),
                              style: OutlinedButton.styleFrom(
                                backgroundColor: Colors.white,
                                side: const BorderSide(color: Color(0xFFFED7AA)),
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                              ),
                              child: const Text(
                                'Use the same setup',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                  color: Color(0xFFC2410C),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),

                    // Card 1: Fabric · ጨርቅ (Image 2)
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                        boxShadow: const [BoxShadow(color: Color(0x05000000), blurRadius: 4, offset: Offset(0, 1))],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Fabric · ጨርቅ',
                            style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: Color(0xFF0F172A)),
                          ),
                          const SizedBox(height: 12),

                          // Fabric Display Pill Box (Image 2)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                            decoration: BoxDecoration(
                              color: const Color(0xFFFFF7ED),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: const Color(0xFFFED7AA)),
                            ),
                            child: Row(
                              children: [
                                Container(
                                  width: 10,
                                  height: 10,
                                  decoration: const BoxDecoration(
                                    color: Color(0xFFEA580C),
                                    shape: BoxShape.circle,
                                  ),
                                ),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Text(
                                    _fabricDisplayName,
                                    style: const TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w700,
                                      color: Color(0xFF7C2D12),
                                    ),
                                  ),
                                ),
                                OutlinedButton(
                                  onPressed: () => _openFabricSelectionModal(fabricVariants, lookup),
                                  style: OutlinedButton.styleFrom(
                                    backgroundColor: Colors.white,
                                    side: const BorderSide(color: Color(0xFFFED7AA)),
                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                                  ),
                                  child: const Text(
                                    'Change',
                                    style: TextStyle(
                                      fontSize: 12.5,
                                      fontWeight: FontWeight.w700,
                                      color: Color(0xFF9A3412),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 12),

                          // Reference Specs Callout Box (Image 2)
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF8FAFC),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: const Color(0xFFE2E8F0)),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    const Icon(Icons.info_outline, size: 15, color: Color(0xFF475569)),
                                    const SizedBox(width: 6),
                                    Text(
                                      'For reference · not saved on the zig',
                                      style: TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w600,
                                        color: Colors.grey.shade700,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  'Fabric standard: weight $_stdWeight g · $_stdDimensions cm',
                                  style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  'Weaver rate today: ${_weaverRate.round()} ETB, applied when fabric is returned',
                                  style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Card 2: Yarn to give · የሚሰጥ ጥጥ (Image 2)
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                        boxShadow: const [BoxShadow(color: Color(0x05000000), blurRadius: 4, offset: Offset(0, 1))],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text(
                                'Yarn to give · የሚሰጥ ጥጥ',
                                style: TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.w700,
                                  color: Color(0xFF0F172A),
                                ),
                              ),
                              Text(
                                'Stock is checked as you type',
                                style: TextStyle(fontSize: 11.5, color: Colors.grey.shade500),
                              ),
                            ],
                          ),
                          const SizedBox(height: 14),

                          // Yarn Lines List
                          if (_yarnLines.isEmpty)
                            Container(
                              width: double.infinity,
                              padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
                              decoration: BoxDecoration(
                                color: const Color(0xFFF8FAFC),
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: const Color(0xFFCBD5E1), style: BorderStyle.solid),
                              ),
                              child: Column(
                                children: [
                                  Icon(Icons.inventory_2_outlined, size: 28, color: Colors.grey.shade400),
                                  const SizedBox(height: 6),
                                  Text(
                                    'No yarn lines added. This zig will be assigned without yarn.',
                                    textAlign: TextAlign.center,
                                    style: TextStyle(fontSize: 12.5, color: Colors.grey.shade600),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    'Tap "+ Add yarn line" below if you wish to issue yarn.',
                                    textAlign: TextAlign.center,
                                    style: TextStyle(fontSize: 11.5, color: Colors.grey.shade400),
                                  ),
                                ],
                              ),
                            )
                          else
                            ListView.separated(
                              shrinkWrap: true,
                              physics: const NeverScrollableScrollPhysics(),
                              itemCount: _yarnLines.length,
                              separatorBuilder: (context, index) => const SizedBox(height: 12),
                              itemBuilder: (context, index) {
                                final item = _yarnLines[index];
                                final variant = yarnVariants
                                    .where((y) => y.yarnVariantId == item.yarnVariantId)
                                    .firstOrNull;
                                final stock = variant?.stockSnapshot ?? 0.0;
                                final qty = double.tryParse(item.quantity) ?? 0.0;
                                final stockAfter = (stock - qty).round();
                                final hasShortage = item.yarnVariantId != null && qty > stock;

                                return Container(
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(10),
                                    border: Border.all(
                                      color: hasShortage ? const Color(0xFFFCA5A5) : const Color(0xFFE2E8F0),
                                    ),
                                    boxShadow: const [
                                      BoxShadow(color: Color(0x03000000), blurRadius: 3, offset: Offset(0, 1))
                                    ],
                                  ),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      // Row 1: Dropdown + Delete Icon
                                      Row(
                                        children: [
                                          Expanded(
                                            child: DropdownButtonFormField<int>(
                                              initialValue: item.yarnVariantId,
                                              isExpanded: true,
                                              decoration: InputDecoration(
                                                contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                                              ),
                                              items: yarnVariants
                                                  .map(
                                                    (y) => DropdownMenuItem<int>(
                                                      value: y.yarnVariantId,
                                                      child: Text(
                                                        '${_formatYarnName(y)} (${y.stockSnapshot.round()} in stock)',
                                                        overflow: TextOverflow.ellipsis,
                                                        style: const TextStyle(fontSize: 13),
                                                      ),
                                                    ),
                                                  )
                                                  .toList(),
                                              onChanged: (val) {
                                                if (val != null) {
                                                  final yv = yarnVariants.where((y) => y.yarnVariantId == val).firstOrNull;
                                                  setState(() {
                                                    item.yarnVariantId = val;
                                                    item.unitPrice = yv?.basePrice ?? 0.0;
                                                  });
                                                }
                                              },
                                            ),
                                          ),
                                          const SizedBox(width: 6),
                                          IconButton(
                                            icon: const Icon(Icons.delete_outline, size: 20, color: Color(0xFF94A3B8)),
                                            onPressed: () => _removeYarnLine(item.id),
                                            tooltip: 'Remove line',
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 10),

                                      // Row 2: Quantity + Price + Stock After Pill (Image 2)
                                      Row(
                                        children: [
                                          // Quantity Input
                                          SizedBox(
                                            width: 80,
                                            child: TextFormField(
                                              initialValue: item.quantity,
                                              keyboardType: TextInputType.number,
                                              decoration: InputDecoration(
                                                labelText: 'Quantity',
                                                contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                                                filled: hasShortage,
                                                fillColor: hasShortage ? const Color(0xFFFEF2F2) : null,
                                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                                                focusedBorder: OutlineInputBorder(
                                                  borderRadius: BorderRadius.circular(8),
                                                  borderSide: BorderSide(
                                                    color: hasShortage ? const Color(0xFFEF4444) : const Color(0xFFEA580C),
                                                  ),
                                                ),
                                              ),
                                              onChanged: (val) => setState(() => item.quantity = val),
                                            ),
                                          ),
                                          const SizedBox(width: 12),

                                          // Price
                                          Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                '${item.unitPrice.round()} ETB',
                                                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
                                              ),
                                              Text('price list', style: TextStyle(fontSize: 10, color: Colors.grey.shade500)),
                                            ],
                                          ),
                                          const Spacer(),

                                          // Stock After Pill (Image 2)
                                          if (item.yarnVariantId != null)
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                              decoration: BoxDecoration(
                                                color: hasShortage ? const Color(0xFFFEF2F2) : const Color(0xFFF0FDF4),
                                                borderRadius: BorderRadius.circular(16),
                                                border: Border.all(
                                                  color: hasShortage ? const Color(0xFFFECACA) : const Color(0xFFBBF7D0),
                                                ),
                                              ),
                                              child: Row(
                                                mainAxisSize: MainAxisSize.min,
                                                children: [
                                                  Icon(
                                                    hasShortage ? Icons.warning_amber_rounded : Icons.check_circle_outline,
                                                    size: 14,
                                                    color: hasShortage ? const Color(0xFFDC2626) : const Color(0xFF15803D),
                                                  ),
                                                  const SizedBox(width: 4),
                                                  Text(
                                                    hasShortage
                                                        ? (stock > 0 ? 'Only ${stock.round()} in stock' : '0 in stock')
                                                        : '${stock.round()} → $stockAfter',
                                                    style: TextStyle(
                                                      fontSize: 11.5,
                                                      fontWeight: FontWeight.w700,
                                                      color: hasShortage ? const Color(0xFFDC2626) : const Color(0xFF15803D),
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ),
                                        ],
                                      ),
                                    ],
                                  ),
                                );
                              },
                            ),
                          const SizedBox(height: 14),

                          // Add Yarn Line Button
                          OutlinedButton.icon(
                            onPressed: () => _addYarnLine(yarnVariants),
                            icon: const Icon(Icons.add, size: 18),
                            label: const Text('Add yarn line'),
                            style: OutlinedButton.styleFrom(
                              minimumSize: const Size(double.infinity, 44),
                              backgroundColor: const Color(0xFFFFF7ED),
                              foregroundColor: const Color(0xFFC2410C),
                              side: const BorderSide(color: Color(0xFFFED7AA), style: BorderStyle.solid),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                            ),
                          ),
                          const SizedBox(height: 12),

                          // Notes Input
                          TextFormField(
                            controller: _notesController,
                            decoration: InputDecoration(
                              labelText: 'Work order notes / special instructions (optional)',
                              hintText: 'e.g. Special order, expedited weave...',
                              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Card 3: Summary & Problem Alert Box (Image 2)
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                        boxShadow: const [BoxShadow(color: Color(0x05000000), blurRadius: 4, offset: Offset(0, 1))],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Summary',
                            style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: Color(0xFF0F172A)),
                          ),
                          const SizedBox(height: 14),

                          _buildSummaryRow('Weaver', widget.weaverName),
                          const SizedBox(height: 8),
                          _buildSummaryRow('Fabric', _fabricDisplayName),
                          const SizedBox(height: 8),
                          _buildSummaryRow(
                            'Yarn',
                            totalLines == 0 ? '0 lines · 0 pcs (No yarn)' : '$totalLines lines · ${totalQuantity.round()} pcs',
                          ),
                          const SizedBox(height: 8),
                          _buildSummaryRow('Yarn value charged', '${totalYarnValue.toStringAsFixed(2)} ETB'),
                          const SizedBox(height: 8),
                          _buildSummaryRow('Zig ID', 'Assigned when issued', isItalic: true),
                          const SizedBox(height: 14),

                          // Problem Alert Box (Image 2)
                          if (validationProblems.isNotEmpty)
                            Container(
                              margin: const EdgeInsets.only(bottom: 14),
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: const Color(0xFFFEF2F2),
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: const Color(0xFFFECACA)),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      const Icon(Icons.warning_amber_rounded, size: 16, color: Color(0xFFDC2626)),
                                      const SizedBox(width: 6),
                                      Text(
                                        '${validationProblems.length} problem${validationProblems.length > 1 ? 's' : ''} to fix',
                                        style: const TextStyle(
                                          fontSize: 12.5,
                                          fontWeight: FontWeight.w700,
                                          color: Color(0xFF991B1B),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 6),
                                  ...validationProblems.map(
                                    (p) => Padding(
                                      padding: const EdgeInsets.only(bottom: 2),
                                      child: Text('• $p', style: const TextStyle(fontSize: 11.5, color: Color(0xFFB91C1C))),
                                    ),
                                  ),
                                ],
                              ),
                            ),

                          // Issue Zig Button (Image 2)
                          ElevatedButton(
                            onPressed: (_isSubmitting || validationProblems.isNotEmpty)
                                ? null
                                : () => _submit(yarnVariants),
                            style: ElevatedButton.styleFrom(
                              minimumSize: const Size(double.infinity, 46),
                              backgroundColor: const Color(0xFFC2410C),
                              disabledBackgroundColor: const Color(0xFFE2E8F0),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                            ),
                            child: _isSubmitting
                                ? const SizedBox(
                                    height: 20,
                                    width: 20,
                                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                  )
                                : Text(
                                    'Issue zig · ዝግ ስጥ',
                                    style: TextStyle(
                                      color: validationProblems.isNotEmpty ? const Color(0xFF94A3B8) : Colors.white,
                                      fontWeight: FontWeight.w700,
                                      fontSize: 14,
                                    ),
                                  ),
                          ),
                          const SizedBox(height: 10),

                          OutlinedButton(
                            onPressed: () => Navigator.pop(context),
                            style: OutlinedButton.styleFrom(
                              minimumSize: const Size(double.infinity, 40),
                              side: const BorderSide(color: Color(0xFFCBD5E1)),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                            ),
                            child: const Text('Cancel', style: TextStyle(color: Color(0xFF475569), fontWeight: FontWeight.w600)),
                          ),
                          const SizedBox(height: 10),

                          Text(
                            totalLines == 0
                                ? 'Issuing without yarn will assign the zig to the weaver. Yarn can be issued later as work progresses.'
                                : 'Issuing takes the yarn out of stock right away. The yarn value is charged to the weaver at settlement.',
                            textAlign: TextAlign.center,
                            style: TextStyle(fontSize: 11, color: Colors.grey.shade500),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              );
            },
          );
        },
      ),
    );
  }

  Widget _buildSummaryRow(String label, String value, {bool isItalic = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: TextStyle(fontSize: 12.5, color: Colors.grey.shade600)),
        Flexible(
          child: Text(
            value,
            textAlign: TextAlign.right,
            style: TextStyle(
              fontSize: 12.5,
              fontWeight: FontWeight.w700,
              fontStyle: isItalic ? FontStyle.italic : FontStyle.normal,
              color: isItalic ? Colors.grey.shade500 : const Color(0xFF0F172A),
            ),
          ),
        ),
      ],
    );
  }
}
