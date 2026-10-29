import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:awra_amba_textile/core/constants/app_colors.dart';
import 'package:awra_amba_textile/core/utils/formatters.dart';
import 'package:awra_amba_textile/core/widgets/custom_widgets.dart';
import 'package:awra_amba_textile/features/work_orders/presentation/blocs/work_orders_bloc.dart';
import 'package:awra_amba_textile/features/work_orders/presentation/blocs/work_orders_event.dart';
import 'package:awra_amba_textile/features/work_orders/presentation/blocs/work_orders_state.dart';

class WeaverZigDetailPage extends StatefulWidget {
  final String zigId;

  const WeaverZigDetailPage({super.key, required this.zigId});

  @override
  State<WeaverZigDetailPage> createState() => _WeaverZigDetailPageState();
}

class _WeaverZigDetailPageState extends State<WeaverZigDetailPage> {
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
      ),
      body: BlocBuilder<WorkOrdersBloc, WorkOrdersState>(
        builder: (context, state) {
          final detail = state.selectedDetail;
          if (state.status == WorkOrdersStatus.loading && detail == null) {
            return const Center(child: CircularProgressIndicator());
          }

          if (detail == null) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.error_outline,
                        size: 40, color: AppColors.danger),
                    const SizedBox(height: 12),
                    Text(state.errorMessage ?? 'Failed to load zig details'),
                    const SizedBox(height: 12),
                    ElevatedButton(
                      onPressed: () => context
                          .read<WorkOrdersBloc>()
                          .add(LoadWorkOrderDetail(widget.zigId)),
                      child: const Text('Retry'),
                    ),
                  ],
                ),
              ),
            );
          }

          final zig = detail;

          return RefreshIndicator(
            onRefresh: () async {
              context
                  .read<WorkOrdersBloc>()
                  .add(LoadWorkOrderDetail(widget.zigId));
            },
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Overview Card
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment:
                                MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                'Zig ID: ${zig.zigId}',
                                style: const TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              StatusBadge(status: zig.status),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Text(
                            zig.fabricVariant?.displayName ?? 'Fabric Product',
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: AppColors.textSecondary,
                            ),
                          ),
                          const Divider(height: 20),
                          Row(
                            children: [
                              Expanded(
                                child: _InfoItem(
                                  label: 'Issue Date',
                                  value: Formatters.date(zig.dateIssued),
                                ),
                              ),
                              Expanded(
                                child: _InfoItem(
                                  label: 'Status',
                                  value: zig.status.toUpperCase(),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 16),

                  // Stat Cards
                  Row(
                    children: [
                      Expanded(
                        child: StatCard(
                          title: 'Fabric Credit',
                          value: Formatters.currency(zig.totalFabricCredit),
                          subtitle: '${zig.totalFabricQuantity} pcs returned',
                          icon: Icons.check_circle_outline,
                          color: AppColors.success,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: StatCard(
                          title: 'Yarn Cost (ድር)',
                          value: Formatters.currency(zig.totalYarnCost),
                          subtitle: '${zig.totalYarnQuantity} kg assigned',
                          icon: Icons.grain,
                          color: AppColors.danger,
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 20),

                  // Yarn Given (የተሰጠ ፈትል)
                  SectionHeader(
                    title: 'Yarn Given (የተሰጠ ፈትል)',
                    count: zig.yarnGiven.length,
                  ),
                  const SizedBox(height: 8),

                  if (zig.yarnGiven.isEmpty)
                    const EmptyState(
                      icon: Icons.grain_outlined,
                      title: 'No Yarn Given',
                      message: 'No yarn records for this zig',
                    )
                  else
                    ...zig.yarnGiven.map((yarn) => Card(
                          margin: const EdgeInsets.only(bottom: 8),
                          child: Padding(
                            padding: const EdgeInsets.all(12),
                            child: Row(
                              children: [
                                CircleAvatar(
                                  radius: 18,
                                  backgroundColor: AppColors.weaverPrimary
                                      .withValues(alpha: 0.1),
                                  child: const Icon(Icons.grain,
                                      size: 18,
                                      color: AppColors.weaverPrimary),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        '${yarn.yarnMaterial} - ${yarn.yarnColor}',
                                        style: const TextStyle(
                                          fontWeight: FontWeight.w600,
                                          fontSize: 13.5,
                                        ),
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        'SKU: ${yarn.yarnSku}',
                                        style: const TextStyle(
                                          fontSize: 11.5,
                                          color: AppColors.textMuted,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                Column(
                                  crossAxisAlignment:
                                      CrossAxisAlignment.end,
                                  children: [
                                    Text(
                                      '${yarn.quantity} kg',
                                      style: const TextStyle(
                                        fontWeight: FontWeight.w700,
                                        fontSize: 13.5,
                                      ),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      Formatters.currency(yarn.unitPrice),
                                      style: const TextStyle(
                                        fontSize: 11.5,
                                        color: AppColors.textSecondary,
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        )),

                  const SizedBox(height: 20),

                  // Fabric Returns (የተመለሰ ጨርቅ)
                  SectionHeader(
                    title: 'Fabric Returns (የተመለሰ ጨርቅ)',
                    count: zig.fabricReturns.length,
                  ),
                  const SizedBox(height: 8),

                  if (zig.fabricReturns.isEmpty)
                    const EmptyState(
                      icon: Icons.inventory_outlined,
                      title: 'No Returns Yet',
                      message: 'No fabric has been returned for this zig yet',
                    )
                  else
                    ...zig.fabricReturns.map((ret) => Card(
                          margin: const EdgeInsets.only(bottom: 8),
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
                                      ret.fabricVariant?.displayName ?? 'Returned Fabric',
                                      style: const TextStyle(
                                        fontWeight: FontWeight.w700,
                                        fontSize: 14,
                                      ),
                                    ),
                                    Text(
                                      '${ret.quantityReturned} pcs',
                                      style: const TextStyle(
                                        fontWeight: FontWeight.w700,
                                        fontSize: 14,
                                        color: AppColors.success,
                                      ),
                                    ),
                                  ],
                                ),
                                const Divider(height: 16),
                                Row(
                                  children: [
                                    Expanded(
                                      child: _InfoItem(
                                        label: 'Return Date',
                                        value: Formatters.date(ret.dateReturned),
                                      ),
                                    ),
                                    Expanded(
                                      child: _InfoItem(
                                        label: 'Total Weight',
                                        value: '${ret.totalWeight} kg',
                                      ),
                                    ),
                                    Expanded(
                                      child: _InfoItem(
                                        label: 'Avg Weight',
                                        value: '${ret.avgWeight.toStringAsFixed(1)} kg',
                                      ),
                                    ),
                                  ],
                                ),
                                if (ret.remark != null &&
                                    ret.remark!.isNotEmpty) ...[
                                  const SizedBox(height: 8),
                                  Text(
                                    'Remark: ${ret.remark}',
                                    style: const TextStyle(
                                      fontSize: 12,
                                      color: AppColors.textSecondary,
                                      fontStyle: FontStyle.italic,
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ),
                        )),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

class _InfoItem extends StatelessWidget {
  final String label;
  final String value;

  const _InfoItem({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 11,
            color: AppColors.textMuted,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          value,
          style: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }
}
