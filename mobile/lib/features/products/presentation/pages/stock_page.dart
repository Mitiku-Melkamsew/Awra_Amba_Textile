import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/utils/formatters.dart';
import '../../domain/entities/product_entity.dart';
import '../blocs/stock_bloc.dart';
import '../blocs/stock_event.dart';
import '../blocs/stock_state.dart';

class StockPage extends StatefulWidget {
  const StockPage({super.key});

  @override
  State<StockPage> createState() => _StockPageState();
}

class _StockPageState extends State<StockPage>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    context.read<StockBloc>().add(LoadStockAndCatalog());
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Stock / ክምችት'),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: Colors.white,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
          tabs: const [
            Tab(icon: Icon(Icons.grid_view, size: 18), text: 'Fabric'),
            Tab(icon: Icon(Icons.fiber_manual_record, size: 18), text: 'Yarn'),
          ],
        ),
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
          if (state.status == StockStatus.loading) {
            return const Center(child: CircularProgressIndicator());
          }
          if (state.status == StockStatus.error) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.error_outline,
                        size: 48, color: AppColors.danger),
                    const SizedBox(height: 12),
                    Text(state.errorMessage ?? 'Failed to load stock',
                        textAlign: TextAlign.center),
                    const SizedBox(height: 16),
                    ElevatedButton.icon(
                      onPressed: () =>
                          context.read<StockBloc>().add(LoadStockAndCatalog()),
                      icon: const Icon(Icons.refresh, size: 18),
                      label: const Text('Retry'),
                    ),
                  ],
                ),
              ),
            );
          }

          return TabBarView(
            controller: _tabController,
            children: [
              _FabricList(variants: state.fabricVariants),
              _YarnList(variants: state.yarnVariants),
            ],
          );
        },
      ),
    );
  }
}

// ─── Fabric Tab ─────────────────────────────────────────────────────────────

class _FabricList extends StatelessWidget {
  final List<FabricVariantEntity> variants;
  const _FabricList({required this.variants});

  @override
  Widget build(BuildContext context) {
    if (variants.isEmpty) {
      return const Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.inventory_2_outlined, size: 48, color: AppColors.textMuted),
            SizedBox(height: 8),
            Text('No fabric variants found',
                style: TextStyle(color: AppColors.textMuted)),
          ],
        ),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: variants.length,
      separatorBuilder: (_, _) => const SizedBox(height: 8),
      itemBuilder: (context, index) {
        final v = variants[index];
        return _StockCard(
          title: v.displayName,
          subtitle: v.sku,
          stockQty: v.stockSnapshot,
          price: v.basePrice,
          icon: Icons.grid_view,
          iconColor: AppColors.adminAccent,
        );
      },
    );
  }
}

// ─── Yarn Tab ───────────────────────────────────────────────────────────────

class _YarnList extends StatelessWidget {
  final List<YarnVariantEntity> variants;
  const _YarnList({required this.variants});

  @override
  Widget build(BuildContext context) {
    if (variants.isEmpty) {
      return const Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.fiber_manual_record_outlined,
                size: 48, color: AppColors.textMuted),
            SizedBox(height: 8),
            Text('No yarn variants found',
                style: TextStyle(color: AppColors.textMuted)),
          ],
        ),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: variants.length,
      separatorBuilder: (_, _) => const SizedBox(height: 8),
      itemBuilder: (context, index) {
        final v = variants[index];
        return _StockCard(
          title: v.displayName,
          subtitle: v.sku,
          stockQty: v.stockSnapshot,
          price: v.basePrice,
          icon: Icons.fiber_manual_record,
          iconColor: AppColors.weaverAccent,
        );
      },
    );
  }
}

// ─── Shared Card ────────────────────────────────────────────────────────────

class _StockCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final double stockQty;
  final double? price;
  final IconData icon;
  final Color iconColor;

  const _StockCard({
    required this.title,
    required this.subtitle,
    required this.stockQty,
    this.price,
    required this.icon,
    required this.iconColor,
  });

  @override
  Widget build(BuildContext context) {
    final isLow = stockQty <= 0;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: iconColor.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: iconColor, size: 20),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title,
                      style: const TextStyle(
                          fontWeight: FontWeight.w600, fontSize: 14)),
                  const SizedBox(height: 2),
                  Text(subtitle,
                      style: const TextStyle(
                          color: AppColors.textMuted, fontSize: 12)),
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: isLow
                        ? AppColors.dangerLight
                        : AppColors.successLight,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    Formatters.number(stockQty),
                    style: TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 13,
                      color: isLow ? AppColors.danger : AppColors.success,
                    ),
                  ),
                ),
                if (price != null) ...[
                  const SizedBox(height: 4),
                  Text(Formatters.currency(price),
                      style: const TextStyle(
                          color: AppColors.textSecondary, fontSize: 11)),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }
}
