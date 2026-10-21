import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../blocs/weavers/weavers_bloc.dart';
import '../../../blocs/weavers/weavers_event.dart';
import '../../../blocs/weavers/weavers_state.dart';
import '../../../blocs/work_orders/work_orders_bloc.dart';
import '../../../blocs/work_orders/work_orders_event.dart';
import '../../../blocs/work_orders/work_orders_state.dart';
import '../../../core/constants/app_colors.dart';
import '../../widgets/custom_widgets.dart';
import '../zigs/zig_detail_screen.dart';
import 'issue_zig_screen.dart';

class WeaverDetailScreen extends StatefulWidget {
  final int weaverId;
  final String weaverName;

  const WeaverDetailScreen({
    super.key,
    required this.weaverId,
    required this.weaverName,
  });

  @override
  State<WeaverDetailScreen> createState() => _WeaverDetailScreenState();
}

class _WeaverDetailScreenState extends State<WeaverDetailScreen> {
  @override
  void initState() {
    super.initState();
    context.read<WeaversBloc>().add(LoadWeaverDetail(widget.weaverId));
    context.read<WorkOrdersBloc>().add(LoadWorkOrders(weaverId: widget.weaverId));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.weaverName),
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.all(16),
        decoration: const BoxDecoration(
          color: Colors.white,
          border: Border(top: BorderSide(color: AppColors.border)),
        ),
        child: ElevatedButton.icon(
          icon: const Icon(Icons.add_circle_outline),
          label: const Text('Issue New Zig (አዲስ ዚግ ስጥ)'),
          onPressed: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => IssueZigScreen(
                  weaverId: widget.weaverId,
                  weaverName: widget.weaverName,
                ),
              ),
            ).then((_) {
              context
                  .read<WorkOrdersBloc>()
                  .add(LoadWorkOrders(weaverId: widget.weaverId));
            });
          },
        ),
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          context.read<WeaversBloc>().add(LoadWeaverDetail(widget.weaverId));
          context
              .read<WorkOrdersBloc>()
              .add(LoadWorkOrders(weaverId: widget.weaverId));
        },
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Profile Card
              BlocBuilder<WeaversBloc, WeaversState>(
                builder: (context, state) {
                  final weaver = state.selectedWeaver;
                  return Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              CircleAvatar(
                                radius: 24,
                                backgroundColor:
                                    AppColors.adminPrimary.withOpacity(0.1),
                                foregroundColor: AppColors.adminPrimary,
                                child: Text(
                                  widget.weaverId.toString(),
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w700,
                                    fontSize: 16,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 14),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      weaver?.fullName ?? widget.weaverName,
                                      style: const TextStyle(
                                        fontSize: 17,
                                        fontWeight: FontWeight.w700,
                                        color: AppColors.textPrimary,
                                      ),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      'Weaver ID: ${widget.weaverId}',
                                      style: const TextStyle(
                                        fontSize: 12,
                                        color: AppColors.textMuted,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          const Divider(height: 24),
                          Row(
                            children: [
                              const Icon(Icons.phone_outlined,
                                  size: 16, color: AppColors.textMuted),
                              const SizedBox(width: 8),
                              Text(
                                weaver?.phone ?? 'No phone recorded',
                                style: const TextStyle(
                                    fontSize: 13,
                                    color: AppColors.textSecondary),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              const Icon(Icons.account_balance_outlined,
                                  size: 16, color: AppColors.textMuted),
                              const SizedBox(width: 8),
                              Text(
                                weaver?.bankAccountNumber ??
                                    'No bank account linked',
                                style: const TextStyle(
                                    fontSize: 13,
                                    color: AppColors.textSecondary),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
              const SizedBox(height: 20),

              // Zigs Section
              BlocBuilder<WorkOrdersBloc, WorkOrdersState>(
                builder: (context, state) {
                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      SectionHeader(
                        title: 'Work Orders (የተሰጡ ዚጎች)',
                        count: state.workOrders.length,
                      ),
                      if (state.status == WorkOrdersStatus.loading &&
                          state.workOrders.isEmpty)
                        const Padding(
                          padding: EdgeInsets.all(24),
                          child: Center(child: CircularProgressIndicator()),
                        )
                      else if (state.workOrders.isEmpty)
                        const Card(
                          child: Padding(
                            padding: EdgeInsets.all(20),
                            child: Center(
                              child: Text(
                                'No work orders issued to this weaver yet.',
                                style: TextStyle(
                                    fontSize: 13,
                                    color: AppColors.textSecondary),
                              ),
                            ),
                          ),
                        )
                      else
                        ListView.separated(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: state.workOrders.length,
                          separatorBuilder: (_, __) =>
                              const SizedBox(height: 8),
                          itemBuilder: (context, index) {
                            final zig = state.workOrders[index];
                            return Card(
                              child: ListTile(
                                onTap: () {
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (_) => ZigDetailScreen(
                                        zigId: zig.zigId,
                                      ),
                                    ),
                                  );
                                },
                                contentPadding: const EdgeInsets.symmetric(
                                    horizontal: 14, vertical: 4),
                                title: Row(
                                  children: [
                                    Text(
                                      'Zig #${zig.zigId}',
                                      style: const TextStyle(
                                        fontWeight: FontWeight.w700,
                                        fontSize: 14.5,
                                      ),
                                    ),
                                    const Spacer(),
                                    StatusBadge(status: zig.status),
                                  ],
                                ),
                                subtitle: Padding(
                                  padding: const EdgeInsets.only(top: 4),
                                  child: Text(
                                    zig.fabricVariant?.displayName ??
                                        'Fabric Variant #${zig.fabricVariantId}',
                                    style: const TextStyle(fontSize: 12.5),
                                  ),
                                ),
                                trailing: const Icon(Icons.chevron_right,
                                    color: AppColors.textMuted),
                              ),
                            );
                          },
                        ),
                    ],
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}
