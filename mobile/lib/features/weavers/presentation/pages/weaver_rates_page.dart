import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/utils/formatters.dart';
import '../../../products/presentation/blocs/stock_bloc.dart';
import '../../../products/presentation/blocs/stock_event.dart';
import '../../../products/presentation/blocs/stock_state.dart';

class WeaverRatesPage extends StatefulWidget {
  const WeaverRatesPage({super.key});

  @override
  State<WeaverRatesPage> createState() => _WeaverRatesPageState();
}

class _WeaverRatesPageState extends State<WeaverRatesPage> {
  @override
  void initState() {
    super.initState();
    context.read<StockBloc>().add(LoadStockAndCatalog());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Weaver Rates (የዋጋና ተመን ግልጽነት)'),
      ),
      body: BlocBuilder<StockBloc, StockState>(
        builder: (context, state) {
          if (state.status == StockStatus.loading &&
              state.fabricVariants.isEmpty) {
            return const Center(child: CircularProgressIndicator());
          }

          final fabricVariants = state.fabricVariants;
          final yarnVariants = state.yarnVariants;

          return DefaultTabController(
            length: 2,
            child: Column(
              children: [
                Container(
                  color: Colors.white,
                  child: const TabBar(
                    labelColor: AppColors.adminPrimary,
                    unselectedLabelColor: AppColors.textSecondary,
                    indicatorColor: AppColors.adminPrimary,
                    tabs: [
                      Tab(text: 'Fabric Piece Rates (ጨርቅ)'),
                      Tab(text: 'Yarn Catalog Prices (ክር)'),
                    ],
                  ),
                ),
                Expanded(
                  child: TabBarView(
                    children: [
                      // Fabric Tab
                      fabricVariants.isEmpty
                          ? const Center(child: Text('No fabric rates registered.'))
                          : ListView.separated(
                              padding: const EdgeInsets.all(16),
                              itemCount: fabricVariants.length,
                              separatorBuilder: (context, index) =>
                                  const SizedBox(height: 10),
                              itemBuilder: (context, index) {
                                final variant = fabricVariants[index];
                                final rate = variant.basePrice ??
                                    variant.product?.basePrice ??
                                    0.0;
                                final length = variant.product?.standardLengthCm ?? '-';
                                final width = variant.product?.standardWidthCm ?? '-';

                                return Card(
                                  elevation: 1,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(10),
                                    side: const BorderSide(
                                      color: Color(0xFFE2E8F0),
                                    ),
                                  ),
                                  child: Padding(
                                    padding: const EdgeInsets.all(14),
                                    child: Row(
                                      mainAxisAlignment:
                                          MainAxisAlignment.spaceBetween,
                                      children: [
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment:
                                                CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                variant.displayName,
                                                style: const TextStyle(
                                                  fontWeight: FontWeight.w700,
                                                  fontSize: 14,
                                                ),
                                              ),
                                              const SizedBox(height: 4),
                                              Text(
                                                'SKU: ${variant.sku} · Size: $length × $width cm',
                                                style: const TextStyle(
                                                  fontSize: 12,
                                                  color: AppColors.textMuted,
                                                ),
                                              ),
                                              const SizedBox(height: 2),
                                              Text(
                                                'In Stock: ${variant.stockSnapshot.round()} pieces',
                                                style: const TextStyle(
                                                  fontSize: 12,
                                                  color: AppColors.textSecondary,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                        Container(
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: 12,
                                            vertical: 8,
                                          ),
                                          decoration: BoxDecoration(
                                            color: const Color(0xFFF0FDF4),
                                            borderRadius:
                                                BorderRadius.circular(8),
                                            border: Border.all(
                                              color: const Color(0xFFBBF7D0),
                                            ),
                                          ),
                                          child: Column(
                                            crossAxisAlignment:
                                                CrossAxisAlignment.end,
                                            children: [
                                              Text(
                                                Formatters.currency(rate),
                                                style: const TextStyle(
                                                  fontWeight: FontWeight.w800,
                                                  fontSize: 15,
                                                  color: AppColors.success,
                                                ),
                                              ),
                                              const Text(
                                                'per piece',
                                                style: TextStyle(
                                                  fontSize: 11,
                                                  color: AppColors.textMuted,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                );
                              },
                            ),

                      // Yarn Tab
                      yarnVariants.isEmpty
                          ? const Center(child: Text('No yarn rates registered.'))
                          : ListView.separated(
                              padding: const EdgeInsets.all(16),
                              itemCount: yarnVariants.length,
                              separatorBuilder: (context, index) =>
                                  const SizedBox(height: 10),
                              itemBuilder: (context, index) {
                                final variant = yarnVariants[index];
                                return Card(
                                  elevation: 1,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(10),
                                    side: const BorderSide(
                                      color: Color(0xFFE2E8F0),
                                    ),
                                  ),
                                  child: Padding(
                                    padding: const EdgeInsets.all(14),
                                    child: Row(
                                      mainAxisAlignment:
                                          MainAxisAlignment.spaceBetween,
                                      children: [
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment:
                                                CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                variant.displayName,
                                                style: const TextStyle(
                                                  fontWeight: FontWeight.w700,
                                                  fontSize: 14,
                                                ),
                                              ),
                                              const SizedBox(height: 4),
                                              Text(
                                                'SKU: ${variant.sku}',
                                                style: const TextStyle(
                                                  fontSize: 12,
                                                  color: AppColors.textMuted,
                                                ),
                                              ),
                                              const SizedBox(height: 2),
                                              Text(
                                                'Available Stock: ${variant.stockSnapshot.round()} pcs',
                                                style: const TextStyle(
                                                  fontSize: 12,
                                                  color: AppColors.textSecondary,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                        Container(
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: 12,
                                            vertical: 8,
                                          ),
                                          decoration: BoxDecoration(
                                            color: const Color(0xFFFFF7ED),
                                            borderRadius:
                                                BorderRadius.circular(8),
                                            border: Border.all(
                                              color: const Color(0xFFFED7AA),
                                            ),
                                          ),
                                          child: Column(
                                            crossAxisAlignment:
                                                CrossAxisAlignment.end,
                                            children: [
                                              Text(
                                                Formatters.currency(
                                                  variant.basePrice,
                                                ),
                                                style: const TextStyle(
                                                  fontWeight: FontWeight.w800,
                                                  fontSize: 15,
                                                  color: AppColors.adminPrimary,
                                                ),
                                              ),
                                              const Text(
                                                'unit price',
                                                style: TextStyle(
                                                  fontSize: 11,
                                                  color: AppColors.textMuted,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                );
                              },
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
  }
}
