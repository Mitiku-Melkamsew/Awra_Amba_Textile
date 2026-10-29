import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/custom_widgets.dart';
import '../blocs/work_orders_bloc.dart';
import '../blocs/work_orders_event.dart';
import '../blocs/work_orders_state.dart';
import 'zig_detail_page.dart';

class ZigsListPage extends StatefulWidget {
  const ZigsListPage({super.key});

  @override
  State<ZigsListPage> createState() => _ZigsListPageState();
}

class _ZigsListPageState extends State<ZigsListPage> {
  String? _selectedStatus;

  final List<Map<String, String?>> _filters = [
    {'label': 'All', 'value': null},
    {'label': 'Assigned', 'value': 'assigned'},
    {'label': 'In Progress', 'value': 'in_progress'},
    {'label': 'Returned', 'value': 'returned'},
    {'label': 'Reconciled', 'value': 'reconciled'},
  ];

  @override
  void initState() {
    super.initState();
    context.read<WorkOrdersBloc>().add(const LoadWorkOrders());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Work Orders (ዚጎች)'),
      ),
      body: Column(
        children: [
          Container(
            color: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: _filters.map((filter) {
                  final isSelected = _selectedStatus == filter['value'];
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: FilterChip(
                      label: Text(filter['label']!),
                      selected: isSelected,
                      selectedColor: AppColors.adminPrimary.withValues(alpha: 0.15),
                      labelStyle: TextStyle(
                        fontSize: 12.5,
                        fontWeight:
                            isSelected ? FontWeight.w700 : FontWeight.w500,
                        color: isSelected
                            ? AppColors.adminPrimary
                            : AppColors.textSecondary,
                      ),
                      onSelected: (selected) {
                        setState(() {
                          _selectedStatus = filter['value'];
                        });
                        context.read<WorkOrdersBloc>().add(
                              LoadWorkOrders(status: _selectedStatus),
                            );
                      },
                    ),
                  );
                }).toList(),
              ),
            ),
          ),
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
                            onPressed: () => context
                                .read<WorkOrdersBloc>()
                                .add(LoadWorkOrders(status: _selectedStatus)),
                            child: const Text('Retry'),
                          ),
                        ],
                      ),
                    ),
                  );
                }

                if (state.workOrders.isEmpty) {
                  return EmptyState(
                    title: 'No Work Orders Found',
                    message: _selectedStatus != null
                        ? 'No work orders with status "${_selectedStatus!.toUpperCase()}"'
                        : 'No work orders issued yet.',
                  );
                }

                return RefreshIndicator(
                  onRefresh: () async {
                    context.read<WorkOrdersBloc>().add(
                          LoadWorkOrders(status: _selectedStatus),
                        );
                  },
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: state.workOrders.length,
                    separatorBuilder: (_, _) => const SizedBox(height: 10),
                    itemBuilder: (context, index) {
                      final zig = state.workOrders[index];
                      return Card(
                        child: InkWell(
                          borderRadius: BorderRadius.circular(12),
                          onTap: () async {
                            await Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) =>
                                    ZigDetailPage(zigId: zig.zigId),
                              ),
                            );
                            if (!context.mounted) return;
                            context.read<WorkOrdersBloc>().add(
                                  LoadWorkOrders(status: _selectedStatus),
                                );
                          },
                          child: Padding(
                            padding: const EdgeInsets.all(14),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Text(
                                      'Zig #${zig.zigId}',
                                      style: const TextStyle(
                                        fontWeight: FontWeight.w700,
                                        fontSize: 16,
                                        color: AppColors.textPrimary,
                                      ),
                                    ),
                                    const Spacer(),
                                    StatusBadge(status: zig.status),
                                  ],
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  zig.fabricVariant?.displayName ??
                                      'Fabric Variant #${zig.fabricVariantId}',
                                  style: const TextStyle(
                                    fontSize: 13.5,
                                    fontWeight: FontWeight.w500,
                                    color: AppColors.textSecondary,
                                  ),
                                ),
                                const Divider(height: 18),
                                Row(
                                  mainAxisAlignment:
                                      MainAxisAlignment.spaceBetween,
                                  children: [
                                    Row(
                                      children: [
                                        const Icon(Icons.person_outline,
                                            size: 14,
                                            color: AppColors.textMuted),
                                        const SizedBox(width: 4),
                                        Text(
                                          zig.weaver?.fullName ??
                                              'Weaver #${zig.weaverId}',
                                          style: const TextStyle(
                                            fontSize: 12.5,
                                            fontWeight: FontWeight.w600,
                                          ),
                                        ),
                                      ],
                                    ),
                                    Text(
                                      Formatters.date(zig.dateIssued),
                                      style: const TextStyle(
                                        fontSize: 12,
                                        color: AppColors.textMuted,
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ),
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
