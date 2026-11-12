import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/custom_widgets.dart';
import '../../../products/domain/entities/product_entity.dart';
import '../../../products/presentation/blocs/stock_bloc.dart';
import '../../../products/presentation/blocs/stock_event.dart';
import '../../../products/presentation/blocs/stock_state.dart';
import '../../../weavers/presentation/widgets/fabric_selection_sheet.dart';
import '../../domain/entities/work_order_entity.dart';
import '../blocs/work_orders_bloc.dart';
import '../blocs/work_orders_event.dart';
import '../blocs/work_orders_state.dart';

class ZigDetailPage extends StatefulWidget {
  final String zigId;

  const ZigDetailPage({super.key, required this.zigId});

  @override
  State<ZigDetailPage> createState() => _ZigDetailPageState();
}

class _ZigDetailPageState extends State<ZigDetailPage> {
  @override
  void initState() {
    super.initState();
    context.read<WorkOrdersBloc>().add(LoadWorkOrderDetail(widget.zigId));
    context.read<StockBloc>().add(LoadStockAndCatalog());
  }

  void _showAddYarnDialog(CatalogLookupEntity lookup) {
    final Set<int> seenYarnTypeIds = {};
    final yarnTypesList = <YarnTypeEntity>[];
    for (final yt in lookup.yarnTypes) {
      if (seenYarnTypeIds.add(yt.yarnTypeId)) {
        yarnTypesList.add(yt);
      }
    }
    if (yarnTypesList.isEmpty) {
      yarnTypesList.add(
        const YarnTypeEntity(yarnTypeId: 1, materialName: 'Cotton'),
      );
      seenYarnTypeIds.add(1);
    }

    final Set<int> seenColorIds = {};
    final colorsList = <NamedColorEntity>[];
    for (final c in lookup.colors) {
      if (seenColorIds.add(c.colorId)) {
        colorsList.add(c);
      }
    }
    if (colorsList.isEmpty) {
      colorsList.add(
        const NamedColorEntity(colorId: 1, colorCode: '#FFFFFF', name: 'White'),
      );
      seenColorIds.add(1);
    }

    final Set<int> seenSupplierIds = {};
    final suppliersList = <SupplierEntity>[];
    for (final s in lookup.suppliers) {
      if (seenSupplierIds.add(s.supplierId)) {
        suppliersList.add(s);
      }
    }

    final qtyCtrl = TextEditingController(text: '10');
    final priceCtrl = TextEditingController(text: '400');
    int selectedTypeId = yarnTypesList.first.yarnTypeId;
    int selectedColorId = colorsList.first.colorId;
    int? selectedSupplierId =
        suppliersList.isNotEmpty ? suppliersList.first.supplierId : null;

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
                    DropdownButtonFormField<int>(
                      initialValue: selectedTypeId,
                      decoration: const InputDecoration(labelText: 'Material'),
                      items: yarnTypesList
                          .map(
                            (yt) => DropdownMenuItem<int>(
                              value: yt.yarnTypeId,
                              child: Text(yt.materialName),
                            ),
                          )
                          .toList(),
                      onChanged: (val) {
                        if (val != null) {
                          setDialogState(() => selectedTypeId = val);
                        }
                      },
                    ),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<int>(
                      initialValue: selectedColorId,
                      decoration: const InputDecoration(labelText: 'Color'),
                      items: colorsList
                          .map(
                            (c) => DropdownMenuItem<int>(
                              value: c.colorId,
                              child: Text(c.name),
                            ),
                          )
                          .toList(),
                      onChanged: (val) {
                        if (val != null) {
                          setDialogState(() => selectedColorId = val);
                        }
                      },
                    ),
                    const SizedBox(height: 12),
                    if (suppliersList.isNotEmpty) ...[
                      DropdownButtonFormField<int?>(
                        initialValue: selectedSupplierId,
                        decoration:
                            const InputDecoration(labelText: 'Supplier (Optional)'),
                        items: [
                          const DropdownMenuItem<int?>(
                            value: null,
                            child: Text('None'),
                          ),
                          ...suppliersList.map(
                            (s) => DropdownMenuItem<int?>(
                              value: s.supplierId,
                              child: Text(s.name),
                            ),
                          ),
                        ],
                        onChanged: (val) =>
                            setDialogState(() => selectedSupplierId = val),
                      ),
                      const SizedBox(height: 12),
                    ],
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
                        labelText: 'Unit Price (ETB)',
                      ),
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
                    final qty = int.tryParse(qtyCtrl.text) ?? 0;
                    final price = double.tryParse(priceCtrl.text) ?? 0.0;
                    if (qty > 0 && price > 0) {
                      context.read<WorkOrdersBloc>().add(
                        AddYarnGivenSubmitted(
                          zigId: widget.zigId,
                          lines: [
                            {
                              'yarnTypeId': selectedTypeId,
                              'colorId': selectedColorId,
                              'supplierId': selectedSupplierId,
                              'quantity': qty,
                              'unitPrice': price,
                            },
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

  void _showAddReturnDialog(
    CatalogLookupEntity lookup,
    List<FabricVariantEntity> fabricVariants,
  ) {
    final currentVariant = context
        .read<WorkOrdersBloc>()
        .state
        .selectedDetail
        ?.fabricVariant;

    // Deduplicate fabric products
    final Set<int> seenProductIds = {};
    final fabricProducts = <ProductEntity>[];
    for (final p in lookup.products) {
      if ((p.category == 'fabric' || p.category.isEmpty) &&
          seenProductIds.add(p.productId)) {
        fabricProducts.add(p);
      }
    }
    if (currentVariant?.product != null &&
        seenProductIds.add(currentVariant!.product!.productId)) {
      fabricProducts.insert(0, currentVariant.product!);
    }
    if (fabricProducts.isEmpty) {
      fabricProducts.add(
        ProductEntity(
          productId: currentVariant?.product?.productId ?? 1,
          name: currentVariant?.displayName ?? 'Fabric',
          category: 'fabric',
          basePrice: currentVariant?.basePrice ?? 120.0,
        ),
      );
      seenProductIds.add(fabricProducts.first.productId);
    }

    // Deduplicate colors
    final Set<int> seenColorIds = {};
    final colorsList = <NamedColorEntity>[];
    for (final c in lookup.colors) {
      if (seenColorIds.add(c.colorId)) {
        colorsList.add(c);
      }
    }
    if (colorsList.isEmpty) {
      colorsList.add(
        const NamedColorEntity(colorId: 1, colorCode: '#FFFFFF', name: 'White'),
      );
      seenColorIds.add(1);
    }
    if (currentVariant?.warpColor != null &&
        seenColorIds.add(currentVariant!.warpColor!.colorId)) {
      colorsList.add(currentVariant.warpColor!);
    }
    if (currentVariant?.weftColor != null &&
        seenColorIds.add(currentVariant!.weftColor!.colorId)) {
      colorsList.add(currentVariant.weftColor!);
    }

    // Deduplicate designs
    final Set<int> seenDesignIds = {};
    final designsList = <DesignEntity>[];
    for (final d in lookup.designs) {
      if (seenDesignIds.add(d.designId)) {
        designsList.add(d);
      }
    }
    if (currentVariant?.design != null &&
        seenDesignIds.add(currentVariant!.design!.designId)) {
      designsList.insert(0, currentVariant.design!);
    }

    // Deduplicate variants
    final Set<int> seenVariantIds = {};
    final variantsList = <FabricVariantEntity>[];
    for (final v in fabricVariants) {
      if (seenVariantIds.add(v.fabricVariantId)) {
        variantsList.add(v);
      }
    }
    if (currentVariant != null &&
        seenVariantIds.add(currentVariant.fabricVariantId)) {
      variantsList.insert(0, currentVariant);
    }

    int? selectedVariantId = currentVariant?.fabricVariantId;
    int selectedProductId = currentVariant?.product?.productId ??
        fabricProducts.first.productId;
    int selectedWarpId = currentVariant?.warpColor?.colorId ??
        colorsList.first.colorId;
    int selectedWeftId = currentVariant?.weftColor?.colorId ??
        colorsList.first.colorId;
    int? selectedDesignId = currentVariant?.design?.designId;

    String fabricDisplayName = currentVariant?.displayName ??
        '${fabricProducts.first.name} · ${colorsList.first.name}';
    double defaultPrice = (currentVariant?.basePrice ?? 0) > 0
        ? currentVariant!.basePrice!
        : (fabricProducts.first.basePrice > 0
            ? fabricProducts.first.basePrice
            : 120.0);
    double? stdWeight = currentVariant?.product?.standardWeightG ??
        fabricProducts.first.standardWeightG ??
        64.0;
    double? stdLength = currentVariant?.product?.standardLengthCm ??
        fabricProducts.first.standardLengthCm;
    double? stdWidth = currentVariant?.product?.standardWidthCm ??
        fabricProducts.first.standardWidthCm;

    final qtyCtrl = TextEditingController();
    final weightCtrl = TextEditingController();
    final lengthCtrl =
        TextEditingController(text: stdLength?.toString() ?? '');
    final widthCtrl = TextEditingController(text: stdWidth?.toString() ?? '');
    final priceCtrl = TextEditingController(text: defaultPrice.toString());
    final remarkCtrl = TextEditingController();
    final defectReasonCtrl = TextEditingController();
    final deductionCtrl = TextEditingController();
    var isDefective = false;
    var showManualSelectors = false;

    showDialog(
      context: context,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (dialogContext, setDialogState) => AlertDialog(
            title: Text('Receive Fabric for Zig #${widget.zigId}'),
            content: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Fabric Card matching Image 2 & Image 1
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFF7ED),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: const Color(0xFFFED7AA)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              width: 8,
                              height: 8,
                              decoration: const BoxDecoration(
                                color: Color(0xFFEA580C),
                                shape: BoxShape.circle,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                fabricDisplayName,
                                style: const TextStyle(
                                  fontWeight: FontWeight.w700,
                                  fontSize: 13.5,
                                  color: Color(0xFF1E293B),
                                ),
                              ),
                            ),
                            OutlinedButton(
                              style: OutlinedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 10,
                                  vertical: 4,
                                ),
                                minimumSize: Size.zero,
                                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                foregroundColor: const Color(0xFFC2410C),
                                side: const BorderSide(
                                  color: Color(0xFFFED7AA),
                                ),
                              ),
                              onPressed: () async {
                                final result = await FabricSelectionSheet.show(
                                  context,
                                  fabricVariants: variantsList,
                                  lookup: lookup,
                                  currentVariantId: selectedVariantId,
                                );
                                if (result != null) {
                                  setDialogState(() {
                                    selectedVariantId =
                                        result.variant?.fabricVariantId;
                                    selectedProductId =
                                        result.fabricId ?? selectedProductId;
                                    selectedWarpId =
                                        result.warpColorId ?? selectedWarpId;
                                    selectedWeftId =
                                        result.weftColorId ?? selectedWeftId;
                                    selectedDesignId = result.designId;
                                    fabricDisplayName = result.displayName;
                                    if (result.weaverRate != null &&
                                        result.weaverRate! > 0) {
                                      priceCtrl.text =
                                          result.weaverRate.toString();
                                    }
                                    final matchedProd = fabricProducts
                                        .where(
                                          (p) =>
                                              p.productId == selectedProductId,
                                        )
                                        .firstOrNull;
                                    if (matchedProd?.standardLengthCm != null) {
                                      lengthCtrl.text =
                                          matchedProd!.standardLengthCm.toString();
                                    }
                                    if (matchedProd?.standardWidthCm != null) {
                                      widthCtrl.text =
                                          matchedProd!.standardWidthCm.toString();
                                    }
                                    if (matchedProd?.standardWeightG != null) {
                                      stdWeight = matchedProd!.standardWeightG;
                                      final q =
                                          int.tryParse(qtyCtrl.text) ?? 0;
                                      if (q > 0) {
                                        weightCtrl.text =
                                            (q * stdWeight!).round().toString();
                                      }
                                    }
                                  });
                                }
                              },
                              child: const Text(
                                'Change',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Text(
                          'Standard: weight ${stdWeight?.round() ?? 64}g · ${lengthCtrl.text.isNotEmpty ? lengthCtrl.text : '-'} × ${widthCtrl.text.isNotEmpty ? widthCtrl.text : '-'} cm',
                          style: const TextStyle(
                            fontSize: 11.5,
                            color: Color(0xFF64748B),
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Option to toggle direct manual selectors
                  InkWell(
                    onTap: () => setDialogState(
                      () => showManualSelectors = !showManualSelectors,
                    ),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            showManualSelectors
                                ? 'Hide detailed selectors'
                                : 'Or describe details manually',
                            style: const TextStyle(
                              fontSize: 12,
                              color: Color(0xFFC2410C),
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          Icon(
                            showManualSelectors
                                ? Icons.keyboard_arrow_up
                                : Icons.keyboard_arrow_down,
                            size: 18,
                            color: const Color(0xFFC2410C),
                          ),
                        ],
                      ),
                    ),
                  ),

                  if (showManualSelectors) ...[
                    DropdownButtonFormField<int>(
                      initialValue: selectedProductId,
                      decoration:
                          const InputDecoration(labelText: 'Fabric Product'),
                      items: fabricProducts
                          .map(
                            (p) => DropdownMenuItem<int>(
                              value: p.productId,
                              child: Text(p.name),
                            ),
                          )
                          .toList(),
                      onChanged: (value) {
                        if (value == null) return;
                        final match = fabricProducts
                            .where((p) => p.productId == value)
                            .firstOrNull;
                        setDialogState(() {
                          selectedProductId = value;
                          selectedVariantId = null;
                          if (match != null) {
                            if (match.basePrice > 0) {
                              priceCtrl.text = match.basePrice.toString();
                            }
                            lengthCtrl.text =
                                match.standardLengthCm?.toString() ?? '';
                            widthCtrl.text =
                                match.standardWidthCm?.toString() ?? '';
                            stdWeight = match.standardWeightG ?? stdWeight;
                            final q = int.tryParse(qtyCtrl.text) ?? 0;
                            if (q > 0 && stdWeight != null) {
                              weightCtrl.text =
                                  (q * stdWeight!).round().toString();
                            }
                            fabricDisplayName = match.name;
                          }
                        });
                      },
                    ),
                    const SizedBox(height: 10),
                    DropdownButtonFormField<int?>(
                      initialValue: selectedDesignId,
                      decoration: const InputDecoration(labelText: 'Design'),
                      items: [
                        const DropdownMenuItem<int?>(
                          value: null,
                          child: Text('None'),
                        ),
                        ...designsList.map(
                          (design) => DropdownMenuItem<int?>(
                            value: design.designId,
                            child: Text(design.name),
                          ),
                        ),
                      ],
                      onChanged: (value) => setDialogState(() {
                        selectedDesignId = value;
                        selectedVariantId = null;
                      }),
                    ),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        Expanded(
                          child: DropdownButtonFormField<int>(
                            initialValue: selectedWarpId,
                            decoration: const InputDecoration(
                              labelText: 'Warp color',
                            ),
                            items: colorsList
                                .map(
                                  (color) => DropdownMenuItem<int>(
                                    value: color.colorId,
                                    child: Text(color.name),
                                  ),
                                )
                                .toList(),
                            onChanged: (value) {
                              if (value != null) {
                                setDialogState(() {
                                  selectedWarpId = value;
                                  selectedVariantId = null;
                                });
                              }
                            },
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: DropdownButtonFormField<int>(
                            initialValue: selectedWeftId,
                            decoration: const InputDecoration(
                              labelText: 'Weft color',
                            ),
                            items: colorsList
                                .map(
                                  (color) => DropdownMenuItem<int>(
                                    value: color.colorId,
                                    child: Text(color.name),
                                  ),
                                )
                                .toList(),
                            onChanged: (value) {
                              if (value != null) {
                                setDialogState(() {
                                  selectedWeftId = value;
                                  selectedVariantId = null;
                                });
                              }
                            },
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                  ],

                  const SizedBox(height: 6),
                  TextField(
                    controller: qtyCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Quantity Returned (Pieces / ቁራጭ)',
                    ),
                    keyboardType: TextInputType.number,
                    onChanged: (val) {
                      final q = int.tryParse(val) ?? 0;
                      if (q > 0 &&
                          (weightCtrl.text.isEmpty ||
                              weightCtrl.text == '0')) {
                        final w = stdWeight ?? 64.0;
                        setDialogState(() {
                          weightCtrl.text = (q * w).round().toString();
                        });
                      }
                    },
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: lengthCtrl,
                          decoration: const InputDecoration(
                            labelText: 'Length (cm)',
                          ),
                          keyboardType: TextInputType.number,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: TextField(
                          controller: widthCtrl,
                          decoration: const InputDecoration(
                            labelText: 'Width (cm)',
                          ),
                          keyboardType: TextInputType.number,
                        ),
                      ),
                    ],
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
                  const SizedBox(height: 12),
                  SwitchListTile(
                    title: const Text('Defective Return (ጉድለት ያለበት)'),
                    subtitle: const Text('Apply quality penalty deduction'),
                    value: isDefective,
                    onChanged: (val) => setDialogState(() => isDefective = val),
                    contentPadding: EdgeInsets.zero,
                  ),
                  if (isDefective) ...[
                    const SizedBox(height: 8),
                    TextField(
                      controller: defectReasonCtrl,
                      decoration: const InputDecoration(
                        labelText: 'Defect Reason / የጉድለት አይነት',
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: deductionCtrl,
                      decoration: const InputDecoration(
                        labelText: 'Deduction Amount (ETB) / ቅጣት',
                      ),
                      keyboardType: TextInputType.number,
                    ),
                  ],
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
                  if (qty <= 0 || weight <= 0 || price <= 0) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Complete all required return fields.'),
                      ),
                    );
                    return;
                  }
                  context.read<WorkOrdersBloc>().add(
                    AddFabricReturnSubmitted(
                      zigId: widget.zigId,
                      fabricVariantId: selectedVariantId,
                      fabricId: selectedProductId,
                      warpColorId: selectedWarpId,
                      weftColorId: selectedWeftId,
                      designId: selectedDesignId,
                      quantityReturned: qty,
                      totalWeight: weight,
                      unitPrice: price,
                      lengthCm: double.tryParse(lengthCtrl.text),
                      widthCm: double.tryParse(widthCtrl.text),
                      remark: remarkCtrl.text.isNotEmpty
                          ? remarkCtrl.text
                          : null,
                      isDefective: isDefective,
                      deductionAmount: isDefective
                          ? double.tryParse(deductionCtrl.text)
                          : null,
                      defectReason:
                          isDefective && defectReasonCtrl.text.isNotEmpty
                          ? defectReasonCtrl.text
                          : null,
                    ),
                  );
                  Navigator.pop(ctx);
                },
                child: const Text('Record Return'),
              ),
            ],
          ),
        );
      },
    );
  }

  void _showRecordYarnReturnDialog(WorkOrderDetailEntity detail) {
    if (detail.yarnGiven.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No yarn has been issued to this zig.')),
      );
      return;
    }

    final issuedVariants = <int, YarnGivenItemEntity>{};
    for (final yg in detail.yarnGiven) {
      if (yg.yarnVariantId > 0) {
        issuedVariants[yg.yarnVariantId] = yg;
      }
    }

    int selectedVariantId = issuedVariants.keys.isNotEmpty
        ? issuedVariants.keys.first
        : detail.yarnGiven.first.yarnVariantId;
    final qtyCtrl = TextEditingController();
    final remarkCtrl = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (dialogCtx, setDialogState) {
            return AlertDialog(
              title: const Text('Return Unused Yarn (የቀረ ክር መመለስ)'),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (issuedVariants.isNotEmpty)
                      DropdownButtonFormField<int>(
                        initialValue: selectedVariantId,
                        decoration: const InputDecoration(
                          labelText: 'Issued Yarn Variant',
                        ),
                        items: issuedVariants.values.map((yg) {
                          return DropdownMenuItem<int>(
                            value: yg.yarnVariantId,
                            child: Text(
                              '${yg.yarnMaterial} (${yg.yarnColor}) · ${yg.yarnSku}',
                            ),
                          );
                        }).toList(),
                        onChanged: (val) {
                          if (val != null) {
                            setDialogState(() => selectedVariantId = val);
                          }
                        },
                      ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: qtyCtrl,
                      decoration: const InputDecoration(
                        labelText: 'Returned Quantity (pieces)',
                        hintText: 'e.g. 2',
                      ),
                      keyboardType: TextInputType.number,
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: remarkCtrl,
                      decoration: const InputDecoration(
                        labelText: 'Remark (optional)',
                        hintText: 'e.g. Leftover warp yarn',
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
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.warning,
                  ),
                  onPressed: () {
                    final qty = int.tryParse(qtyCtrl.text) ?? 0;
                    if (qty <= 0) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text(
                            'Please enter a valid positive quantity.',
                          ),
                        ),
                      );
                      return;
                    }
                    context.read<WorkOrdersBloc>().add(
                      RecordYarnReturnSubmitted(
                        zigId: widget.zigId,
                        yarnVariantId: selectedVariantId,
                        quantity: qty.toDouble(),
                        remark: remarkCtrl.text.trim().isNotEmpty
                            ? remarkCtrl.text.trim()
                            : null,
                      ),
                    );
                    Navigator.pop(ctx);
                  },
                  child: const Text('Record Yarn Return'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  void _showRecordFabricReturnToWeaverDialog(WorkOrderDetailEntity detail) {
    final qtyCtrl = TextEditingController();
    final remarkCtrl = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) {
        return AlertDialog(
          title: const Text('Return Defective Fabric to Weaver'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text(
                  'Record rejected fabric pieces returned to the artisan prior to settlement. These will be excluded from the settlement payment.',
                  style: TextStyle(
                    fontSize: 12.5,
                    color: AppColors.textSecondary,
                  ),
                ),
                const SizedBox(height: 14),
                TextField(
                  controller: qtyCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Rejected Quantity (Pieces / ቁራጭ)',
                    hintText: 'e.g. 2',
                  ),
                  keyboardType: TextInputType.number,
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: remarkCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Rejection Reason / Remark',
                    hintText: 'e.g. Uneven tension, damaged border',
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
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.danger,
              ),
              onPressed: () {
                final qty = int.tryParse(qtyCtrl.text) ?? 0;
                if (qty <= 0) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text(
                        'Please enter a valid positive number of pieces.',
                      ),
                    ),
                  );
                  return;
                }
                context.read<WorkOrdersBloc>().add(
                  RecordFabricReturnToWeaverSubmitted(
                    zigId: widget.zigId,
                    fabricVariantId: detail.fabricVariantId,
                    quantity: qty,
                    remark: remarkCtrl.text.trim().isNotEmpty
                        ? remarkCtrl.text.trim()
                        : null,
                  ),
                );
                Navigator.pop(ctx);
              },
              child: const Text('Record Defective Return'),
            ),
          ],
        );
      },
    );
  }

  void _confirmMarkReturned(WorkOrderDetailEntity detail) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Mark as Returned / ተመላሽ አድርግ'),
        content: Text(
          'Mark Zig #${detail.zigId} as returned and ready for HISAB settlement?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.success),
            onPressed: () {
              Navigator.pop(ctx);
              context.read<WorkOrdersBloc>().add(
                MarkWorkOrderReturnedSubmitted(detail.zigId),
              );
            },
            child: const Text('Confirm Returned'),
          ),
        ],
      ),
    );
  }

  void _confirmCancelZig(WorkOrderDetailEntity detail) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Cancel Work Order / የስራ ትዕዛዝ ሰርዝ'),
        content: Text(
          'Are you sure you want to cancel Zig #${detail.zigId}? This action will mark the work order as cancelled.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Close'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.danger),
            onPressed: () {
              Navigator.pop(ctx);
              context.read<WorkOrdersBloc>().add(
                CancelWorkOrderSubmitted(detail.zigId),
              );
            },
            child: const Text('Cancel Zig'),
          ),
        ],
      ),
    );
  }

  void _showChangeStatusDialog(String currentStatus) {
    const statuses = [
      'assigned',
      'in_progress',
      'returned',
      'reconciled',
      'cancelled',
    ];

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
                        fontWeight: s == currentStatus
                            ? FontWeight.w700
                            : FontWeight.w500,
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
              context.read<WorkOrdersBloc>().add(
                LoadWorkOrderDetail(widget.zigId),
              );
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
          if (state.status == WorkOrdersStatus.error &&
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
                // Status and metadata
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
                                  const Icon(
                                    Icons.edit,
                                    size: 14,
                                    color: AppColors.textMuted,
                                  ),
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
                                fontSize: 13,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                            Text(
                              'Date: ${Formatters.date(detail.dateIssued)}',
                              style: const TextStyle(
                                fontSize: 12.5,
                                color: AppColors.textMuted,
                              ),
                            ),
                          ],
                        ),

                        // Lifecycle Action Buttons (Mark Returned / Cancel)
                        if (detail.canMarkReturned || detail.canCancel) ...[
                          const SizedBox(height: 14),
                          Row(
                            children: [
                              if (detail.canMarkReturned)
                                Expanded(
                                  child: ElevatedButton.icon(
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: AppColors.success,
                                      padding: const EdgeInsets.symmetric(
                                        vertical: 8,
                                      ),
                                    ),
                                    icon: const Icon(
                                      Icons.check_circle_outline,
                                      size: 16,
                                    ),
                                    label: const Text(
                                      'Mark Returned',
                                      style: TextStyle(fontSize: 12),
                                    ),
                                    onPressed: () =>
                                        _confirmMarkReturned(detail),
                                  ),
                                ),
                              if (detail.canMarkReturned && detail.canCancel)
                                const SizedBox(width: 8),
                              if (detail.canCancel)
                                OutlinedButton.icon(
                                  style: OutlinedButton.styleFrom(
                                    foregroundColor: AppColors.danger,
                                    side: const BorderSide(
                                      color: AppColors.danger,
                                    ),
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 12,
                                      vertical: 8,
                                    ),
                                  ),
                                  icon: const Icon(
                                    Icons.cancel_outlined,
                                    size: 16,
                                  ),
                                  label: const Text(
                                    'Cancel Zig',
                                    style: TextStyle(fontSize: 12),
                                  ),
                                  onPressed: () => _confirmCancelZig(detail),
                                ),
                            ],
                          ),
                        ],
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 16),

                // Financial overview
                Row(
                  children: [
                    Expanded(
                      child: StatCard(
                        title: 'Fabric Credit',
                        value: Formatters.currency(detail.totalFabricCredit),
                        subtitle:
                            '${detail.totalFabricQuantity} pieces returned',
                        icon: Icons.check_circle_outline,
                        color: AppColors.success,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: StatCard(
                        title: 'Yarn Cost (ክር)',
                        value: Formatters.currency(detail.totalYarnCost),
                        subtitle: '${detail.totalYarnQuantity} pieces assigned',
                        icon: Icons.grain,
                        color: AppColors.danger,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                StatCard(
                  title: 'Net Profit (የተጣራ ትርፍ)',
                  value: Formatters.currency(detail.netProfit),
                  subtitle: 'Fabric Credit - Yarn Cost',
                  icon: Icons.account_balance_wallet_outlined,
                  color: AppColors.adminPrimary,
                ),

                const SizedBox(height: 20),

                // Operational actions
                BlocBuilder<StockBloc, StockState>(
                  builder: (context, stockState) {
                    final lookup = stockState.lookup;
                    return Column(
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: ElevatedButton.icon(
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppColors.adminPrimary,
                                ),
                                icon: const Icon(Icons.add, size: 18),
                                label: const Text('Add Yarn'),
                                onPressed: () {
                                  if (lookup == null) {
                                    context.read<StockBloc>().add(LoadStockAndCatalog());
                                  }
                                  final effectiveLookup = lookup ??
                                      const CatalogLookupEntity(
                                        colors: [],
                                        products: [],
                                        designs: [],
                                        suppliers: [],
                                        yarnTypes: [],
                                      );
                                  _showAddYarnDialog(effectiveLookup);
                                },
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
                                onPressed: () {
                                  if (lookup == null) {
                                    context.read<StockBloc>().add(LoadStockAndCatalog());
                                  }
                                  final effectiveLookup = lookup ??
                                      const CatalogLookupEntity(
                                        colors: [],
                                        products: [],
                                        designs: [],
                                        suppliers: [],
                                        yarnTypes: [],
                                      );
                                  _showAddReturnDialog(
                                    effectiveLookup,
                                    stockState.fabricVariants,
                                  );
                                },
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            Expanded(
                              child: OutlinedButton.icon(
                                style: OutlinedButton.styleFrom(
                                  foregroundColor: AppColors.warning,
                                  side: const BorderSide(
                                    color: AppColors.warning,
                                  ),
                                ),
                                icon: const Icon(Icons.undo, size: 16),
                                label: const Text(
                                  'Return Unused Yarn',
                                  style: TextStyle(fontSize: 12),
                                ),
                                onPressed: () =>
                                    _showRecordYarnReturnDialog(detail),
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: OutlinedButton.icon(
                                style: OutlinedButton.styleFrom(
                                  foregroundColor: AppColors.danger,
                                  side: const BorderSide(
                                    color: AppColors.danger,
                                  ),
                                ),
                                icon: const Icon(
                                  Icons.do_not_disturb_on_outlined,
                                  size: 16,
                                ),
                                label: const Text(
                                  'Reject Defective',
                                  style: TextStyle(fontSize: 12),
                                ),
                                onPressed: () =>
                                    _showRecordFabricReturnToWeaverDialog(
                                      detail,
                                    ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    );
                  },
                ),

                const SizedBox(height: 24),

                // Fabric returns
                SectionHeader(
                  title: 'Fabric Returns (የጨርቅ መመለሻዎች)',
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
                            fontSize: 13,
                            color: AppColors.textMuted,
                          ),
                        ),
                      ),
                    ),
                  )
                else
                  ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: detail.fabricReturns.length,
                    separatorBuilder: (_, _) => const SizedBox(height: 8),
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
                              if (item.lengthCm != null ||
                                  item.widthCm != null) ...[
                                const SizedBox(height: 6),
                                Text(
                                  'Size: ${item.lengthCm?.toStringAsFixed(1) ?? '-'} × '
                                  '${item.widthCm?.toStringAsFixed(1) ?? '-'} cm',
                                  style: const TextStyle(
                                    fontSize: 12.5,
                                    color: AppColors.textSecondary,
                                  ),
                                ),
                              ],
                              if (item.remark != null &&
                                  item.remark!.isNotEmpty) ...[
                                const SizedBox(height: 4),
                                Text(
                                  item.remark!,
                                  style: const TextStyle(
                                    fontSize: 12.5,
                                    color: AppColors.textMuted,
                                  ),
                                ),
                              ],
                              const Divider(height: 16),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.end,
                                children: [
                                  TextButton.icon(
                                    icon: const Icon(
                                      Icons.delete_outline,
                                      size: 16,
                                      color: AppColors.danger,
                                    ),
                                    label: const Text(
                                      'Delete Return',
                                      style: TextStyle(
                                        color: AppColors.danger,
                                        fontSize: 12,
                                      ),
                                    ),
                                    onPressed: () {
                                      showDialog(
                                        context: context,
                                        builder: (dCtx) => AlertDialog(
                                          title: const Text(
                                            'Delete Fabric Return?',
                                          ),
                                          content: Text(
                                            'Remove this return of ${item.quantityReturned} pieces?',
                                          ),
                                          actions: [
                                            TextButton(
                                              onPressed: () =>
                                                  Navigator.pop(dCtx),
                                              child: const Text('Cancel'),
                                            ),
                                            ElevatedButton(
                                              style: ElevatedButton.styleFrom(
                                                backgroundColor:
                                                    AppColors.danger,
                                              ),
                                              onPressed: () {
                                                Navigator.pop(dCtx);
                                                context
                                                    .read<WorkOrdersBloc>()
                                                    .add(
                                                      DeleteFabricReturnSubmitted(
                                                        zigId: widget.zigId,
                                                        id: item.returnId,
                                                      ),
                                                    );
                                              },
                                              child: const Text('Delete'),
                                            ),
                                          ],
                                        ),
                                      );
                                    },
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),

                // Defective fabric returned to the weaver
                if (detail.fabricReturnsToWeaver.isNotEmpty) ...[
                  const SizedBox(height: 20),
                  SectionHeader(
                    title: 'ðŸš« Defective Fabric Returned to Weaver',
                    count: detail.fabricReturnsToWeaver.length,
                  ),
                  ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: detail.fabricReturnsToWeaver.length,
                    separatorBuilder: (_, _) => const SizedBox(height: 8),
                    itemBuilder: (context, index) {
                      final item = detail.fabricReturnsToWeaver[index];
                      return Card(
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                          side: const BorderSide(color: Color(0xFFFECACA)),
                        ),
                        child: Padding(
                          padding: const EdgeInsets.all(12),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    '${item.fabricName} · ${item.designName}',
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w700,
                                      fontSize: 13.5,
                                    ),
                                  ),
                                  Text(
                                    '${item.quantity} pcs rejected',
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w700,
                                      color: AppColors.danger,
                                      fontSize: 13,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'Returned on ${Formatters.date(item.dateReturned)}',
                                style: const TextStyle(
                                  fontSize: 11.5,
                                  color: AppColors.textMuted,
                                ),
                              ),
                              if (item.remark != null &&
                                  item.remark!.isNotEmpty) ...[
                                const SizedBox(height: 4),
                                Text(
                                  'Reason: ${item.remark}',
                                  style: const TextStyle(
                                    fontSize: 12,
                                    fontStyle: FontStyle.italic,
                                    color: AppColors.danger,
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ],

                const SizedBox(height: 20),

                // Yarn deliveries
                SectionHeader(
                  title: 'Yarn Deliveries (የተሰጠ ክር)',
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
                            fontSize: 13,
                            color: AppColors.textMuted,
                          ),
                        ),
                      ),
                    ),
                  )
                else
                  ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: detail.yarnGiven.length,
                    separatorBuilder: (_, _) => const SizedBox(height: 8),
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
                                    '${item.quantity} pieces @ ${item.unitPrice.round()} ETB/piece',
                                    style: const TextStyle(
                                      fontSize: 12,
                                      color: AppColors.textSecondary,
                                    ),
                                  ),
                                ],
                              ),
                              Row(
                                children: [
                                  Text(
                                    Formatters.currency(item.totalCost),
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w700,
                                      fontSize: 14,
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  IconButton(
                                    icon: const Icon(
                                      Icons.delete_outline,
                                      size: 18,
                                      color: AppColors.danger,
                                    ),
                                    tooltip: 'Delete Yarn Delivery',
                                    onPressed: () {
                                      showDialog(
                                        context: context,
                                        builder: (dCtx) => AlertDialog(
                                          title: const Text(
                                            'Delete Yarn Delivery?',
                                          ),
                                          content: Text(
                                            'Remove delivery of ${item.quantity} pieces?',
                                          ),
                                          actions: [
                                            TextButton(
                                              onPressed: () =>
                                                  Navigator.pop(dCtx),
                                              child: const Text('Cancel'),
                                            ),
                                            ElevatedButton(
                                              style: ElevatedButton.styleFrom(
                                                backgroundColor:
                                                    AppColors.danger,
                                              ),
                                              onPressed: () {
                                                Navigator.pop(dCtx);
                                                context
                                                    .read<WorkOrdersBloc>()
                                                    .add(
                                                      DeleteYarnGivenSubmitted(
                                                        zigId: widget.zigId,
                                                        id: item.yarnGivenId,
                                                      ),
                                                    );
                                              },
                                              child: const Text('Delete'),
                                            ),
                                          ],
                                        ),
                                      );
                                    },
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),

                // Unused yarn returns
                if (detail.yarnReturns.isNotEmpty) ...[
                  const SizedBox(height: 20),
                  SectionHeader(
                    title: 'Unused Yarn Returns (የተመለሰ ክር)',
                    count: detail.yarnReturns.length,
                  ),
                  ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: detail.yarnReturns.length,
                    separatorBuilder: (_, _) => const SizedBox(height: 8),
                    itemBuilder: (context, index) {
                      final item = detail.yarnReturns[index];
                      return Card(
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                          side: const BorderSide(color: Color(0xFFFED7AA)),
                        ),
                        child: Padding(
                          padding: const EdgeInsets.all(12),
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
                                      fontSize: 13,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    'Returned on ${Formatters.date(item.dateReturned)}',
                                    style: const TextStyle(
                                      fontSize: 11.5,
                                      color: AppColors.textMuted,
                                    ),
                                  ),
                                  if (item.remark != null &&
                                      item.remark!.isNotEmpty) ...[
                                    const SizedBox(height: 2),
                                    Text(
                                      item.remark!,
                                      style: const TextStyle(
                                        fontSize: 11.5,
                                        fontStyle: FontStyle.italic,
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                              Text(
                                '${item.quantity} pieces returned',
                                style: const TextStyle(
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.warning,
                                  fontSize: 13,
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ],
              ],
            ),
          );
        },
      ),
    );
  }
}
