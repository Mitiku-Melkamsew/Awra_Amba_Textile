import 'package:flutter/material.dart';
import '../../../products/domain/entities/product_entity.dart';

class FabricSelectionResult {
  final FabricVariantEntity? variant;
  final int? fabricId;
  final int? warpColorId;
  final int? weftColorId;
  final int? designId;
  final String displayName;
  final double? weaverRate;

  FabricSelectionResult({
    this.variant,
    this.fabricId,
    this.warpColorId,
    this.weftColorId,
    this.designId,
    required this.displayName,
    this.weaverRate,
  });
}

class FabricSelectionSheet extends StatefulWidget {
  final List<FabricVariantEntity> fabricVariants;
  final CatalogLookupEntity lookup;
  final int? currentVariantId;

  const FabricSelectionSheet({
    super.key,
    required this.fabricVariants,
    required this.lookup,
    this.currentVariantId,
  });

  static Future<FabricSelectionResult?> show(
    BuildContext context, {
    required List<FabricVariantEntity> fabricVariants,
    required CatalogLookupEntity lookup,
    int? currentVariantId,
  }) {
    return showModalBottomSheet<FabricSelectionResult>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => FabricSelectionSheet(
        fabricVariants: fabricVariants,
        lookup: lookup,
        currentVariantId: currentVariantId,
      ),
    );
  }

  @override
  State<FabricSelectionSheet> createState() => _FabricSelectionSheetState();
}

class _FabricSelectionSheetState extends State<FabricSelectionSheet> {
  final _searchController = TextEditingController();
  String _searchQuery = '';

  FabricVariantEntity? _selectedVariant;
  ProductEntity? _selectedProduct;
  NamedColorEntity? _selectedWarpColor;
  NamedColorEntity? _selectedWeftColor;
  DesignEntity? _selectedDesign;

  @override
  void initState() {
    super.initState();
    if (widget.currentVariantId != null) {
      final match = widget.fabricVariants
          .where((v) => v.fabricVariantId == widget.currentVariantId)
          .firstOrNull;
      if (match != null) {
        _selectedVariant = match;
        _selectedProduct = match.product;
        _selectedWarpColor = match.warpColor;
        _selectedWeftColor = match.weftColor;
        _selectedDesign = match.design;
      }
    }

    final fabricProducts = widget.lookup.products
        .where((p) => p.category == 'fabric' || p.category.isEmpty)
        .toList();

    // Match by ID to avoid reference/Equatable field discrepancies
    if (_selectedProduct != null) {
      final found = fabricProducts
          .where((p) => p.productId == _selectedProduct!.productId)
          .firstOrNull;
      if (found != null) _selectedProduct = found;
    }
    _selectedProduct ??= fabricProducts.isNotEmpty
        ? fabricProducts.first
        : widget.lookup.products.firstOrNull;

    if (_selectedWarpColor != null) {
      final found = widget.lookup.colors
          .where((c) => c.colorId == _selectedWarpColor!.colorId)
          .firstOrNull;
      if (found != null) _selectedWarpColor = found;
    }
    _selectedWarpColor ??= widget.lookup.colors.firstOrNull;

    if (_selectedWeftColor != null) {
      final found = widget.lookup.colors
          .where((c) => c.colorId == _selectedWeftColor!.colorId)
          .firstOrNull;
      if (found != null) _selectedWeftColor = found;
    }
    _selectedWeftColor ??= widget.lookup.colors.firstOrNull;

    if (_selectedDesign != null) {
      final found = widget.lookup.designs
          .where((d) => d.designId == _selectedDesign!.designId)
          .firstOrNull;
      if (found != null) _selectedDesign = found;
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  String _formatVariantLabel(FabricVariantEntity v) {
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

  List<FabricVariantEntity> get _filteredVariants {
    if (_searchQuery.trim().isEmpty) {
      return widget.fabricVariants.take(8).toList();
    }
    final q = _searchQuery.toLowerCase().trim();
    return widget.fabricVariants.where((v) {
      final label = _formatVariantLabel(v).toLowerCase();
      final sku = v.sku.toLowerCase();
      return label.contains(q) || sku.contains(q);
    }).toList();
  }

  List<FabricVariantEntity> get _recentlyUsedVariants {
    return widget.fabricVariants.take(3).toList();
  }

  void _applySelection() {
    if (_selectedVariant != null) {
      Navigator.pop(
        context,
        FabricSelectionResult(
          variant: _selectedVariant,
          fabricId: _selectedVariant!.product?.productId,
          warpColorId: _selectedVariant!.warpColor?.colorId,
          weftColorId: _selectedVariant!.weftColor?.colorId,
          designId: _selectedVariant!.design?.designId,
          displayName: _formatVariantLabel(_selectedVariant!),
          weaverRate: _selectedVariant!.basePrice,
        ),
      );
      return;
    }

    if (_selectedProduct != null) {
      final matched = widget.fabricVariants.where((v) {
        return v.product?.productId == _selectedProduct!.productId &&
            v.warpColor?.colorId == _selectedWarpColor?.colorId &&
            v.weftColor?.colorId == _selectedWeftColor?.colorId &&
            v.design?.designId == _selectedDesign?.designId;
      }).firstOrNull;

      final label = [
        _selectedProduct!.name,
        _selectedWarpColor?.name ?? '',
        _selectedWeftColor?.name ?? '',
        _selectedDesign?.name ?? '',
      ].where((s) => s.isNotEmpty).join(' · ');

      Navigator.pop(
        context,
        FabricSelectionResult(
          variant: matched,
          fabricId: _selectedProduct!.productId,
          warpColorId: _selectedWarpColor?.colorId,
          weftColorId: _selectedWeftColor?.colorId,
          designId: _selectedDesign?.designId,
          displayName: label,
          weaverRate: matched?.basePrice ?? _selectedProduct!.basePrice,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    // Deduplicate fabric products and ensure selected product is included
    final Set<int> seenProductIds = {};
    final fabricProducts = <ProductEntity>[];
    for (final p in widget.lookup.products) {
      if ((p.category == 'fabric' || p.category.isEmpty) && seenProductIds.add(p.productId)) {
        fabricProducts.add(p);
      }
    }
    if (_selectedProduct != null && seenProductIds.add(_selectedProduct!.productId)) {
      fabricProducts.insert(0, _selectedProduct!);
    }
    if (fabricProducts.isEmpty && _selectedProduct == null) {
      fabricProducts.add(const ProductEntity(productId: 1, name: 'Medebegna', category: 'fabric', basePrice: 120.0));
      _selectedProduct = fabricProducts.first;
    }

    // Deduplicate designs and ensure selected design is included
    final Set<int> seenDesignIds = {};
    final designsList = <DesignEntity>[];
    for (final d in widget.lookup.designs) {
      if (seenDesignIds.add(d.designId)) {
        designsList.add(d);
      }
    }
    if (_selectedDesign != null && seenDesignIds.add(_selectedDesign!.designId)) {
      designsList.insert(0, _selectedDesign!);
    }

    // Deduplicate colors and ensure selected warp and weft are included
    final Set<int> seenColorIds = {};
    final colorsList = <NamedColorEntity>[];
    for (final c in widget.lookup.colors) {
      if (seenColorIds.add(c.colorId)) {
        colorsList.add(c);
      }
    }
    if (colorsList.isEmpty) {
      colorsList.add(const NamedColorEntity(colorId: 1, colorCode: '#FFFFFF', name: 'White'));
      seenColorIds.add(1);
    }
    if (_selectedWarpColor != null && seenColorIds.add(_selectedWarpColor!.colorId)) {
      colorsList.add(_selectedWarpColor!);
    }
    if (_selectedWeftColor != null && seenColorIds.add(_selectedWeftColor!.colorId)) {
      colorsList.add(_selectedWeftColor!);
    }

    return DraggableScrollableSheet(
      initialChildSize: 0.88,
      minChildSize: 0.5,
      maxChildSize: 0.96,
      builder: (_, scrollController) {
        return Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: Column(
            children: [
              // Drag Handle
              Center(
                child: Container(
                  margin: const EdgeInsets.only(top: 10, bottom: 6),
                  width: 44,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),

              // Modal Header (Image 1)
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 8, 20, 14),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Record fabric return',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF0F172A),
                      ),
                    ),
                    Text(
                      'Changing fabric',
                      style: TextStyle(
                        fontSize: 13,
                        color: Colors.grey.shade500,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
              const Divider(height: 1, color: Color(0xFFE2E8F0)),

              Expanded(
                child: ListView(
                  controller: scrollController,
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
                  children: [
                    // Search Bar (Image 1)
                    Text(
                      'Find an existing fabric',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: Colors.grey.shade700,
                      ),
                    ),
                    const SizedBox(height: 6),
                    TextField(
                      controller: _searchController,
                      onChanged: (val) => setState(() => _searchQuery = val),
                      decoration: InputDecoration(
                        hintText: 'biret geberdin',
                        prefixIcon: const Icon(Icons.search, size: 20),
                        suffixIcon: _searchQuery.isNotEmpty
                            ? IconButton(
                                icon: const Icon(Icons.clear, size: 18),
                                onPressed: () {
                                  _searchController.clear();
                                  setState(() => _searchQuery = '');
                                },
                              )
                            : null,
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 14,
                          vertical: 12,
                        ),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                          borderSide: const BorderSide(color: Color(0xFFFED7AA)),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                          borderSide: const BorderSide(
                            color: Color(0xFFEA580C),
                            width: 1.5,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 14),

                    // Filtered Fabric Variant Results (Image 1)
                    if (_filteredVariants.isNotEmpty)
                      Container(
                        decoration: BoxDecoration(
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Column(
                          children: _filteredVariants.map((v) {
                            final isCurrent =
                                v.fabricVariantId == widget.currentVariantId;
                            final isSelected =
                                _selectedVariant?.fabricVariantId ==
                                    v.fabricVariantId;

                            return InkWell(
                              onTap: () {
                                setState(() {
                                  _selectedVariant = v;
                                  _selectedProduct = v.product;
                                  _selectedWarpColor = v.warpColor;
                                  _selectedWeftColor = v.weftColor;
                                  _selectedDesign = v.design;
                                });
                              },
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 14,
                                  vertical: 12,
                                ),
                                decoration: BoxDecoration(
                                  color: isSelected
                                      ? const Color(0xFFFFF7ED)
                                      : Colors.transparent,
                                  border: Border(
                                    bottom: BorderSide(
                                      color: Colors.grey.shade200,
                                    ),
                                  ),
                                ),
                                child: Row(
                                  children: [
                                    Expanded(
                                      child: Text(
                                        _formatVariantLabel(v),
                                        style: TextStyle(
                                          fontSize: 14,
                                          fontWeight: isSelected
                                              ? FontWeight.w700
                                              : FontWeight.w500,
                                          color: isSelected
                                              ? const Color(0xFF9A3412)
                                              : const Color(0xFF1E293B),
                                        ),
                                      ),
                                    ),
                                    if (isCurrent)
                                      Container(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 8,
                                          vertical: 3,
                                        ),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFFDCFCE7),
                                          borderRadius:
                                              BorderRadius.circular(12),
                                          border: Border.all(
                                            color: const Color(0xFF86EFAC),
                                          ),
                                        ),
                                        child: const Text(
                                          'Current',
                                          style: TextStyle(
                                            color: Color(0xFF166534),
                                            fontSize: 11,
                                            fontWeight: FontWeight.w700,
                                          ),
                                        ),
                                      ),
                                  ],
                                ),
                              ),
                            );
                          }).toList(),
                        ),
                      ),
                    const SizedBox(height: 16),

                    // Recently Used Pills (Image 1)
                    if (_recentlyUsedVariants.isNotEmpty) ...[
                      Row(
                        children: [
                          Text(
                            'Recently used',
                            style: TextStyle(
                              fontSize: 12.5,
                              fontWeight: FontWeight.w600,
                              color: Colors.grey.shade600,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: SingleChildScrollView(
                              scrollDirection: Axis.horizontal,
                              child: Row(
                                children: _recentlyUsedVariants.map((v) {
                                  return Padding(
                                    padding: const EdgeInsets.only(right: 6),
                                    child: ActionChip(
                                      label: Text(
                                        _formatVariantLabel(v),
                                        style: const TextStyle(
                                          fontSize: 11.5,
                                          color: Color(0xFF334155),
                                        ),
                                      ),
                                      backgroundColor: const Color(0xFFF8FAFC),
                                      side: const BorderSide(
                                        color: Color(0xFFCBD5E1),
                                      ),
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(16),
                                      ),
                                      onPressed: () {
                                        setState(() {
                                          _selectedVariant = v;
                                          _selectedProduct = v.product;
                                          _selectedWarpColor = v.warpColor;
                                          _selectedWeftColor = v.weftColor;
                                          _selectedDesign = v.design;
                                        });
                                      },
                                    ),
                                  );
                                }).toList(),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),
                    ],

                    // Not in the list? Describe it divider (Image 1)
                    Row(
                      children: [
                        const Expanded(child: Divider()),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 10),
                          child: Text(
                            'Not in the list? Describe it',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: Colors.grey.shade500,
                            ),
                          ),
                        ),
                        const Expanded(child: Divider()),
                      ],
                    ),
                    const SizedBox(height: 14),

                    // 2x2 Grid (Image 1)
                    Row(
                      children: [
                        // Fabric Type
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Fabric type',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                  color: Color(0xFF475569),
                                ),
                              ),
                              const SizedBox(height: 4),
                              DropdownButtonFormField<int>(
                                initialValue: _selectedProduct?.productId,
                                isExpanded: true,
                                decoration: InputDecoration(
                                  contentPadding: const EdgeInsets.symmetric(
                                    horizontal: 10,
                                    vertical: 8,
                                  ),
                                  border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                ),
                                items: fabricProducts
                                    .map(
                                      (p) => DropdownMenuItem<int>(
                                        value: p.productId,
                                        child: Text(
                                          p.name,
                                          overflow: TextOverflow.ellipsis,
                                          style: const TextStyle(fontSize: 13),
                                        ),
                                      ),
                                    )
                                    .toList(),
                                onChanged: (val) {
                                  if (val == null) return;
                                  final match = fabricProducts.where((p) => p.productId == val).firstOrNull;
                                  setState(() {
                                    _selectedProduct = match;
                                    _selectedVariant = null;
                                  });
                                },
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 12),
                        // Design
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Design',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                  color: Color(0xFF475569),
                                ),
                              ),
                              const SizedBox(height: 4),
                              DropdownButtonFormField<int?>(
                                initialValue: _selectedDesign?.designId,
                                isExpanded: true,
                                decoration: InputDecoration(
                                  contentPadding: const EdgeInsets.symmetric(
                                    horizontal: 10,
                                    vertical: 8,
                                  ),
                                  border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                ),
                                items: [
                                  const DropdownMenuItem<int?>(
                                    value: null,
                                    child: Text(
                                      'None',
                                      overflow: TextOverflow.ellipsis,
                                      style: TextStyle(fontSize: 13, color: Color(0xFF64748B)),
                                    ),
                                  ),
                                  ...designsList.map(
                                    (d) => DropdownMenuItem<int?>(
                                      value: d.designId,
                                      child: Text(
                                        d.name,
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(fontSize: 13),
                                      ),
                                    ),
                                  ),
                                ],
                                onChanged: (val) {
                                  setState(() {
                                    _selectedDesign = val != null
                                        ? designsList.where((d) => d.designId == val).firstOrNull
                                        : null;
                                    _selectedVariant = null;
                                  });
                                },
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    Row(
                      children: [
                        // Warp Color
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Warp color',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                  color: Color(0xFF475569),
                                ),
                              ),
                              const SizedBox(height: 4),
                              DropdownButtonFormField<int>(
                                initialValue: _selectedWarpColor?.colorId ?? colorsList.first.colorId,
                                isExpanded: true,
                                decoration: InputDecoration(
                                  contentPadding: const EdgeInsets.symmetric(
                                    horizontal: 10,
                                    vertical: 8,
                                  ),
                                  border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                ),
                                items: colorsList
                                    .map(
                                      (c) => DropdownMenuItem<int>(
                                        value: c.colorId,
                                        child: Text(
                                          c.name,
                                          overflow: TextOverflow.ellipsis,
                                          style: const TextStyle(fontSize: 13),
                                        ),
                                      ),
                                    )
                                    .toList(),
                                onChanged: (val) {
                                  if (val == null) return;
                                  final match = colorsList.where((c) => c.colorId == val).firstOrNull;
                                  setState(() {
                                    _selectedWarpColor = match;
                                    _selectedVariant = null;
                                  });
                                },
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 12),
                        // Weft Color
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Weft color',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                  color: Color(0xFF475569),
                                ),
                              ),
                              const SizedBox(height: 4),
                              DropdownButtonFormField<int>(
                                initialValue: _selectedWeftColor?.colorId ?? colorsList.first.colorId,
                                isExpanded: true,
                                decoration: InputDecoration(
                                  contentPadding: const EdgeInsets.symmetric(
                                    horizontal: 10,
                                    vertical: 8,
                                  ),
                                  border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                ),
                                items: colorsList
                                    .map(
                                      (c) => DropdownMenuItem<int>(
                                        value: c.colorId,
                                        child: Text(
                                          c.name,
                                          overflow: TextOverflow.ellipsis,
                                          style: const TextStyle(fontSize: 13),
                                        ),
                                      ),
                                    )
                                    .toList(),
                                onChanged: (val) {
                                  if (val == null) return;
                                  final match = colorsList.where((c) => c.colorId == val).firstOrNull;
                                  setState(() {
                                    _selectedWeftColor = match;
                                    _selectedVariant = null;
                                  });
                                },
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    // Helper Note (Image 1)
                    Text(
                      'If this combination does not exist yet, a new fabric type is created when you save.',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey.shade600,
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Action Buttons (Image 1)
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton(
                            onPressed: () => Navigator.pop(context),
                            style: OutlinedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              side: const BorderSide(color: Color(0xFFCBD5E1)),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8),
                              ),
                            ),
                            child: const Text(
                              'Cancel',
                              style: TextStyle(
                                color: Color(0xFF334155),
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: ElevatedButton(
                            onPressed: _applySelection,
                            style: ElevatedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              backgroundColor: const Color(0xFFC2410C),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8),
                              ),
                            ),
                            child: const Text(
                              'Use this fabric',
                              style: TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
