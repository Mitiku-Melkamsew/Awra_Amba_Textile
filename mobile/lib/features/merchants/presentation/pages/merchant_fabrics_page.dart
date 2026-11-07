import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/utils/formatters.dart';
import '../blocs/merchants_bloc.dart';
import '../blocs/merchants_event.dart';
import '../blocs/merchants_state.dart';

class MerchantFabricsPage extends StatefulWidget {
  const MerchantFabricsPage({super.key});

  @override
  State<MerchantFabricsPage> createState() => _MerchantFabricsPageState();
}

class _MerchantFabricsPageState extends State<MerchantFabricsPage> {
  final TextEditingController _searchCtrl = TextEditingController();
  String _search = '';

  @override
  void initState() {
    super.initState();
    context.read<MerchantsBloc>().add(LoadAvailableFabrics());
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: RefreshIndicator(
        onRefresh: () async {
          context.read<MerchantsBloc>().add(LoadAvailableFabrics());
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // ── Welcome Banner ──
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF075985), Color(0xFF0369A1)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(14),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF0369A1).withValues(alpha: 0.25),
                      blurRadius: 16,
                      offset: const Offset(0, 6),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.18),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text('🇪🇹 ', style: TextStyle(fontSize: 12)),
                          Text(
                            'አውራ አምባ ማህበር የጨርቅ ካታሎግ',
                            style: TextStyle(
                              color: Color(0xFFBAE6FD),
                              fontSize: 11.5,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 10),
                    const Text(
                      'Available Fabrics Catalog\nየሚገኙ ጨርቆች',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                        height: 1.2,
                      ),
                    ),
                    const SizedBox(height: 6),
                    const Text(
                      'Browse artisan-crafted cooperative fabrics with official technical specifications and current verified cooperative selling prices.',
                      style: TextStyle(
                        color: Color(0xFFE0F2FE),
                        fontSize: 12.5,
                        height: 1.4,
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 14),

              // ── Wholesale Ordering Notice ──
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFFEFF6FF),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFFBFDBFE)),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.info_outline, color: Color(0xFF1E40AF), size: 20),
                    const SizedBox(width: 10),
                    Expanded(
                      child: RichText(
                        text: const TextSpan(
                          style: TextStyle(color: Color(0xFF1E40AF), fontSize: 12.5, height: 1.4),
                          children: [
                            TextSpan(
                              text: 'Commercial Notice: ',
                              style: TextStyle(fontWeight: FontWeight.bold),
                            ),
                            TextSpan(
                              text:
                                  'Direct wholesale orders and merchant credit workflows are currently coordinated with cooperative management. For bulk purchase orders, contact the sales desk with the variant SKU numbers.',
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 14),

              // ── Search Field ──
              TextField(
                controller: _searchCtrl,
                onChanged: (val) => setState(() => _search = val.trim().toLowerCase()),
                decoration: InputDecoration(
                  hintText: 'Search by fabric name, SKU, design, or color...',
                  prefixIcon: const Icon(Icons.search, size: 20),
                  suffixIcon: _search.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.clear, size: 18),
                          onPressed: () {
                            _searchCtrl.clear();
                            setState(() => _search = '');
                          },
                        )
                      : null,
                ),
              ),

              const SizedBox(height: 16),

              // ── Fabric List ──
              BlocBuilder<MerchantsBloc, MerchantsState>(
                builder: (context, state) {
                  if (state.status == MerchantsStatus.loading && state.availableFabrics.isEmpty) {
                    return const Center(
                      child: Padding(
                        padding: EdgeInsets.all(32),
                        child: CircularProgressIndicator(),
                      ),
                    );
                  }

                  if (state.errorMessage != null && state.availableFabrics.isEmpty) {
                    return Center(
                      child: Padding(
                        padding: EdgeInsets.all(24),
                        child: Column(
                          children: [
                            const Icon(Icons.error_outline, size: 36, color: AppColors.danger),
                            const SizedBox(height: 10),
                            Text(state.errorMessage!),
                            const SizedBox(height: 10),
                            ElevatedButton(
                              onPressed: () =>
                                  context.read<MerchantsBloc>().add(LoadAvailableFabrics()),
                              child: const Text('Retry'),
                            ),
                          ],
                        ),
                      ),
                    );
                  }

                  final filtered = state.availableFabrics.where((f) {
                    if (_search.isEmpty) return true;
                    return f.fabricName.toLowerCase().contains(_search) ||
                        f.sku.toLowerCase().contains(_search) ||
                        f.design.toLowerCase().contains(_search) ||
                        f.warpColor.toLowerCase().contains(_search) ||
                        f.weftColor.toLowerCase().contains(_search);
                  }).toList();

                  if (filtered.isEmpty) {
                    return Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(32),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.inventory_2_outlined, size: 40, color: AppColors.textMuted),
                          const SizedBox(height: 10),
                          Text(
                            _search.isEmpty
                                ? 'No available fabrics in catalog.'
                                : 'No fabrics match "$_search"',
                            style: const TextStyle(fontWeight: FontWeight.w600, color: AppColors.textPrimary),
                          ),
                        ],
                      ),
                    );
                  }

                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: Text(
                          '${filtered.length} ${filtered.length == 1 ? "Variant" : "Variants"} Available',
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: AppColors.textSecondary,
                          ),
                        ),
                      ),
                      ListView.separated(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: filtered.length,
                        separatorBuilder: (_, _) => const SizedBox(height: 12),
                        itemBuilder: (context, index) {
                          final fabric = filtered[index];
                          return Card(
                            elevation: 0,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                              side: const BorderSide(color: Color(0xFFE2E8F0)),
                            ),
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              fabric.fabricName,
                                              style: const TextStyle(
                                                fontSize: 16,
                                                fontWeight: FontWeight.w700,
                                                color: AppColors.textPrimary,
                                              ),
                                            ),
                                            const SizedBox(height: 4),
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                              decoration: BoxDecoration(
                                                color: const Color(0xFFF1F5F9),
                                                borderRadius: BorderRadius.circular(4),
                                              ),
                                              child: Text(
                                                fabric.sku,
                                                style: const TextStyle(
                                                  fontFamily: 'monospace',
                                                  fontSize: 11,
                                                  fontWeight: FontWeight.w600,
                                                  color: Color(0xFF475569),
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                      Column(
                                        crossAxisAlignment: CrossAxisAlignment.end,
                                        children: [
                                          Text(
                                            Formatters.currency(fabric.sellingPrice),
                                            style: const TextStyle(
                                              fontSize: 16,
                                              fontWeight: FontWeight.w800,
                                              color: Color(0xFF0369A1),
                                            ),
                                          ),
                                          const Text(
                                            'Official Rate',
                                            style: TextStyle(
                                              fontSize: 10.5,
                                              color: AppColors.textMuted,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                  const Divider(height: 20),
                                  Wrap(
                                    spacing: 8,
                                    runSpacing: 6,
                                    children: [
                                      _FeatureChip(
                                        icon: Icons.palette_outlined,
                                        label: 'Design: ${fabric.design}',
                                      ),
                                      _FeatureChip(
                                        icon: Icons.format_color_fill,
                                        label: 'Warp: ${fabric.warpColor}',
                                      ),
                                      _FeatureChip(
                                        icon: Icons.texture,
                                        label: 'Weft: ${fabric.weftColor}',
                                      ),
                                      _FeatureChip(
                                        icon: Icons.straighten,
                                        label: fabric.dimensionsText,
                                      ),
                                    ],
                                  ),
                                ],
                              ),
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

class _FeatureChip extends StatelessWidget {
  final IconData icon;
  final String label;

  const _FeatureChip({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 13, color: const Color(0xFF64748B)),
          const SizedBox(width: 4),
          Text(
            label,
            style: const TextStyle(
              fontSize: 11.5,
              fontWeight: FontWeight.w500,
              color: Color(0xFF334155),
            ),
          ),
        ],
      ),
    );
  }
}
