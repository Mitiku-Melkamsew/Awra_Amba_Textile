import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/utils/formatters.dart';
import '../blocs/quality_rules_bloc.dart';
import '../blocs/quality_rules_event.dart';
import '../blocs/quality_rules_state.dart';

class QualityRulesPage extends StatefulWidget {
  const QualityRulesPage({super.key});

  @override
  State<QualityRulesPage> createState() => _QualityRulesPageState();
}

class _QualityRulesPageState extends State<QualityRulesPage> {
  @override
  void initState() {
    super.initState();
    context.read<QualityRulesBloc>().add(LoadQualityRules());
  }

  void _showAddRuleDialog() {
    final factorCtrl = TextEditingController();
    final unitCtrl = TextEditingController(text: 'piece');
    final deductionCtrl = TextEditingController(text: '10');

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Add Quality Rule / የጥራት ቅጣት ደንብ'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: factorCtrl,
                decoration: const InputDecoration(
                  labelText: 'Defect Factor (ጉድለት አይነት)',
                  hintText: 'e.g. Underweight, Stain, Loose Weave',
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: unitCtrl,
                decoration: const InputDecoration(
                  labelText: 'Deduction Unit (መለኪያ)',
                  hintText: 'e.g. piece, gram, meter',
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: deductionCtrl,
                decoration: const InputDecoration(
                  labelText: 'Deduction Per Unit (ETB)',
                ),
                keyboardType: TextInputType.number,
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              final factor = factorCtrl.text.trim();
              final unit = unitCtrl.text.trim();
              final ded = double.tryParse(deductionCtrl.text) ?? 0.0;
              if (factor.isEmpty || ded <= 0) return;
              context.read<QualityRulesBloc>().add(
                CreateQualityRuleSubmitted(
                  factor: factor,
                  unit: unit.isNotEmpty ? unit : 'piece',
                  deductionPerUnit: ded,
                ),
              );
              Navigator.pop(ctx);
            },
            child: const Text('Save Rule'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Quality Deduction Rules (የጥራት ደንቦች)'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => context.read<QualityRulesBloc>().add(LoadQualityRules()),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: AppColors.adminPrimary,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add),
        label: const Text('New Quality Rule'),
        onPressed: _showAddRuleDialog,
      ),
      body: BlocConsumer<QualityRulesBloc, QualityRulesState>(
        listener: (context, state) {
          if (state.status == QualityRulesStatus.actionSuccess && state.successMessage != null) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text(state.successMessage!), backgroundColor: AppColors.success),
            );
          }
          if (state.status == QualityRulesStatus.error && state.errorMessage != null) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text(state.errorMessage!), backgroundColor: AppColors.danger),
            );
          }
        },
        builder: (context, state) {
          if (state.status == QualityRulesStatus.loading && state.rules.isEmpty) {
            return const Center(child: CircularProgressIndicator());
          }

          if (state.rules.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.rule_outlined, size: 64, color: AppColors.textMuted),
                  const SizedBox(height: 12),
                  const Text('No quality deduction rules registered.'),
                  const SizedBox(height: 16),
                  ElevatedButton.icon(
                    icon: const Icon(Icons.add),
                    label: const Text('Add First Rule'),
                    onPressed: _showAddRuleDialog,
                  ),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () async => context.read<QualityRulesBloc>().add(LoadQualityRules()),
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: state.rules.length,
              separatorBuilder: (_, _) => const SizedBox(height: 8),
              itemBuilder: (context, index) {
                final rule = state.rules[index];
                return Card(
                  child: ListTile(
                    leading: CircleAvatar(
                      backgroundColor: rule.isActive
                          ? AppColors.danger.withValues(alpha: 0.12)
                          : Colors.grey.withValues(alpha: 0.15),
                      child: const Icon(Icons.warning_amber_rounded, color: AppColors.danger),
                    ),
                    title: Text(
                      rule.factor,
                      style: const TextStyle(fontWeight: FontWeight.w700),
                    ),
                    subtitle: Text(
                      'Unit: ${rule.unit} · Penalty: -${Formatters.currency(rule.deductionPerUnit)} / ${rule.unit}',
                      style: const TextStyle(fontSize: 12.5),
                    ),
                    trailing: Switch(
                      value: rule.isActive,
                      activeThumbColor: AppColors.adminPrimary,
                      onChanged: (val) {
                        context.read<QualityRulesBloc>().add(
                          ToggleQualityRuleStatusSubmitted(id: rule.id, newStatus: val),
                        );
                      },
                    ),
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }
}
