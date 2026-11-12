import 'package:flutter/material.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../audit/presentation/pages/audit_logs_page.dart';
import '../../../pricing/presentation/pages/prices_page.dart';
import '../../../procurement/presentation/pages/procurement_page.dart';
import '../../../products/presentation/pages/catalog_page.dart';
import '../../../products/presentation/pages/stock_page.dart';
import '../../../quality/presentation/pages/quality_rules_page.dart';
import '../../../settlement/presentation/pages/settlement_history_page.dart';
import '../../../weavers/presentation/pages/weaver_calculator_page.dart';
import '../../../weavers/presentation/pages/weaver_rates_page.dart';

class AdminMenuPage extends StatelessWidget {
  const AdminMenuPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: Builder(
          builder: (ctx) => IconButton(
            icon: const Icon(Icons.menu),
            tooltip: 'Open Menu',
            onPressed: () => Scaffold.of(ctx).openDrawer(),
          ),
        ),
        title: const Text('All Modules / ተጨማሪ አስተዳደር'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFFEA580C), Color(0xFFC2410C)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Awra Amba Textile Master Console',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  SizedBox(height: 4),
                  Text(
                    'Access catalog configuration, pricing engine, quality rules, inventory, and system audit logs.',
                    style: TextStyle(
                      color: Colors.white70,
                      fontSize: 12.5,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            const Text(
              'GOVERNANCE & MASTERS',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: AppColors.textMuted,
                letterSpacing: 0.5,
              ),
            ),
            const SizedBox(height: 10),

            _MenuGrid(
              items: [
                _MenuItem(
                  icon: Icons.inventory_2_outlined,
                  color: const Color(0xFF0284C7),
                  title: 'Stock & Inventory',
                  subtitle: 'ክምችት · Live balances',
                  onTap: () => Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const StockPage()),
                  ),
                ),
                _MenuItem(
                  icon: Icons.menu_book_outlined,
                  color: const Color(0xFF0D9488),
                  title: 'Catalog Master',
                  subtitle: 'ካታሎግ · Fabrics, yarns, colors',
                  onTap: () => Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const CatalogPage()),
                  ),
                ),
                _MenuItem(
                  icon: Icons.sell_outlined,
                  color: const Color(0xFFD97706),
                  title: 'Pricing Engine',
                  subtitle: 'ተመን · Weaver rates & prices',
                  onTap: () => Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const PricesPage()),
                  ),
                ),
                _MenuItem(
                  icon: Icons.rule_outlined,
                  color: const Color(0xFF9333EA),
                  title: 'Quality Rules',
                  subtitle: 'የጥራት ደንቦች · Deductions',
                  onTap: () => Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const QualityRulesPage()),
                  ),
                ),
                _MenuItem(
                  icon: Icons.shield_outlined,
                  color: const Color(0xFF475569),
                  title: 'Audit Logs',
                  subtitle: 'የኦዲት መዝገብ · Activity history',
                  onTap: () => Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const AuditLogsPage()),
                  ),
                ),
                _MenuItem(
                  icon: Icons.shopping_cart_outlined,
                  color: const Color(0xFF2563EB),
                  title: 'Yarn Procurement',
                  subtitle: 'የክር ግዢ · Supplier intake',
                  onTap: () => Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const ProcurementPage()),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 24),
            const Text(
              'PAYROLL & SIMULATION TOOLS',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: AppColors.textMuted,
                letterSpacing: 0.5,
              ),
            ),
            const SizedBox(height: 10),

            _MenuGrid(
              items: [
                _MenuItem(
                  icon: Icons.history_outlined,
                  color: const Color(0xFF059669),
                  title: 'Settlement History',
                  subtitle: 'የሂሳብ ታሪክ · Past batches',
                  onTap: () => Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => const SettlementHistoryPage(),
                    ),
                  ),
                ),
                _MenuItem(
                  icon: Icons.calculate_outlined,
                  color: const Color(0xFFEA580C),
                  title: 'Wage Calculator',
                  subtitle: 'የገቢ ስሌት · Deductions simulator',
                  onTap: () => Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => const WeaverCalculatorPage(),
                    ),
                  ),
                ),
                _MenuItem(
                  icon: Icons.receipt_long_outlined,
                  color: const Color(0xFF0891B2),
                  title: 'Piece Rates',
                  subtitle: 'የዋጋ ተመን · Active rates master',
                  onTap: () => Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const WeaverRatesPage()),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _MenuItem {
  final IconData icon;
  final Color color;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  const _MenuItem({
    required this.icon,
    required this.color,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });
}

class _MenuGrid extends StatelessWidget {
  final List<_MenuItem> items;
  const _MenuGrid({required this.items});

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final crossAxisCount = constraints.maxWidth > 500 ? 3 : 2;
        return GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: items.length,
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: crossAxisCount,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            childAspectRatio: 1.35,
          ),
          itemBuilder: (context, index) {
            final item = items[index];
            return Card(
              elevation: 1,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
                side: const BorderSide(color: Color(0xFFE2E8F0)),
              ),
              child: InkWell(
                borderRadius: BorderRadius.circular(12),
                onTap: item.onTap,
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: item.color.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Icon(item.icon, color: item.color, size: 22),
                      ),
                      const Spacer(),
                      Text(
                        item.title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        item.subtitle,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 11,
                          color: AppColors.textMuted,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        );
      },
    );
  }
}
