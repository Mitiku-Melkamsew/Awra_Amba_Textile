import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:awra_amba_textile/core/constants/app_colors.dart';
import 'package:awra_amba_textile/core/utils/formatters.dart';
import 'package:awra_amba_textile/core/widgets/custom_widgets.dart';
import 'package:awra_amba_textile/features/authentication/presentation/blocs/auth_bloc.dart';
import 'package:awra_amba_textile/features/work_orders/domain/entities/work_order_entity.dart';
import 'package:awra_amba_textile/features/work_orders/presentation/blocs/work_orders_bloc.dart';
import 'package:awra_amba_textile/features/work_orders/presentation/blocs/work_orders_event.dart';
import 'package:awra_amba_textile/features/work_orders/presentation/blocs/work_orders_state.dart';
import 'weaver_zig_detail_page.dart';

class WeaverZigsPage extends StatefulWidget {
  const WeaverZigsPage({super.key});

  @override
  State<WeaverZigsPage> createState() => _WeaverZigsPageState();
}

class _WeaverZigsPageState extends State<WeaverZigsPage> {
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
    _loadZigs();
  }

  void _loadZigs() {
    final authState = context.read<AuthBloc>().state;
    final weaverId = authState.user?.weaverId;
    context.read<WorkOrdersBloc>().add(
          LoadWorkOrders(
            weaverId: weaverId,
            status: _selectedStatus,
          ),
        );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Zigs (የእኔ ዚጎች)'),
      ),
      body: Column(
        children: [
          // Search & Filter
          Container(
            color: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Column(
              children: [
                TextField(
                  decoration: const InputDecoration(
                    hintText: 'Search by Zig ID...',
                    prefixIcon: Icon(Icons.search, size: 20),
                    contentPadding: EdgeInsets.symmetric(vertical: 10),
                  ),
                  onChanged: (val) {
                    setState(() {
                      _searchQuery = val.toLowerCase();
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
                              AppColors.weaverPrimary.withValues(alpha: 0.15),
                          labelStyle: TextStyle(
                            fontSize: 12.5,
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
                            _loadZigs();
                          },
                        ),
                      );
                    }).toList(),
                  ),
                ),
              ],
            ),
          ),

          // Zigs List
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
                          Text(state.errorMessage ?? 'Failed to load zigs'),
                          const SizedBox(height: 12),
                          ElevatedButton(
                            onPressed: _loadZigs,
                            child: const Text('Retry'),
                          ),
                        ],
                      ),
                    ),
                  );
                }

                var filteredZigs = state.workOrders;
                if (_searchQuery.isNotEmpty) {
                  filteredZigs = filteredZigs
                      .where((z) =>
                          z.zigId.toLowerCase().contains(_searchQuery))
                      .toList();
                }

                if (filteredZigs.isEmpty) {
                  return const EmptyState(
                    icon: Icons.layers_outlined,
                    title: 'No Zigs Found',
                    message: 'No zigs match your criteria',
                  );
                }

                return RefreshIndicator(
                  onRefresh: () async => _loadZigs(),
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: filteredZigs.length,
                    separatorBuilder: (_, _) => const SizedBox(height: 10),
                    itemBuilder: (context, index) {
                      final zig = filteredZigs[index];
                      return _WeaverZigListItem(
                        zig: zig,
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) =>
                                  WeaverZigDetailPage(zigId: zig.zigId),
                            ),
                          ).then((_) => _loadZigs());
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
  final WorkOrderEntity zig;
  final VoidCallback onTap;

  const _WeaverZigListItem({required this.zig, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Text(
                    zig.zigId,
                    style: const TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 15,
                    ),
                  ),
                  const SizedBox(width: 8),
                  StatusBadge(status: zig.status),
                  const Spacer(),
                  Text(
                    zig.fabricVariant?.displayName ?? 'Fabric',
                    style: const TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 13.5,
                      color: AppColors.weaverPrimary,
                    ),
                  ),
                ],
              ),
              const Divider(height: 18),
              Row(
                children: [
                  Expanded(
                    child: _DetailColumn(
                      label: 'Issued Date',
                      value: Formatters.date(zig.dateIssued),
                    ),
                  ),
                  Expanded(
                    child: _DetailColumn(
                      label: 'Yarn Given',
                      value: '${zig.yarnGivenCount} items',
                    ),
                  ),
                  Expanded(
                    child: _DetailColumn(
                      label: 'Returns',
                      value: '${zig.fabricReturnsCount} pcs',
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

class _DetailColumn extends StatelessWidget {
  final String label;
  final String value;

  const _DetailColumn({required this.label, required this.value});

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
            fontSize: 12.5,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }
}
