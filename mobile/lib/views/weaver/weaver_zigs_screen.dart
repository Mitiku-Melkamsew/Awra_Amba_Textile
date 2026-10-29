import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../blocs/auth/auth_bloc.dart';
import '../../blocs/work_orders/work_orders_bloc.dart';
import '../../blocs/work_orders/work_orders_event.dart';
import '../../blocs/work_orders/work_orders_state.dart';
import '../../core/constants/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../models/work_order.dart';
import '../widgets/custom_widgets.dart';
import 'weaver_zig_detail_screen.dart';

class WeaverZigsScreen extends StatefulWidget {
  const WeaverZigsScreen({super.key});

  @override
  State<WeaverZigsScreen> createState() => _WeaverZigsScreenState();
}

class _WeaverZigsScreenState extends State<WeaverZigsScreen> {
  String? _selectedStatus;
  String _searchQuery = '';

  final List<Map<String, String?>> _filters = const [
    {'label': 'All', 'value': null},
    {'label': 'Assigned', 'value': 'assigned'},
    {'label': 'In Progress', 'value': 'in_progress'},
    {'label': 'Returned', 'value': 'returned'},
    {'label': 'Reconciled', 'value': 'reconciled'},
  ];

  @override
  void initState() {
    super.initState();
    _fetchZigs();
  }

  void _fetchZigs() {
    final weaverId = context.read<AuthBloc>().state.user?.weaverId;
    if (weaverId != null) {
      context.read<WorkOrdersBloc>().add(
            LoadWorkOrders(status: _selectedStatus, weaverId: weaverId),
          );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Work Orders (የኔ ዚጎች)'),
        backgroundColor: AppColors.weaverPrimary,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _fetchZigs,
          ),
        ],
      ),
      body: Column(
        children: [
          // Search & Filter header
          Container(
            color: Colors.white,
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: Column(
              children: [
                TextField(
                  decoration: InputDecoration(
                    hintText: 'Search by Zig ID or Product...',
                    prefixIcon: const Icon(Icons.search, size: 20),
                    isDense: true,
                    contentPadding: const EdgeInsets.symmetric(
                        horizontal: 12, vertical: 10),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                      borderSide: const BorderSide(color: AppColors.border),
                    ),
                  ),
                  onChanged: (val) {
                    setState(() {
                      _searchQuery = val.trim().toLowerCase();
                    });
                  },
                ),
                const SizedBox(height: 8),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: _filters.map((filter) {
                      final isSelected = _selectedStatus == filter['value'];
                      return Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: FilterChip(
                          label: Text(filter['label']!),
                          selected: isSelected,
                          selectedColor:
                              AppColors.weaverAccent.withOpacity(0.18),
                          labelStyle: TextStyle(
                            fontSize: 12,
                            fontWeight: isSelected
                                ? FontWeight.w700
                                : FontWeight.w500,
                            color: isSelected
                                ? AppColors.weaverPrimary
                                : AppColors.textSecondary,
                          ),
                          onSelected: (selected) {
                            setState(() {
                              _selectedStatus = filter['value'];
                            });
                            _fetchZigs();
                          },
                        ),
                      );
                    }).toList(),
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1),

          // Work orders list
          Expanded(
            child: BlocBuilder<WorkOrdersBloc, WorkOrdersState>(
              builder: (context, state) {
                if (state.status == WorkOrdersStatus.loading &&
                    state.workOrders.isEmpty) {
                  return const Center(child: CircularProgressIndicator());
                }

                if (state.status == WorkOrdersStatus.error &&
                    state.workOrders.isEmpty) {
                  return Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.error_outline,
                              size: 40, color: AppColors.danger),
                          const SizedBox(height: 12),
                          Text(state.errorMessage ?? 'Failed to load work orders',
                              textAlign: TextAlign.center),
                          const SizedBox(height: 16),
                          ElevatedButton.icon(
                            onPressed: _fetchZigs,
                            icon: const Icon(Icons.refresh, size: 18),
                            label: const Text('Retry'),
                          ),
                        ],
                      ),
                    ),
                  );
                }

                final filtered = state.workOrders.where((o) {
                  if (_searchQuery.isEmpty) return true;
                  final matchZig = o.zigId.toLowerCase().contains(_searchQuery);
                  final matchProduct =
                      (o.fabricVariant?.displayName ?? '').toLowerCase().contains(_searchQuery);
                  return matchZig || matchProduct;
                }).toList();

                if (filtered.isEmpty) {
                  return const EmptyState(
                    icon: Icons.layers_outlined,
                    title: 'No Work Orders',
                    subtitle: 'No zigs found matching the criteria.',
                  );
                }

                return RefreshIndicator(
                  onRefresh: () async => _fetchZigs(),
                  child: ListView.separated(
                    padding: const EdgeInsets.all(12),
                    itemCount: filtered.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (context, index) {
                      final order = filtered[index];
                      return _WeaverZigListItem(
                        order: order,
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) =>
                                  WeaverZigDetailScreen(zigId: order.zigId),
                            ),
                          );
                        },
                      );
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _WeaverZigListItem extends StatelessWidget {
  final WorkOrder order;
  final VoidCallback onTap;

  const _WeaverZigListItem({required this.order, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: AppColors.weaverPrimary.withOpacity(0.08),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          'Zig #${order.zigId}',
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: AppColors.weaverPrimary,
                          ),
                        ),
                      ),
                    ],
                  ),
                  StatusBadge(status: order.status),
                ],
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  const Icon(Icons.checkroom,
                      size: 16, color: AppColors.textMuted),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      order.fabricVariant?.displayName ?? 'Standard Fabric',
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textPrimary,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Issued: ${Formatters.date(order.dateIssued)}',
                    style: const TextStyle(
                        fontSize: 12, color: AppColors.textSecondary),
                  ),
                  if (order.fabricVariant?.basePrice != null)
                    Text(
                      'Base: ${Formatters.currency(order.fabricVariant!.basePrice)}',
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textSecondary,
                      ),
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
