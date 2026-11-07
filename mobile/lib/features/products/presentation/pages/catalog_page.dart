import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/constants/app_colors.dart';
import '../../domain/entities/product_entity.dart';
import '../../domain/repositories/products_repository.dart';
import '../blocs/stock_bloc.dart';
import '../blocs/stock_event.dart';
import '../blocs/stock_state.dart';

enum _CatalogTab {
  products,
  colors,
  designs,
  yarnTypes,
  suppliers,
  fabric,
  yarn,
}

class CatalogPage extends StatefulWidget {
  const CatalogPage({super.key});

  @override
  State<CatalogPage> createState() => _CatalogPageState();
}

class _CatalogPageState extends State<CatalogPage> {
  _CatalogTab tab = _CatalogTab.products;

  String get resource {
    switch (tab) {
      case _CatalogTab.products:
        return 'products';
      case _CatalogTab.colors:
        return 'colors';
      case _CatalogTab.designs:
        return 'designs';
      case _CatalogTab.yarnTypes:
        return 'yarn-types';
      case _CatalogTab.suppliers:
        return 'suppliers';
      case _CatalogTab.fabric:
        return 'fabric-variants';
      case _CatalogTab.yarn:
        return 'yarn-variants';
    }
  }

  String get tabLabel {
    switch (tab) {
      case _CatalogTab.products:
        return 'Products';
      case _CatalogTab.colors:
        return 'Colors';
      case _CatalogTab.designs:
        return 'Designs';
      case _CatalogTab.yarnTypes:
        return 'Yarn types';
      case _CatalogTab.suppliers:
        return 'Suppliers';
      case _CatalogTab.fabric:
        return 'Fabric variants';
      case _CatalogTab.yarn:
        return 'Yarn variants';
    }
  }

  Future<void> _openEditor({Object? item}) async {
    final state = context.read<StockBloc>().state;
    if (state.lookup == null) return;
    final data = await showDialog<Map<String, dynamic>>(
      context: context,
      builder: (_) => _CatalogEditor(
        tab: tab,
        lookup: state.lookup!,
        fabricVariants: state.fabricVariants,
        yarnVariants: state.yarnVariants,
        item: item,
      ),
    );
    if (data == null || !mounted) return;
    try {
      final repository = context.read<ProductsRepository>();
      final id = _itemId(item);
      if (id == null) {
        await repository.createCatalogEntry(resource, data);
      } else {
        await repository.updateCatalogEntry(resource, id, data);
      }
      if (!mounted) return;
      context.read<StockBloc>().add(LoadStockAndCatalog());
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            id == null ? 'Catalog item added.' : 'Catalog item updated.',
          ),
        ),
      );
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(error.toString().replaceAll('Exception: ', '')),
          backgroundColor: AppColors.danger,
        ),
      );
    }
  }

  int? _itemId(Object? item) {
    if (item is ProductEntity) return item.productId;
    if (item is NamedColorEntity) return item.colorId;
    if (item is DesignEntity) return item.designId;
    if (item is YarnTypeEntity) return item.yarnTypeId;
    if (item is SupplierEntity) return item.supplierId;
    if (item is FabricVariantEntity) return item.fabricVariantId;
    if (item is YarnVariantEntity) return item.yarnVariantId;
    return null;
  }

  @override
  void initState() {
    super.initState();
    context.read<StockBloc>().add(LoadStockAndCatalog());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Catalog / ካታሎግ'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () =>
                context.read<StockBloc>().add(LoadStockAndCatalog()),
          ),
        ],
      ),
      body: BlocBuilder<StockBloc, StockState>(
        builder: (context, state) {
          if (state.status == StockStatus.loading && state.lookup == null) {
            return const Center(child: CircularProgressIndicator());
          }
          if (state.lookup == null) {
            return Center(
              child: Text(state.errorMessage ?? 'Catalog unavailable.'),
            );
          }
          return Column(
            children: [
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.fromLTRB(12, 12, 12, 4),
                child: Row(
                  children: _CatalogTab.values
                      .map(
                        (value) => Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: ChoiceChip(
                            label: Text(_labelFor(value)),
                            selected: tab == value,
                            onSelected: (_) => setState(() => tab = value),
                          ),
                        ),
                      )
                      .toList(),
                ),
              ),
              Expanded(
                child: _CatalogList(
                  tab: tab,
                  state: state,
                  onEdit: _openEditor,
                ),
              ),
            ],
          );
        },
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _openEditor(),
        icon: const Icon(Icons.add),
        label: Text('Add $tabLabel'),
      ),
    );
  }

  String _labelFor(_CatalogTab value) {
    switch (value) {
      case _CatalogTab.products:
        return 'Products';
      case _CatalogTab.colors:
        return 'Colors';
      case _CatalogTab.designs:
        return 'Designs';
      case _CatalogTab.yarnTypes:
        return 'Yarn';
      case _CatalogTab.suppliers:
        return 'Suppliers';
      case _CatalogTab.fabric:
        return 'Fabric';
      case _CatalogTab.yarn:
        return 'Yarn variants';
    }
  }
}

class _CatalogList extends StatelessWidget {
  final _CatalogTab tab;
  final StockState state;
  final Future<void> Function({Object? item}) onEdit;

  const _CatalogList({
    required this.tab,
    required this.state,
    required this.onEdit,
  });

  @override
  Widget build(BuildContext context) {
    final lookup = state.lookup!;
    final items = <Object>[];
    switch (tab) {
      case _CatalogTab.products:
        items.addAll(lookup.products.where((p) => p.category == 'fabric'));
      case _CatalogTab.colors:
        items.addAll(lookup.colors);
      case _CatalogTab.designs:
        items.addAll(lookup.designs);
      case _CatalogTab.yarnTypes:
        items.addAll(lookup.yarnTypes);
      case _CatalogTab.suppliers:
        items.addAll(lookup.suppliers);
      case _CatalogTab.fabric:
        items.addAll(state.fabricVariants);
      case _CatalogTab.yarn:
        items.addAll(state.yarnVariants);
    }
    if (items.isEmpty) {
      return const Center(child: Text('No catalog entries found.'));
    }
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: items.length,
      separatorBuilder: (_, _) => const SizedBox(height: 8),
      itemBuilder: (_, index) {
        final item = items[index];
        return Card(
          child: ListTile(
            title: Text(_title(item)),
            subtitle: Text(_subtitle(item)),
            trailing: IconButton(
              icon: const Icon(Icons.edit_outlined),
              tooltip: 'Update',
              onPressed: () => onEdit(item: item),
            ),
          ),
        );
      },
    );
  }

  String _title(Object item) {
    if (item is ProductEntity) return item.name;
    if (item is NamedColorEntity) return item.name;
    if (item is DesignEntity) return item.name;
    if (item is YarnTypeEntity) return item.materialName;
    if (item is SupplierEntity) return item.name;
    if (item is FabricVariantEntity) return item.displayName;
    if (item is YarnVariantEntity) return item.displayName;
    return 'Catalog item';
  }

  String _subtitle(Object item) {
    if (item is ProductEntity) return 'Fabric · ${item.basePrice} ETB';
    if (item is NamedColorEntity) return item.colorCode;
    if (item is SupplierEntity) return item.contactPhone ?? 'Supplier';
    if (item is FabricVariantEntity) {
      return '${item.sku} · ${item.basePrice ?? '-'} ETB';
    }
    if (item is YarnVariantEntity) {
      return '${item.sku} · ${item.basePrice ?? '-'} ETB';
    }
    return '';
  }
}

class _CatalogEditor extends StatefulWidget {
  final _CatalogTab tab;
  final CatalogLookupEntity lookup;
  final List<FabricVariantEntity> fabricVariants;
  final List<YarnVariantEntity> yarnVariants;
  final Object? item;

  const _CatalogEditor({
    required this.tab,
    required this.lookup,
    required this.fabricVariants,
    required this.yarnVariants,
    this.item,
  });

  @override
  State<_CatalogEditor> createState() => _CatalogEditorState();
}

class _CatalogEditorState extends State<_CatalogEditor> {
  late final TextEditingController first;
  late final TextEditingController second;
  late final TextEditingController third;
  late final TextEditingController fourth;
  ProductEntity? product;
  NamedColorEntity? warp;
  NamedColorEntity? weft;
  DesignEntity? design;
  YarnTypeEntity? yarnType;
  NamedColorEntity? color;
  SupplierEntity? supplier;

  bool get isEdit => widget.item != null;

  @override
  void initState() {
    super.initState();
    final item = widget.item;
    first = TextEditingController();
    second = TextEditingController();
    third = TextEditingController();
    fourth = TextEditingController();
    if (item is ProductEntity) {
      first.text = item.name;
      second.text = item.basePrice.toString();
      third.text = item.standardLengthCm?.toString() ?? '';
      fourth.text = item.standardWidthCm?.toString() ?? '';
    } else if (item is NamedColorEntity) {
      first.text = item.colorCode;
      second.text = item.name;
    } else if (item is DesignEntity) {
      first.text = item.name;
    } else if (item is YarnTypeEntity) {
      first.text = item.materialName;
    } else if (item is SupplierEntity) {
      first.text = item.name;
      second.text = item.contactPhone ?? '';
    } else if (item is FabricVariantEntity) {
      product = item.product;
      warp = item.warpColor;
      weft = item.weftColor;
      design = item.design;
      first.text = item.basePrice?.toString() ?? '';
    } else if (item is YarnVariantEntity) {
      yarnType = widget.lookup.yarnTypes
          .where((value) => value.yarnTypeId == item.yarnTypeId)
          .firstOrNull;
      color = widget.lookup.colors
          .where((value) => value.colorId == item.colorId)
          .firstOrNull;
      supplier = widget.lookup.suppliers
          .where((value) => value.supplierId == item.supplierId)
          .firstOrNull;
      first.text = item.basePrice?.toString() ?? '';
    }
    product ??= widget.lookup.products
        .where((p) => p.category == 'fabric')
        .firstOrNull;
    warp ??= widget.lookup.colors.firstOrNull;
    weft ??= widget.lookup.colors.firstOrNull;
    yarnType ??= widget.lookup.yarnTypes.firstOrNull;
    color ??= widget.lookup.colors.firstOrNull;
    supplier ??= widget.lookup.suppliers.firstOrNull;
  }

  @override
  void dispose() {
    first.dispose();
    second.dispose();
    third.dispose();
    fourth.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text('${isEdit ? 'Update' : 'Add'} ${_name()}'),
      content: SingleChildScrollView(child: _fields()),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Cancel'),
        ),
        FilledButton(onPressed: _save, child: const Text('Save')),
      ],
    );
  }

  String _name() {
    switch (widget.tab) {
      case _CatalogTab.products:
        return 'Product';
      case _CatalogTab.colors:
        return 'Color';
      case _CatalogTab.designs:
        return 'Design';
      case _CatalogTab.yarnTypes:
        return 'Yarn type';
      case _CatalogTab.suppliers:
        return 'Supplier';
      case _CatalogTab.fabric:
        return 'Fabric variant';
      case _CatalogTab.yarn:
        return 'Yarn variant';
    }
  }

  Widget _text(
    String label,
    TextEditingController controller, {
    bool number = false,
    bool required = true,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextField(
        controller: controller,
        keyboardType: number ? TextInputType.number : TextInputType.text,
        decoration: InputDecoration(labelText: label),
      ),
    );
  }

  Widget _select<T>(
    String label,
    T? value,
    List<T> values,
    String Function(T) text,
    void Function(T?) onChanged,
  ) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: DropdownButtonFormField<T>(
        initialValue: value,
        decoration: InputDecoration(labelText: label),
        items: values
            .map((v) => DropdownMenuItem(value: v, child: Text(text(v))))
            .toList(),
        onChanged: onChanged,
      ),
    );
  }

  Widget _fields() {
    switch (widget.tab) {
      case _CatalogTab.products:
        return Column(
          children: [
            _text('Product name', first),
            _text('Base price', second, number: true),
            _text('Standard length (cm)', third, number: true, required: false),
            _text('Standard width (cm)', fourth, number: true, required: false),
          ],
        );
      case _CatalogTab.colors:
        return Column(
          children: [_text('Color code', first), _text('Name', second)],
        );
      case _CatalogTab.designs:
      case _CatalogTab.yarnTypes:
        return _text(
          widget.tab == _CatalogTab.designs ? 'Design name' : 'Material name',
          first,
        );
      case _CatalogTab.suppliers:
        return Column(
          children: [
            _text('Supplier name', first),
            _text('Phone', second, required: false),
          ],
        );
      case _CatalogTab.fabric:
        return Column(
          children: [
            _select(
              'Product',
              product,
              widget.lookup.products
                  .where((p) => p.category == 'fabric')
                  .toList(),
              (v) => v.name,
              (v) => setState(() => product = v),
            ),
            _select(
              'Warp color',
              warp,
              widget.lookup.colors,
              (v) => v.name,
              (v) => setState(() => warp = v),
            ),
            _select(
              'Weft color',
              weft,
              widget.lookup.colors,
              (v) => v.name,
              (v) => setState(() => weft = v),
            ),
            _select(
              'Design',
              design,
              widget.lookup.designs,
              (v) => v.name,
              (v) => setState(() => design = v),
            ),
            _text(
              'Base price (optional)',
              first,
              number: true,
              required: false,
            ),
          ],
        );
      case _CatalogTab.yarn:
        return Column(
          children: [
            _select(
              'Yarn type',
              yarnType,
              widget.lookup.yarnTypes,
              (v) => v.materialName,
              (v) => setState(() => yarnType = v),
            ),
            _select(
              'Color',
              color,
              widget.lookup.colors,
              (v) => v.name,
              (v) => setState(() => color = v),
            ),
            _select(
              'Supplier',
              supplier,
              widget.lookup.suppliers,
              (v) => v.name,
              (v) => setState(() => supplier = v),
            ),
            _text(
              'Base price (optional)',
              first,
              number: true,
              required: false,
            ),
          ],
        );
    }
  }

  void _save() {
    Map<String, dynamic> data;
    switch (widget.tab) {
      case _CatalogTab.products:
        data = {
          'name': first.text.trim(),
          'category': 'fabric',
          'basePrice': double.tryParse(second.text),
          if (third.text.isNotEmpty)
            'standardLengthCm': double.tryParse(third.text),
          if (fourth.text.isNotEmpty)
            'standardWidthCm': double.tryParse(fourth.text),
        };
      case _CatalogTab.colors:
        data = {'colorCode': first.text.trim(), 'name': second.text.trim()};
      case _CatalogTab.designs:
        data = {'name': first.text.trim()};
      case _CatalogTab.yarnTypes:
        data = {'materialName': first.text.trim()};
      case _CatalogTab.suppliers:
        data = {
          'name': first.text.trim(),
          if (second.text.trim().isNotEmpty) 'contactPhone': second.text.trim(),
        };
      case _CatalogTab.fabric:
        data = {
          'productId': product?.productId,
          'warpColorId': warp?.colorId,
          'weftColorId': weft?.colorId,
          if (design != null) 'designId': design!.designId,
          if (first.text.isNotEmpty) 'basePrice': double.tryParse(first.text),
        };
      case _CatalogTab.yarn:
        data = {
          'yarnTypeId': yarnType?.yarnTypeId,
          'colorId': color?.colorId,
          'supplierId': supplier?.supplierId,
          if (first.text.isNotEmpty) 'basePrice': double.tryParse(first.text),
        };
    }
    if (data.values.any((value) => value == null) ||
        data.entries.any(
          (entry) => entry.value is String && (entry.value as String).isEmpty,
        )) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Complete the required fields.')),
      );
      return;
    }
    Navigator.pop(context, data);
  }
}
