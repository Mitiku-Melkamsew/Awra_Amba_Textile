import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:awra_amba_textile/core/constants/app_colors.dart';
import 'package:awra_amba_textile/core/utils/formatters.dart';
import 'package:awra_amba_textile/features/authentication/presentation/blocs/auth_bloc.dart';
import 'package:awra_amba_textile/features/authentication/presentation/blocs/auth_event.dart';
import 'package:awra_amba_textile/features/work_orders/domain/entities/work_order_entity.dart';
import 'package:awra_amba_textile/features/work_orders/presentation/blocs/work_orders_bloc.dart';
import 'package:awra_amba_textile/features/work_orders/presentation/blocs/work_orders_event.dart';
import 'package:awra_amba_textile/features/work_orders/presentation/blocs/work_orders_state.dart';
import 'package:awra_amba_textile/features/work_orders/presentation/pages/weaver_zig_detail_page.dart';

class WeaverPortalPage extends StatefulWidget {
  const WeaverPortalPage({super.key});

  @override
  State<WeaverPortalPage> createState() => _WeaverPortalPageState();
}

class _WeaverPortalPageState extends State<WeaverPortalPage> {
  @override
  void initState() {
    super.initState();
    _loadMyOrders();
  }

  void _loadMyOrders() {
    final authState = context.read<AuthBloc>().state;
    final weaverId = authState.user?.weaverId;
    if (weaverId != null) {
      context
          .read<WorkOrdersBloc>()
          .add(LoadWorkOrders(weaverId: weaverId));
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = context.watch<AuthBloc>().state;
    final user = authState.user;

    return Scaffold(
      appBar: AppBar(
        title: Text('ሰላም, ${user?.username ?? 'Weaver'}'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: 'Logout',
            onPressed: () =>
                context.read<AuthBloc>().add(LogoutRequested()),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async => _loadMyOrders(),
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Welcome card
              Card(
                color: AppColors.weaverPrimary,
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const CircleAvatar(
                            radius: 24,
                            backgroundColor: Colors.white24,
                            child: Icon(Icons.person,
                                color: Colors.white, size: 28),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  user?.username ?? 'Weaver',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 18,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  user?.weaverId != null
                                      ? 'Weaver ID: #${user!.weaverId}'
                                      : 'Role: ${user?.role ?? "weaver"}',
                                  style: const TextStyle(
                                    color: Colors.white70,
                                    fontSize: 13,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 24),

              // Quick Stats
              const Text(
                'Overview (አጠቃላይ)',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 12),

              BlocBuilder<WorkOrdersBloc, WorkOrdersState>(
                builder: (context, state) {
                  final totalZigs = state.workOrders.length;
                  final inProgressZigs = state.workOrders
                      .where((w) => w.status == 'in_progress')
                      .length;
                  final returnedZigs = state.workOrders
                      .where((w) =>
                          w.status == 'returned' ||
                          w.status == 'reconciled')
                      .length;

                  return Row(
                    children: [
                      Expanded(
                        child: _StatTile(
                          icon: Icons.layers_outlined,
                          title: 'Total Zigs',
                          value: '$totalZigs',
                          color: AppColors.weaverPrimary,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: _StatTile(
                          icon: Icons.hourglass_top,
                          title: 'In Progress',
                          value: '$inProgressZigs',
                          color: AppColors.warning,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: _StatTile(
                          icon: Icons.check_circle_outline,
                          title: 'Completed',
                          value: '$returnedZigs',
                          color: AppColors.success,
                        ),
                      ),
                    ],
                  );
                },
              ),

              const SizedBox(height: 24),

              // Active Zigs
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Active Zigs (በሥራ ላይ ያሉ)',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  TextButton(
                    onPressed: () {},
                    child: const Text('View All'),
                  ),
                ],
              ),
              const SizedBox(height: 8),

              BlocBuilder<WorkOrdersBloc, WorkOrdersState>(
                builder: (context, state) {
                  if (state.status == WorkOrdersStatus.loading) {
                    return const Center(
                      child: Padding(
                        padding: EdgeInsets.all(32),
                        child: CircularProgressIndicator(),
                      ),
                    );
                  }

                  final activeOrders = state.workOrders
                      .where((w) =>
                          w.status == 'assigned' ||
                          w.status == 'in_progress')
                      .take(5)
                      .toList();

                  if (activeOrders.isEmpty) {
                    return Card(
                      child: Padding(
                        padding: const EdgeInsets.all(24),
                        child: Center(
                          child: Column(
                            children: const [
                              Icon(Icons.inbox_outlined,
                                  size: 40, color: AppColors.textMuted),
                              SizedBox(height: 8),
                              Text(
                                'No active zigs right now',
                                style:
                                    TextStyle(color: AppColors.textMuted),
                              ),
                            ],
                          ),
                        ),
                      ),
                    );
                  }

                  return Column(
                    children: activeOrders
                        .map((order) => _ActiveZigCard(
                              order: order,
                              onTap: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (_) => WeaverZigDetailPage(
                                      zigId: order.zigId,
                                    ),
                                  ),
                                );
                              },
                            ))
                        .toList(),
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

class _StatTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String value;
  final Color color;

  const _StatTile({
    required this.icon,
    required this.title,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          children: [
            Icon(icon, color: color, size: 24),
            const SizedBox(height: 6),
            Text(
              value,
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: color,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              title,
              style: const TextStyle(
                fontSize: 10.5,
                color: AppColors.textSecondary,
              ),
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}

class _ActiveZigCard extends StatelessWidget {
  final WorkOrderEntity order;
  final VoidCallback onTap;

  const _ActiveZigCard({required this.order, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        onTap: onTap,
        leading: CircleAvatar(
          backgroundColor: AppColors.weaverPrimary.withValues(alpha: 0.1),
          child: const Icon(Icons.layers,
              color: AppColors.weaverPrimary, size: 20),
        ),
        title: Text(
          order.zigId,
          style: const TextStyle(fontWeight: FontWeight.w700),
        ),
        subtitle: Text(
          '${order.fabricVariant?.displayName ?? "Fabric"} • ${Formatters.date(order.dateIssued)}',
          style: const TextStyle(fontSize: 12),
        ),
        trailing: const Icon(Icons.chevron_right, size: 20),
      ),
    );
  }
}
