import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/utils/formatters.dart';
import '../../../products/domain/entities/product_entity.dart';
import '../../../products/presentation/blocs/stock_bloc.dart';
import '../../../products/presentation/blocs/stock_event.dart';
import '../../../products/presentation/blocs/stock_state.dart';

class WeaverCalculatorPage extends StatefulWidget {
  const WeaverCalculatorPage({super.key});

  @override
  State<WeaverCalculatorPage> createState() => _WeaverCalculatorPageState();
}

class _WeaverCalculatorPageState extends State<WeaverCalculatorPage> {
  ProductEntity? _selectedProduct;
  final _piecesCtrl = TextEditingController(text: '20');
  final _actualWeightCtrl = TextEditingController(text: '64');
  final _targetWeightCtrl = TextEditingController(text: '64');
  final _pieceRateCtrl = TextEditingController(text: '120');
  final _deductionRateCtrl = TextEditingController(text: '1.0');

  @override
  void initState() {
    super.initState();
    context.read<StockBloc>().add(LoadStockAndCatalog());
  }

  @override
  void dispose() {
    _piecesCtrl.dispose();
    _actualWeightCtrl.dispose();
    _targetWeightCtrl.dispose();
    _pieceRateCtrl.dispose();
    _deductionRateCtrl.dispose();
    super.dispose();
  }

  void _onProductSelected(ProductEntity product) {
    setState(() {
      _selectedProduct = product;
      final stdWt = 64.0;
      _targetWeightCtrl.text = stdWt.round().toString();
      _actualWeightCtrl.text = stdWt.round().toString();
      _pieceRateCtrl.text = product.basePrice.round().toString();
    });
  }

  @override
  Widget build(BuildContext context) {
    final qty = double.tryParse(_piecesCtrl.text) ?? 0.0;
    final rate = double.tryParse(_pieceRateCtrl.text) ?? 0.0;
    final targetWt = double.tryParse(_targetWeightCtrl.text) ?? 64.0;
    final actualWt = double.tryParse(_actualWeightCtrl.text) ?? 64.0;
    final deductPerGram = double.tryParse(_deductionRateCtrl.text) ?? 1.0;

    final grossEarnings = qty * rate;
    final diff = actualWt - targetWt;
    final isUnderweight = diff < -0.01;
    final underweightGrams = isUnderweight ? diff.abs() : 0.0;
    final deductionPerPiece = isUnderweight ? (underweightGrams * deductPerGram) : 0.0;
    final totalDeductions = deductionPerPiece * qty;
    final netEarnings = (grossEarnings - totalDeductions > 0)
        ? (grossEarnings - totalDeductions)
        : 0.0;
    final effectiveRate = qty > 0 ? (netEarnings / qty) : 0.0;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Wage & Quality Calculator (የገቢ ስሌት)'),
      ),
      body: BlocConsumer<StockBloc, StockState>(
        listener: (context, state) {
          if (_selectedProduct == null && state.lookup != null) {
            final fabricProducts =
                state.lookup!.products.where((p) => p.category == 'fabric').toList();
            if (fabricProducts.isNotEmpty) {
              _onProductSelected(fabricProducts.first);
            }
          }
        },
        builder: (context, state) {
          final fabricProducts = state.lookup?.products
                  .where((p) => p.category == 'fabric')
                  .toList() ??
              [];

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header Banner
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFF7ED),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: const Color(0xFFFED7AA)),
                  ),
                  child: const Row(
                    children: [
                      Icon(Icons.calculate_outlined, color: AppColors.adminPrimary, size: 28),
                      SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Artisan Wage Simulation / የሸማኔ ገቢ ስሌት',
                              style: TextStyle(
                                fontWeight: FontWeight.w700,
                                fontSize: 14,
                                color: Color(0xFF9A3412),
                              ),
                            ),
                            SizedBox(height: 2),
                            Text(
                              'Estimate gross piece earnings, quality weight tolerance deductions, and expected net earnings.',
                              style: TextStyle(
                                fontSize: 11.5,
                                color: Color(0xFF7C2D12),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // Inputs Card
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Simulation Parameters',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(height: 14),
                        if (fabricProducts.isNotEmpty)
                          DropdownButtonFormField<ProductEntity>(
                            initialValue: _selectedProduct,
                            decoration: const InputDecoration(
                              labelText: 'Fabric Product (የጨርቅ ዓይነት)',
                            ),
                            items: fabricProducts.map((p) {
                              return DropdownMenuItem(
                                value: p,
                                child: Text(p.name),
                              );
                            }).toList(),
                            onChanged: (val) {
                              if (val != null) _onProductSelected(val);
                            },
                          ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(
                              child: TextField(
                                controller: _piecesCtrl,
                                decoration: const InputDecoration(
                                  labelText: 'Pieces (ቁራጭ)',
                                  hintText: 'e.g. 20',
                                ),
                                keyboardType: TextInputType.number,
                                onChanged: (_) => setState(() {}),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: TextField(
                                controller: _pieceRateCtrl,
                                decoration: const InputDecoration(
                                  labelText: 'Rate/Piece (ETB)',
                                  hintText: 'e.g. 120',
                                ),
                                keyboardType: TextInputType.number,
                                onChanged: (_) => setState(() {}),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(
                              child: TextField(
                                controller: _targetWeightCtrl,
                                decoration: const InputDecoration(
                                  labelText: 'Target Wt (g/pc)',
                                  hintText: 'e.g. 64',
                                ),
                                keyboardType: TextInputType.number,
                                onChanged: (_) => setState(() {}),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: TextField(
                                controller: _actualWeightCtrl,
                                decoration: const InputDecoration(
                                  labelText: 'Actual Wt (g/pc)',
                                  hintText: 'e.g. 60',
                                ),
                                keyboardType: TextInputType.number,
                                onChanged: (_) => setState(() {}),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        TextField(
                          controller: _deductionRateCtrl,
                          decoration: const InputDecoration(
                            labelText: 'Deduction per gram underweight (ETB/g)',
                            hintText: 'e.g. 1.0',
                          ),
                          keyboardType: TextInputType.number,
                          onChanged: (_) => setState(() {}),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Calculation Results Card
                Card(
                  color: isUnderweight
                      ? const Color(0xFFFEF2F2)
                      : const Color(0xFFF0FDF4),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                    side: BorderSide(
                      color: isUnderweight
                          ? const Color(0xFFFCA5A5)
                          : const Color(0xFFBBF7D0),
                    ),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'Simulation Outcome',
                              style: TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 10,
                                vertical: 4,
                              ),
                              decoration: BoxDecoration(
                                color: isUnderweight
                                    ? AppColors.dangerLight
                                    : AppColors.successLight,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                isUnderweight
                                    ? '-${underweightGrams.toStringAsFixed(1)}g Underweight'
                                    : 'Specs Met âœ“',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                  color: isUnderweight
                                      ? AppColors.danger
                                      : AppColors.success,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const Divider(height: 20),
                        _ResultRow(
                          label: 'Gross Piece Earnings',
                          value: '${qty.round()} pcs Ã— ${Formatters.currency(rate)}',
                          highlight: Formatters.currency(grossEarnings),
                        ),
                        const SizedBox(height: 8),
                        _ResultRow(
                          label: 'Quality Tolerance Deduction',
                          value: isUnderweight
                              ? '-${Formatters.currency(deductionPerPiece)}/pc'
                              : '0.00 ETB',
                          highlight: '-${Formatters.currency(totalDeductions)}',
                          highlightColor: isUnderweight
                              ? AppColors.danger
                              : AppColors.textSecondary,
                        ),
                        const Divider(height: 20),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'Estimated Net Payout',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            Text(
                              Formatters.currency(netEarnings),
                              style: const TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.w800,
                                color: AppColors.adminPrimary,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Text(
                          'Effective rate: ${Formatters.currency(effectiveRate)} / piece',
                          style: const TextStyle(
                            fontSize: 12,
                            color: AppColors.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _ResultRow extends StatelessWidget {
  final String label;
  final String value;
  final String highlight;
  final Color? highlightColor;

  const _ResultRow({
    required this.label,
    required this.value,
    required this.highlight,
    this.highlightColor,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
              ),
            ),
            Text(
              value,
              style: const TextStyle(
                fontSize: 11.5,
                color: AppColors.textMuted,
              ),
            ),
          ],
        ),
        Text(
          highlight,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w700,
            color: highlightColor ?? AppColors.textPrimary,
          ),
        ),
      ],
    );
  }
}
