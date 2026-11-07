import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/utils/formatters.dart';
import '../blocs/audit_bloc.dart';
import '../blocs/audit_event.dart';
import '../blocs/audit_state.dart';

class AuditLogsPage extends StatefulWidget {
  const AuditLogsPage({super.key});

  @override
  State<AuditLogsPage> createState() => _AuditLogsPageState();
}

class _AuditLogsPageState extends State<AuditLogsPage> {
  String? _selectedEntity;

  @override
  void initState() {
    super.initState();
    context.read<AuditBloc>().add(const LoadAuditLogs());
  }

  void _onFilterChanged(String? entityType) {
    setState(() => _selectedEntity = entityType);
    context.read<AuditBloc>().add(LoadAuditLogs(entityType: _selectedEntity));
  }

  Color _actionColor(String action) {
    final lower = action.toLowerCase();
    if (lower.contains('create') || lower.contains('add')) return AppColors.success;
    if (lower.contains('update') || lower.contains('status')) return AppColors.info;
    if (lower.contains('delete') || lower.contains('cancel')) return AppColors.danger;
    if (lower.contains('pay') || lower.contains('commit')) return AppColors.adminPrimary;
    return Colors.blueGrey;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('System Audit Logs (የቁጥጥር መዝገብ)'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => _onFilterChanged(_selectedEntity),
          ),
        ],
      ),
      body: Column(
        children: [
          // Filter Chips
          Container(
            color: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  ChoiceChip(
                    label: const Text('All Entities'),
                    selected: _selectedEntity == null,
                    onSelected: (val) {
                      if (val) _onFilterChanged(null);
                    },
                  ),
                  const SizedBox(width: 8),
                  ChoiceChip(
                    label: const Text('Work Orders'),
                    selected: _selectedEntity == 'work_order',
                    onSelected: (val) => _onFilterChanged(val ? 'work_order' : null),
                  ),
                  const SizedBox(width: 8),
                  ChoiceChip(
                    label: const Text('Settlements'),
                    selected: _selectedEntity == 'settlement',
                    onSelected: (val) => _onFilterChanged(val ? 'settlement' : null),
                  ),
                  const SizedBox(width: 8),
                  ChoiceChip(
                    label: const Text('Pricing'),
                    selected: _selectedEntity == 'pricing',
                    onSelected: (val) => _onFilterChanged(val ? 'pricing' : null),
                  ),
                  const SizedBox(width: 8),
                  ChoiceChip(
                    label: const Text('Transactions'),
                    selected: _selectedEntity == 'direct_transaction',
                    onSelected: (val) => _onFilterChanged(val ? 'direct_transaction' : null),
                  ),
                  const SizedBox(width: 8),
                  ChoiceChip(
                    label: const Text('Users'),
                    selected: _selectedEntity == 'user',
                    onSelected: (val) => _onFilterChanged(val ? 'user' : null),
                  ),
                ],
              ),
            ),
          ),

          // Audit Timeline List
          Expanded(
            child: BlocBuilder<AuditBloc, AuditState>(
              builder: (context, state) {
                if (state.status == AuditStatus.loading && state.logs.isEmpty) {
                  return const Center(child: CircularProgressIndicator());
                }

                if (state.logs.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.history_outlined, size: 64, color: AppColors.textMuted),
                        const SizedBox(height: 12),
                        const Text('No audit logs recorded for this criteria.'),
                      ],
                    ),
                  );
                }

                return RefreshIndicator(
                  onRefresh: () async => _onFilterChanged(_selectedEntity),
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: state.logs.length,
                    separatorBuilder: (_, _) => const SizedBox(height: 10),
                    itemBuilder: (context, index) {
                      final item = state.logs[index];
                      final color = _actionColor(item.action);

                      return Card(
                        child: ExpansionTile(
                          leading: CircleAvatar(
                            backgroundColor: color.withValues(alpha: 0.12),
                            child: Icon(Icons.shield_outlined, color: color, size: 20),
                          ),
                          title: Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: color.withValues(alpha: 0.12),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  item.action.toUpperCase(),
                                  style: TextStyle(
                                    color: color,
                                    fontSize: 10,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  '${item.entityType} ${item.entityId != null ? "#${item.entityId}" : ""}',
                                  style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13.5),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                          subtitle: Text(
                            'By @${item.actorUsername} · ${Formatters.date(item.createdAt)}',
                            style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                          ),
                          children: [
                            Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.stretch,
                                children: [
                                  if (item.ipAddress != null)
                                    Text(
                                      'IP Address: ${item.ipAddress}',
                                      style: const TextStyle(fontSize: 11.5, color: AppColors.textMuted),
                                    ),
                                  const SizedBox(height: 6),
                                  Container(
                                    padding: const EdgeInsets.all(10),
                                    decoration: BoxDecoration(
                                      color: Colors.grey.shade100,
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                    child: SelectableText(
                                      item.details is Map || item.details is List
                                          ? const JsonEncoder.withIndent('  ').convert(item.details)
                                          : (item.details?.toString() ?? 'No details payload'),
                                      style: const TextStyle(
                                        fontFamily: 'monospace',
                                        fontSize: 11,
                                        color: Colors.black87,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
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
