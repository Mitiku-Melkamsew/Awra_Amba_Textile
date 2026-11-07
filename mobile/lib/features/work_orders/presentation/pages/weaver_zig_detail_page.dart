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
      appBar: AppBar(title: Text('Zig #${widget.zigId}')),
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
                    const Icon(
                      Icons.error_outline,
                      size: 40,
                      color: AppColors.danger,
                    ),
                    const SizedBox(height: 12),
                    Text(state.errorMessage ?? 'Failed to load zig details'),
                    const SizedBox(height: 12),
                    ElevatedButton(
                      onPressed: () => context.read<WorkOrdersBloc>().add(
                        LoadWorkOrderDetail(widget.zigId),
                      ),
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
              context.read<WorkOrdersBloc>().add(
                LoadWorkOrderDetail(widget.zigId),
              );
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
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
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
                                  label: 'Issued Date',
                                  value: Formatters.date(zig.dateIssued),
                                ),
                              ),
                              Expanded(
                                child: _InfoItem(
                                  label: 'Weaver',
                                  value:
                                      zig.weaver?.fullName ??
                                      'ID #${zig.weaverId}',
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 16),

                  // Financial summary
                  Row(
                    children: [
                      Expanded(
                        child: StatCard(
                          title: 'Fabric Credit',
                          value: Formatters.currency(zig.totalFabricCredit),
                          subtitle: '${zig.totalFabricQuantity} pieces',
                          icon: Icons.check_circle_outline,
                          color: AppColors.success,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: StatCard(
                          title: 'Yarn Cost (ድር)',
                          value: Formatters.currency(zig.totalYarnCost),
                          subtitle: '${zig.totalYarnQuantity} pieces issued',
                          icon: Icons.grain,
                          color: AppColors.danger,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  StatCard(
                    title: 'Net Amount (የተጣራ ክፍያ)',
                    value: Formatters.currency(zig.netProfit),
                    subtitle: 'Estimated earnings before batch settlement',
                    icon: Icons.account_balance_wallet_outlined,
                    color: AppColors.weaverPrimary,
                  ),

                  const SizedBox(height: 24),

                  // Fabric returns
                  SectionHeader(
                    title: 'Fabric Returns (የተመለሰ ጨርቅ)',
                    count: zig.fabricReturns.length,
                  ),
                  if (zig.fabricReturns.isEmpty)
                    const Card(
                      child: Padding(
                        padding: EdgeInsets.all(16),
                        child: Center(
                          child: Text(
                            'No fabric returns recorded yet',
                            style: TextStyle(
                              fontSize: 13,
                              color: AppColors.textMuted,
                            ),
                          ),
                        ),
                      ),
                    )
                  else
                    ...zig.fabricReturns.map(
                      (ret) => Card(
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
                                    ret.fabricVariant?.displayName ??
                                        'Returned Fabric',
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
                                      value: '${ret.totalWeight} g',
                                    ),
                                  ),
                                  Expanded(
                                    child: _InfoItem(
                                      label: 'Avg Weight',
                                      value: '${ret.avgWeight.floor()} g',
                                    ),
                                  ),
                                ],
                              ),
                              if (ret.lengthCm != null ||
                                  ret.widthCm != null) ...[
                                const SizedBox(height: 6),
                                Text(
                                  'Size: ${ret.lengthCm?.toStringAsFixed(1) ?? '-'} × ${ret.widthCm?.toStringAsFixed(1) ?? '-'} cm',
                                  style: const TextStyle(
                                    fontSize: 12,
                                    color: AppColors.textSecondary,
                                  ),
                                ),
                              ],
                              if (ret.remark != null &&
                                  ret.remark!.isNotEmpty) ...[
                                const SizedBox(height: 6),
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
                      ),
                    ),

                  // Defective fabric returned to weaver (rejected)
                  if (zig.fabricReturnsToWeaver.isNotEmpty) ...[
                    const SizedBox(height: 20),
                    SectionHeader(
                      title: '🚫 Defective Fabric Returned to You',
                      count: zig.fabricReturnsToWeaver.length,
                    ),
                    ...zig.fabricReturnsToWeaver.map(
                      (item) => Card(
                        margin: const EdgeInsets.only(bottom: 8),
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
                      ),
                    ),
                  ],

                  const SizedBox(height: 20),

                  // Yarn deliveries
                  SectionHeader(
                    title: 'Yarn Deliveries (የተሰጠ ድር)',
                    count: zig.yarnGiven.length,
                  ),
                  if (zig.yarnGiven.isEmpty)
                    const Card(
                      child: Padding(
                        padding: EdgeInsets.all(16),
                        child: Center(
                          child: Text(
                            'No yarn deliveries recorded',
                            style: TextStyle(
                              fontSize: 13,
                              color: AppColors.textMuted,
                            ),
                          ),
                        ),
                      ),
                    )
                  else
                    ...zig.yarnGiven.map(
                      (yarn) => Card(
                        margin: const EdgeInsets.only(bottom: 8),
                        child: Padding(
                          padding: const EdgeInsets.all(12),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    '${yarn.yarnMaterial} (${yarn.yarnColor})',
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w600,
                                      fontSize: 13.5,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    '${yarn.quantity} pieces @ ${yarn.unitPrice.round()} ETB/piece',
                                    style: const TextStyle(
                                      fontSize: 12,
                                      color: AppColors.textSecondary,
                                    ),
                                  ),
                                ],
                              ),
                              Text(
                                Formatters.currency(yarn.totalCost),
                                style: const TextStyle(
                                  fontWeight: FontWeight.w700,
                                  fontSize: 14,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),

                  // Unused yarn returns
                  if (zig.yarnReturns.isNotEmpty) ...[
                    const SizedBox(height: 20),
                    SectionHeader(
                      title: '↩️ Unused Yarn Returns (የተመለሰ ድር)',
                      count: zig.yarnReturns.length,
                    ),
                    ...zig.yarnReturns.map(
                      (ret) => Card(
                        margin: const EdgeInsets.only(bottom: 8),
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
                                    '${ret.yarnMaterial} (${ret.yarnColor})',
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w600,
                                      fontSize: 13,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    'Returned on ${Formatters.date(ret.dateReturned)}',
                                    style: const TextStyle(
                                      fontSize: 11.5,
                                      color: AppColors.textMuted,
                                    ),
                                  ),
                                  if (ret.remark != null &&
                                      ret.remark!.isNotEmpty) ...[
                                    const SizedBox(height: 2),
                                    Text(
                                      ret.remark!,
                                      style: const TextStyle(
                                        fontSize: 11.5,
                                        fontStyle: FontStyle.italic,
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                              Text(
                                '${ret.quantity} pieces returned',
                                style: const TextStyle(
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.warning,
                                  fontSize: 13,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
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
          style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
        ),
        const SizedBox(height: 2),
        Text(
          value,
          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
        ),
      ],
    );
  }
}
