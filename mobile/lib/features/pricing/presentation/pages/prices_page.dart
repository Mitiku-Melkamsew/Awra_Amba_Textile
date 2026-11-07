import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/utils/formatters.dart';
import '../../../products/domain/entities/product_entity.dart';
import '../../../products/presentation/blocs/stock_bloc.dart';
import '../blocs/pricing_bloc.dart';
import '../blocs/pricing_event.dart';
import '../blocs/pricing_state.dart';

class PricesPage extends StatefulWidget {
  const PricesPage({super.key});

  @override
  State<PricesPage> createState() => _PricesPageState();
}

class _PricesPageState extends State<PricesPage>
    with SingleTickerProviderStateMixin {
  late final TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    context.read<PricingBloc>().add(LoadPrices());
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _showAddFabricPriceDialog() {
    final stockState = context.read<StockBloc>().state;
    final fabricVariants = stockState.fabricVariants;

    if (fabricVariants.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please wait for fabric variants to load.'),
        ),
      );
      return;
    }

    FabricVariantEntity selectedVariant = fabricVariants.first;
    final priceCtrl = TextEditingController(
      text: selectedVariant.basePrice?.toString() ?? '500',
    );

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (dCtx, setDialogState) => AlertDialog(
          title: const Text('Add Fabric Price Version / የጨርቅ ዋጋ'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                DropdownButtonFormField<FabricVariantEntity>(
                  initialValue: selectedVariant,
                  decoration: const InputDecoration(
                    labelText: 'Fabric Variant',
                  ),
                  items: fabricVariants
                      .map(
                        (v) => DropdownMenuItem(
                          value: v,
                          child: Text('${v.displayName} · ${v.sku}'),
                        ),
                      )
                      .toList(),
                  onChanged: (val) {
                    if (val != null) {
                      setDialogState(() {
                        selectedVariant = val;
                        if (val.basePrice != null) {
                          priceCtrl.text = val.basePrice.toString();
                        }
                      });
                    }
                  },
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: priceCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Selling Price (ETB / pc)',
                  ),
                  keyboardType: TextInputType.number,
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
                final price = double.tryParse(priceCtrl.text) ?? 0.0;
                if (price <= 0) return;
                context.read<PricingBloc>().add(
                  CreateFabricPriceSubmitted(
                    fabricVariantId: selectedVariant.fabricVariantId,
                    unitPrice: price,
                  ),
                );
                Navigator.pop(dCtx);
              },
              child: const Text('Save Price'),
            ),
          ],
        ),
      ),
    );
  }

  void _showAddYarnPriceDialog() {
    final stockState = context.read<StockBloc>().state;
    final yarnVariants = stockState.yarnVariants;

    if (yarnVariants.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please wait for yarn variants to load.')),
      );
      return;
    }

    YarnVariantEntity selectedVariant = yarnVariants.first;
    final priceCtrl = TextEditingController(
      text: selectedVariant.basePrice?.toString() ?? '350',
    );

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (dCtx, setDialogState) => AlertDialog(
          title: const Text('Add Yarn Price Version / የድር መነሻ ዋጋ'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                DropdownButtonFormField<YarnVariantEntity>(
                  initialValue: selectedVariant,
                  decoration: const InputDecoration(labelText: 'Yarn Variant'),
                  items: yarnVariants
                      .map(
                        (v) => DropdownMenuItem(
                          value: v,
                          child: Text('${v.displayName} · ${v.sku}'),
                        ),
                      )
                      .toList(),
                  onChanged: (val) {
                    if (val != null) {
                      setDialogState(() {
                        selectedVariant = val;
                        if (val.basePrice != null) {
                          priceCtrl.text = val.basePrice.toString();
                        }
                      });
                    }
                  },
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: priceCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Cost Per Piece (ETB / piece)',
                  ),
                  keyboardType: TextInputType.number,
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
                final price = double.tryParse(priceCtrl.text) ?? 0.0;
                if (price <= 0) return;
                context.read<PricingBloc>().add(
                  CreateYarnPriceSubmitted(
                    yarnVariantId: selectedVariant.yarnVariantId,
                    costPerKg: price,
                  ),
                );
                Navigator.pop(dCtx);
              },
              child: const Text('Save Price'),
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
        title: const Text('Pricing Engine / የዋጋ አስተዳደር'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Fabric Wholesale Prices'),
            Tab(text: 'Yarn Standard Costs'),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => context.read<PricingBloc>().add(LoadPrices()),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: AppColors.adminPrimary,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add),
        label: Text(
          _tabController.index == 0 ? 'New Fabric Price' : 'New Yarn Price',
        ),
        onPressed: () {
          if (_tabController.index == 0) {
            _showAddFabricPriceDialog();
          } else {
            _showAddYarnPriceDialog();
          }
        },
      ),
      body: BlocConsumer<PricingBloc, PricingState>(
        listener: (context, state) {
          if (state.status == PricingStatus.actionSuccess &&
              state.successMessage != null) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.successMessage!),
                backgroundColor: AppColors.success,
              ),
            );
          }
          if (state.status == PricingStatus.error &&
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
          if (state.status == PricingStatus.loading &&
              state.fabricPrices.isEmpty &&
              state.yarnPrices.isEmpty) {
            return const Center(child: CircularProgressIndicator());
          }

          return TabBarView(
            controller: _tabController,
            children: [
              // Tab 1: Fabric Prices
              RefreshIndicator(
                onRefresh: () async =>
                    context.read<PricingBloc>().add(LoadPrices()),
                child: state.fabricPrices.isEmpty
                    ? const Center(
                        child: Text('No fabric price records found.'),
                      )
                    : ListView.separated(
                        padding: const EdgeInsets.all(16),
                        itemCount: state.fabricPrices.length,
                        separatorBuilder: (_, _) => const SizedBox(height: 8),
                        itemBuilder: (context, index) {
                          final item = state.fabricPrices[index];
                          return Card(
                            child: ListTile(
                              leading: const CircleAvatar(
                                backgroundColor: Color(0xFFEFF6FF),
                                child: Text('🧵'),
                              ),
                              title: Text(
                                item.fabricName,
                                style: const TextStyle(
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              subtitle: Text(
                                'Effective: ${Formatters.date(item.effectiveDate)}',
                                style: const TextStyle(fontSize: 12),
                              ),
                              trailing: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  Text(
                                    Formatters.currency(item.unitPrice),
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w700,
                                      fontSize: 15,
                                      color: AppColors.adminPrimary,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 6,
                                      vertical: 2,
                                    ),
                                    decoration: BoxDecoration(
                                      color: item.isActive
                                          ? AppColors.success.withValues(
                                              alpha: 0.12,
                                            )
                                          : Colors.grey.withValues(alpha: 0.2),
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    child: Text(
                                      item.isActive ? 'ACTIVE' : 'INACTIVE',
                                      style: TextStyle(
                                        fontSize: 10,
                                        fontWeight: FontWeight.w700,
                                        color: item.isActive
                                            ? AppColors.success
                                            : Colors.grey,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
              ),

              // Tab 2: Yarn Prices
              RefreshIndicator(
                onRefresh: () async =>
                    context.read<PricingBloc>().add(LoadPrices()),
                child: state.yarnPrices.isEmpty
                    ? const Center(child: Text('No yarn price records found.'))
                    : ListView.separated(
                        padding: const EdgeInsets.all(16),
                        itemCount: state.yarnPrices.length,
                        separatorBuilder: (_, _) => const SizedBox(height: 8),
                        itemBuilder: (context, index) {
                          final item = state.yarnPrices[index];
                          return Card(
                            child: ListTile(
                              leading: const CircleAvatar(
                                backgroundColor: Color(0xFFFEF3C7),
                                child: Text('🧶'),
                              ),
                              title: Text(
                                item.yarnName,
                                style: const TextStyle(
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              subtitle: Text(
                                'Effective: ${Formatters.date(item.effectiveDate)}',
                                style: const TextStyle(fontSize: 12),
                              ),
                              trailing: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  Text(
                                    '${Formatters.currency(item.costPerKg)}/piece',
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w700,
                                      fontSize: 15,
                                      color: Colors.amber,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 6,
                                      vertical: 2,
                                    ),
                                    decoration: BoxDecoration(
                                      color: item.isActive
                                          ? AppColors.success.withValues(
                                              alpha: 0.12,
                                            )
                                          : Colors.grey.withValues(alpha: 0.2),
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    child: Text(
                                      item.isActive ? 'ACTIVE' : 'INACTIVE',
                                      style: TextStyle(
                                        fontSize: 10,
                                        fontWeight: FontWeight.w700,
                                        color: item.isActive
                                            ? AppColors.success
                                            : Colors.grey,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
              ),
            ],
          );
        },
      ),
    );
  }
}
