import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../blocs/settlement/settlement_bloc.dart';
import '../../../blocs/settlement/settlement_event.dart';
import '../../../blocs/settlement/settlement_state.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../models/settlement_preview.dart';

/// Master payroll table showing all weavers' fabric returns, yarn costs,
/// deductions, and net profits — mirrors report_generator_3.py layout.
class MasterHisabPreviewScreen extends StatefulWidget {
  final BatchSettlementPreview? preview;
  final String? previewId;

  const MasterHisabPreviewScreen({
    super.key,
    this.preview,
    this.previewId,
  }) : assert(preview != null || previewId != null);

  @override
  State<MasterHisabPreviewScreen> createState() =>
      _MasterHisabPreviewScreenState();
}

class _MasterHisabPreviewScreenState extends State<MasterHisabPreviewScreen> {
  @override
  void initState() {
    super.initState();
    if (widget.preview == null && widget.previewId != null) {
      context
          .read<SettlementBloc>()
          .add(LoadSettlementPreviewDetail(widget.previewId!));
    }
  }

  void _reload() {
    final id = widget.preview?.previewId ?? widget.previewId;
    if (id != null) {
      context.read<SettlementBloc>().add(LoadSettlementPreviewDetail(id));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('ሂሳብ ሪፖርት'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _reload,
          ),
        ],
      ),
      body: BlocBuilder<SettlementBloc, SettlementState>(
        builder: (context, state) {
          final effectivePreview = widget.preview ?? state.preview;

          if (state.status == SettlementStatus.previewing &&
              effectivePreview == null) {
            return const Center(child: CircularProgressIndicator());
          }
          if (state.status == SettlementStatus.error &&
              effectivePreview == null) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Text(state.errorMessage ?? 'Failed to load preview',
                    style: const TextStyle(color: AppColors.danger)),
              ),
            );
          }
          if (effectivePreview == null) {
            return const Center(child: Text('No preview data'));
          }
          return _MasterPayrollBody(preview: effectivePreview);
        },
      ),
    );
  }
}

class _MasterPayrollBody extends StatelessWidget {
  final BatchSettlementPreview preview;
  const _MasterPayrollBody({required this.preview});

  @override
  Widget build(BuildContext context) {
    // Compute grand totals
    int grandFabricQty = 0;
    double grandFabricValue = 0;
    double grandYarnQty = 0;
    double grandYarnTotal = 0;
    double grandNetProfit = 0;

    for (final w in preview.weavers) {
      for (final z in w.zigDetails) {
        for (final r in z.returns) {
          grandFabricQty += r.quantityReturned;
        }
        grandFabricValue += z.fabricTotal;
        grandYarnQty += z.yarnQty;
        grandYarnTotal += z.yarnTotal;
        grandNetProfit += z.netProfit;
      }
    }

    return Column(
      children: [
        // Header
        Container(
          width: double.infinity,
          color: AppColors.adminPrimary.withValues(alpha: 0.06),
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('አዕራ አምባ ቴክስታይል',
                  style: TextStyle(
                      fontSize: 13,
                      color: AppColors.textSecondary,
                      letterSpacing: 0.5)),
              const SizedBox(height: 2),
              Text(
                'HISAB — ሂሳብ ሪፖርት',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: AppColors.adminPrimary,
                ),
              ),
              const SizedBox(height: 6),
              if (preview.generatedAt != null)
                Text('ቀን: ${Formatters.date(preview.generatedAt)}',
                    style: const TextStyle(fontSize: 12)),
              if (preview.cutoffDate != null)
                Text('Cutoff: ${Formatters.date(preview.cutoffDate)}',
                    style: const TextStyle(fontSize: 12)),
              const SizedBox(height: 4),
              Row(
                children: [
                  _Chip(
                      label: '${preview.weaverCount} weavers',
                      color: AppColors.info),
                  const SizedBox(width: 8),
                  _Chip(
                      label: Formatters.currency(preview.grandTotal),
                      color: AppColors.success),
                ],
              ),
              if (preview.amharicAmountInWords.isNotEmpty) ...[
                const SizedBox(height: 4),
                Text(preview.amharicAmountInWords,
                    style: const TextStyle(
                        fontSize: 12, fontStyle: FontStyle.italic)),
              ],
            ],
          ),
        ),

        // Grand totals summary bar
        Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          color: AppColors.adminPrimary.withValues(alpha: 0.03),
          child: Wrap(
            spacing: 16,
            runSpacing: 6,
            children: [
              _SmallStat('ጨርቃ ጨርቅ', grandFabricQty.toString()),
              _SmallStat('Fabric Value', Formatters.currency(grandFabricValue)),
              _SmallStat('Yarn Qty', Formatters.number(grandYarnQty)),
              _SmallStat('Yarn Total', Formatters.currency(grandYarnTotal)),
              _SmallStat(
                  'ድምር Net Profit', Formatters.currency(grandNetProfit)),
            ],
          ),
        ),

        const Divider(height: 1),

        // Weaver cards list
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.fromLTRB(12, 8, 12, 24),
            itemCount: preview.weavers.length,
            itemBuilder: (context, idx) =>
                _WeaverPayrollCard(weaver: preview.weavers[idx]),
          ),
        ),
      ],
    );
  }
}

// ─── Weaver Card ────────────────────────────────────────────────────────────

class _WeaverPayrollCard extends StatelessWidget {
  final WeaverSettlementDetail weaver;
  const _WeaverPayrollCard({required this.weaver});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 6),
      child: Theme(
        data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
        child: ExpansionTile(
          tilePadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
          childrenPadding:
              const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          leading: CircleAvatar(
            radius: 18,
            backgroundColor: AppColors.adminAccent.withValues(alpha: 0.15),
            child: Text(
              '${weaver.weaverId}',
              style: const TextStyle(
                  fontWeight: FontWeight.w700,
                  fontSize: 12,
                  color: AppColors.adminPrimary),
            ),
          ),
          title: Text(weaver.weaverName,
              style:
                  const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
          subtitle: Text(
              '${weaver.zigIds.length} zig(s) · Net: ${Formatters.currency(weaver.netSettlement)}',
              style: const TextStyle(fontSize: 12, color: AppColors.textMuted)),
          trailing: Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: weaver.netSettlement >= 0
                  ? AppColors.successLight
                  : AppColors.dangerLight,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              Formatters.currency(weaver.netSettlement),
              style: TextStyle(
                fontWeight: FontWeight.w700,
                fontSize: 12,
                color: weaver.netSettlement >= 0
                    ? AppColors.success
                    : AppColors.danger,
              ),
            ),
          ),
          children: [
            for (final zig in weaver.zigDetails)
              _ZigSection(zig: zig),
          ],
        ),
      ),
    );
  }
}

// ─── Zig Section ────────────────────────────────────────────────────────────

class _ZigSection extends StatelessWidget {
  final ZigDetail zig;
  const _ZigSection({required this.zig});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Divider(height: 16),
        // Zig header
        Row(
          children: [
            Icon(Icons.layers, size: 16, color: AppColors.adminPrimary),
            const SizedBox(width: 6),
            Text('Zig ${zig.zigId}',
                style:
                    const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
            const Spacer(),
            Text(
              'Net: ${Formatters.currency(zig.netProfit)}',
              style: TextStyle(
                fontWeight: FontWeight.w600,
                fontSize: 12,
                color: zig.netProfit >= 0
                    ? AppColors.success
                    : AppColors.danger,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),

        // Fabric returns table
        if (zig.returns.isNotEmpty) ...[
          _MiniTable(
            headers: const [
              'Type',
              'Qty',
              'Wt',
              'Price',
              'Deduct',
              'Adj',
              'Subtotal'
            ],
            rows: zig.returns.map((r) {
              final adj = (r.unitPrice - r.deductionPerPiece).round();
              return [
                r.fabricType.isNotEmpty ? r.fabricType : '-',
                '${r.quantityReturned}',
                '${r.avgWeight.floor()}',
                '${r.unitPrice.round()}',
                r.deductionPerPiece > 0 ? '${r.deductionPerPiece.round()}' : '—',
                '$adj',
                '${r.netCredit.round()}',
              ];
            }).toList(),
          ),
        ],

        const SizedBox(height: 6),

        // Zig summary row
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
          decoration: BoxDecoration(
            color: AppColors.surfaceVariant,
            borderRadius: BorderRadius.circular(6),
          ),
          child: Row(
            children: [
              _MiniStat('Fabric', Formatters.currency(zig.fabricTotal)),
              const SizedBox(width: 16),
              _MiniStat('Yarn', '${zig.yarnQty} × ${zig.yarnAvgPrice.round()} = ${zig.yarnTotal.round()}'),
              const Spacer(),
              Text(
                'Profit: ${zig.netProfit.round()}',
                style: const TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 12,
                    color: AppColors.adminPrimary),
              ),
            ],
          ),
        ),
        const SizedBox(height: 4),
      ],
    );
  }
}

// ─── Mini Table ─────────────────────────────────────────────────────────────

class _MiniTable extends StatelessWidget {
  final List<String> headers;
  final List<List<String>> rows;
  const _MiniTable({required this.headers, required this.rows});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: DataTable(
        headingRowHeight: 30,
        dataRowMinHeight: 28,
        dataRowMaxHeight: 32,
        horizontalMargin: 8,
        columnSpacing: 14,
        headingTextStyle: const TextStyle(
            fontWeight: FontWeight.w600,
            fontSize: 11,
            color: AppColors.textSecondary),
        dataTextStyle: const TextStyle(fontSize: 12, color: AppColors.textPrimary),
        columns: headers
            .map((h) => DataColumn(
                label: Text(h),
                numeric: h != 'Type'))
            .toList(),
        rows: rows
            .map((r) => DataRow(
                cells: r
                    .map((c) => DataCell(Text(c)))
                    .toList()))
            .toList(),
      ),
    );
  }
}

// ─── Helper Widgets ─────────────────────────────────────────────────────────

class _Chip extends StatelessWidget {
  final String label;
  final Color color;
  const _Chip({required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Text(label,
          style: TextStyle(
              fontSize: 11, fontWeight: FontWeight.w600, color: color)),
    );
  }
}

class _SmallStat extends StatelessWidget {
  final String label;
  final String value;
  const _SmallStat(this.label, this.value);

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(label,
            style: const TextStyle(fontSize: 10, color: AppColors.textMuted)),
        Text(value,
            style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: AppColors.textPrimary)),
      ],
    );
  }
}

class _MiniStat extends StatelessWidget {
  final String label;
  final String value;
  const _MiniStat(this.label, this.value);

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text('$label: ',
            style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
        Text(value,
            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600)),
      ],
    );
  }
}
