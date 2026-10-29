import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../blocs/work_orders/work_orders_bloc.dart';
import '../../blocs/work_orders/work_orders_event.dart';
import '../../blocs/work_orders/work_orders_state.dart';
import '../../core/constants/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../models/work_order.dart';
import '../widgets/custom_widgets.dart';

class WeaverZigDetailScreen extends StatefulWidget {
  final String zigId;

  const WeaverZigDetailScreen({super.key, required this.zigId});

  @override
  State<WeaverZigDetailScreen> createState() => _WeaverZigDetailScreenState();
}

class _WeaverZigDetailScreenState extends State<WeaverZigDetailScreen> {
  @override
  void initState() {
    super.initState();
    context.read<WorkOrdersBloc>().add(LoadWorkOrderDetail(widget.zigId));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Zig #${widget.zigId}'),
        backgroundColor: AppColors.weaverPrimary,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              context.read<WorkOrdersBloc>().add(LoadWorkOrderDetail(widget.zigId));
            },
          ),
        ],
      ),
      body: BlocBuilder<WorkOrdersBloc, WorkOrdersState>(
        builder: (context, state) {
          if (state.status == WorkOrdersStatus.loading &&
              state.selectedWorkOrder == null) {
            return const Center(child: CircularProgressIndicator());
          }

          if (state.status == WorkOrdersStatus.error &&
              state.selectedWorkOrder == null) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.error_outline,
                        size: 40, color: AppColors.danger),
                    const SizedBox(height: 12),
                    Text(
                      state.errorMessage ?? 'Failed to load work order detail',
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: () {
                        context
                            .read<WorkOrdersBloc>()
                            .add(LoadWorkOrderDetail(widget.zigId));
                      },
                      child: const Text('Retry'),
                    ),
                  ],
                ),
              ),
            );
          }

          final zig = state.selectedWorkOrder;
          if (zig == null) {
            return const Center(child: Text('Work order not found'));
          }

          return RefreshIndicator(
            onRefresh: () async {
              context
                  .read<WorkOrdersBloc>()
                  .add(LoadWorkOrderDetail(widget.zigId));
            },
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                // Header Card
                _buildHeaderCard(zig),
                const SizedBox(height: 16),

                // Financial Summary Cards
                _buildFinancialSummary(zig),
                const SizedBox(height: 20),

                // Fabric Returns Section
                _buildFabricReturnsSection(zig),
                const SizedBox(height: 20),

                // Yarn Given Section
                _buildYarnGivenSection(zig),
                const SizedBox(height: 24),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildHeaderCard(WorkOrderDetail zig) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    zig.fabricVariant?.displayName ?? 'Standard Fabric',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary,
                    ),
                  ),
                ),
                StatusBadge(status: zig.status),
              ],
            ),
            const SizedBox(height: 12),
            const Divider(height: 1),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _buildMetaItem('Issued Date', Formatters.date(zig.dateIssued)),
                if (zig.fabricVariant?.basePrice != null)
                  _buildMetaItem(
                    'Base Price',
                    Formatters.currency(zig.fabricVariant!.basePrice),
                  ),
                _buildMetaItem('Weaver', zig.weaver?.fullName ?? 'You'),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMetaItem(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
        ),
        const SizedBox(height: 2),
        Text(
          value,
          style: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: AppColors.textPrimary,
          ),
        ),
      ],
    );
  }

  Widget _buildFinancialSummary(WorkOrderDetail zig) {
    return Row(
      children: [
        Expanded(
          child: StatCard(
            title: 'Fabric Credit',
            value: Formatters.currency(zig.totalFabricCredit),
            subtitle: '${zig.totalFabricQuantity} pcs returned',
            icon: Icons.checkroom,
            color: AppColors.weaverPrimary,
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: StatCard(
            title: 'Yarn Cost',
            value: Formatters.currency(zig.totalYarnCost),
            subtitle: '${zig.totalYarnQuantity} kg given',
            icon: Icons.fiber_manual_record,
            color: AppColors.warning,
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: StatCard(
            title: 'Net Profit',
            value: Formatters.currency(zig.netProfit),
            subtitle: 'Estimated payout',
            icon: Icons.account_balance_wallet,
            color: zig.netProfit >= 0 ? AppColors.success : AppColors.danger,
          ),
        ),
      ],
    );
  }

  Widget _buildFabricReturnsSection(WorkOrderDetail zig) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const SectionHeader(
              title: 'Fabric Returns (የተመለሰ ጨርቅ)',
              subtitle: 'Deliveries recorded for this zig',
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: AppColors.weaverAccent.withOpacity(0.12),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                '${zig.fabricReturns.length} batches',
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  color: AppColors.weaverPrimary,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        if (zig.fabricReturns.isEmpty)
          const EmptyState(
            icon: Icons.inventory_2_outlined,
            title: 'No Returns Yet',
            subtitle: 'No finished fabric returns have been recorded yet.',
          )
        else
          ...zig.fabricReturns.map((ret) => _buildFabricReturnCard(ret)),
      ],
    );
  }

  Widget _buildFabricReturnCard(FabricReturnItem ret) {
    final hasDeduction =
        ret.calculatedDeduction != null && ret.calculatedDeduction! > 0;
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '${ret.quantityReturned} Pieces (${Formatters.date(ret.dateReturned)})',
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                ),
                Text(
                  Formatters.currency(ret.lineTotal),
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppColors.weaverPrimary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Row(
              children: [
                _buildReturnStat('Weight', '${ret.totalWeight} kg'),
                const SizedBox(width: 16),
                _buildReturnStat('Avg/pc', '${ret.avgWeight.floor()} g'),
                const SizedBox(width: 16),
                _buildReturnStat('Base', Formatters.currency(ret.unitPrice)),
                if (hasDeduction) ...[
                  const SizedBox(width: 16),
                  _buildReturnStat(
                    'Deduct',
                    '-${Formatters.currency(ret.calculatedDeduction)}',
                    color: AppColors.danger,
                  ),
                ],
              ],
            ),
            if (ret.remark != null && ret.remark!.isNotEmpty) ...[
              const SizedBox(height: 6),
              Text(
                'Note: ${ret.remark}',
                style: const TextStyle(
                  fontSize: 11.5,
                  fontStyle: FontStyle.italic,
                  color: AppColors.textSecondary,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildReturnStat(String label, String value, {Color? color}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: color ?? AppColors.textSecondary,
          ),
        ),
      ],
    );
  }

  Widget _buildYarnGivenSection(WorkOrderDetail zig) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const SectionHeader(
              title: 'Yarn Given (የተሰጠ ክር)',
              subtitle: 'Raw yarn provided for production',
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: AppColors.warningLight,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                '${zig.yarnGiven.length} dispatches',
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  color: AppColors.warning,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        if (zig.yarnGiven.isEmpty)
          const EmptyState(
            icon: Icons.fiber_manual_record_outlined,
            title: 'No Yarn Dispatches',
            subtitle: 'No yarn has been recorded as given for this zig.',
          )
        else
          ...zig.yarnGiven.map((yarn) => _buildYarnGivenCard(yarn)),
      ],
    );
  }

  Widget _buildYarnGivenCard(YarnGivenItem yarn) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppColors.warningLight,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(
                Icons.fiber_manual_record,
                size: 18,
                color: AppColors.warning,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    yarn.yarnMaterial.isNotEmpty
                        ? '${yarn.yarnMaterial} (${yarn.yarnColor})'
                        : yarn.yarnSku,
                    style: const TextStyle(
                      fontSize: 13.5,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '${yarn.quantity} kg @ ${Formatters.currency(yarn.unitPrice)}/kg · ${Formatters.date(yarn.dateGiven)}',
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.textMuted,
                    ),
                  ),
                ],
              ),
            ),
            Text(
              Formatters.currency(yarn.totalCost),
              style: const TextStyle(
                fontSize: 13.5,
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
