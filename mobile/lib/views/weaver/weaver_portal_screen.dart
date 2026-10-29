import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../blocs/auth/auth_bloc.dart';
import '../../blocs/auth/auth_event.dart';
import '../../blocs/work_orders/work_orders_bloc.dart';
import '../../blocs/work_orders/work_orders_event.dart';
import '../../blocs/work_orders/work_orders_state.dart';
import '../../core/constants/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../models/work_order.dart';
import 'weaver_zig_detail_screen.dart';

class WeaverPortalScreen extends StatefulWidget {
  const WeaverPortalScreen({super.key});

  @override
  State<WeaverPortalScreen> createState() => _WeaverPortalScreenState();
}

class _WeaverPortalScreenState extends State<WeaverPortalScreen> {
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
        child: BlocBuilder<WorkOrdersBloc, WorkOrdersState>(
          builder: (context, state) {
            if (state.status == WorkOrdersStatus.loading) {
              return const Center(child: CircularProgressIndicator());
            }

            final orders = state.workOrders;

            // Compute summary stats
            final active = orders
                .where((o) =>
                    o.status == 'assigned' || o.status == 'in_progress')
                .length;
            final returned =
                orders.where((o) => o.status == 'returned').length;
            final settled = orders
                .where((o) =>
                    o.status == 'reconciled' || o.status == 'settled')
                .length;

            return ListView(
              padding: const EdgeInsets.all(16),
              children: [
                // Summary cards
                Row(
                  children: [
                    _StatCard(
                        label: 'Active',
                        value: '$active',
                        color: AppColors.info),
                    const SizedBox(width: 10),
                    _StatCard(
                        label: 'Returned',
                        value: '$returned',
                        color: AppColors.warning),
                    const SizedBox(width: 10),
                    _StatCard(
                        label: 'Settled',
                        value: '$settled',
                        color: AppColors.success),
                  ],
                ),
                const SizedBox(height: 20),

                // Recent work orders
                const Text('Recent Work Orders',
                    style: TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 16,
                        color: AppColors.textPrimary)),
                const SizedBox(height: 10),

                if (orders.isEmpty)
                  const Center(
                    child: Padding(
                      padding: EdgeInsets.all(40),
                      child: Column(
                        children: [
                          Icon(Icons.layers_outlined,
                              size: 48, color: AppColors.textMuted),
                          SizedBox(height: 8),
                          Text('No work orders yet',
                              style:
                                  TextStyle(color: AppColors.textMuted)),
                        ],
                      ),
                    ),
                  )
                else
                  ...orders.take(10).map(
                        (o) => _WeaverZigCard(
                          order: o,
                          onTap: () => Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) =>
                                  WeaverZigDetailScreen(zigId: o.zigId),
                            ),
                          ),
                        ),
                      ),

                if (state.errorMessage != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 16),
                    child: Text(state.errorMessage!,
                        style: const TextStyle(color: AppColors.danger)),
                  ),
              ],
            );
          },
        ),
      ),
    );
  }
}

// ─── Summary card ───────────────────────────────────────────────────────────

class _StatCard extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  const _StatCard(
      {required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Card(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 12),
          child: Column(
            children: [
              Text(value,
                  style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.w700,
                      color: color)),
              const SizedBox(height: 2),
              Text(label,
                  style: const TextStyle(
                      fontSize: 11, color: AppColors.textMuted)),
            ],
          ),
        ),
      ),
    );
  }
}

// ─── Work order card ────────────────────────────────────────────────────────

class _WeaverZigCard extends StatelessWidget {
  final WorkOrder order;
  final VoidCallback onTap;
  const _WeaverZigCard({required this.order, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        onTap: onTap,
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        leading: CircleAvatar(
          radius: 18,
          backgroundColor:
              AppColors.statusBgColor(order.status),
          child: Icon(Icons.layers,
              size: 18, color: AppColors.statusColor(order.status)),
        ),
        title: Text('Zig #${order.zigId}',
            style:
                const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
        subtitle: Text(
          '${order.fabricVariant?.displayName ?? 'Fabric'} · ${Formatters.date(order.dateIssued)}',
          style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
        ),
        trailing: Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
          decoration: BoxDecoration(
            color: AppColors.statusBgColor(order.status),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Text(
            order.status.replaceAll('_', ' '),
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: AppColors.statusColor(order.status),
            ),
          ),
        ),
      ),
    );
  }
}
