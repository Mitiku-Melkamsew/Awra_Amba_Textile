import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../audit/presentation/pages/audit_logs_page.dart';
import '../../../authentication/presentation/blocs/auth_bloc.dart';
import '../../../authentication/presentation/blocs/auth_event.dart';
import '../../../pricing/presentation/pages/prices_page.dart';
import '../../../procurement/presentation/pages/procurement_page.dart';
import '../../../products/presentation/pages/catalog_page.dart';
import '../../../products/presentation/pages/stock_page.dart';
import '../../../quality/presentation/pages/quality_rules_page.dart';
import '../../../settlement/presentation/pages/settlement_page.dart';
import '../../../transactions/presentation/pages/transactions_list_page.dart';
import '../../../users/presentation/pages/users_page.dart';
import '../../../work_orders/presentation/pages/zigs_list_page.dart';

class AdminHomePage extends StatefulWidget {
  const AdminHomePage({super.key});

  @override
  State<AdminHomePage> createState() => _AdminHomePageState();
}

class _AdminHomePageState extends State<AdminHomePage> {
  int _currentIndex = 0;

  final List<Widget> _primaryPages = const [
    ZigsListPage(),
    UsersPage(),
    TransactionsListPage(),
    ProcurementPage(),
    SettlementPage(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      drawer: Drawer(
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            DrawerHeader(
              decoration: const BoxDecoration(
                color: AppColors.adminPrimary,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Center(
                      child: Text('🧵', style: TextStyle(fontSize: 24)),
                    ),
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'Awra Amba Textile',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const Text(
                    'Admin Management Console',
                    style: TextStyle(
                      color: Colors.white70,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
            const Padding(
              padding: EdgeInsets.only(left: 16, top: 12, bottom: 4),
              child: Text(
                'PRODUCTION & OPERATIONS',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textMuted,
                  letterSpacing: 0.5,
                ),
              ),
            ),
            ListTile(
              leading: const Icon(Icons.layers_outlined),
              title: const Text('Work Orders (Zigs)'),
              selected: _currentIndex == 0,
              onTap: () {
                Navigator.pop(context);
                setState(() => _currentIndex = 0);
              },
            ),
            ListTile(
              leading: const Icon(Icons.people_outline),
              title: const Text('Users & Artisans Directory'),
              selected: _currentIndex == 1,
              onTap: () {
                Navigator.pop(context);
                setState(() => _currentIndex = 1);
              },
            ),
            ListTile(
              leading: const Icon(Icons.swap_horiz_outlined),
              title: const Text('Direct Transactions'),
              selected: _currentIndex == 2,
              onTap: () {
                Navigator.pop(context);
                setState(() => _currentIndex = 2);
              },
            ),
            ListTile(
              leading: const Icon(Icons.shopping_cart_outlined),
              title: const Text('Yarn Procurement'),
              selected: _currentIndex == 3,
              onTap: () {
                Navigator.pop(context);
                setState(() => _currentIndex = 3);
              },
            ),
            ListTile(
              leading: const Icon(Icons.calculate_outlined),
              title: const Text('Settlement (HISAB)'),
              selected: _currentIndex == 4,
              onTap: () {
                Navigator.pop(context);
                setState(() => _currentIndex = 4);
              },
            ),
            const Divider(height: 24),
            const Padding(
              padding: EdgeInsets.only(left: 16, bottom: 4),
              child: Text(
                'GOVERNANCE & MASTERS',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textMuted,
                  letterSpacing: 0.5,
                ),
              ),
            ),
            ListTile(
              leading: const Icon(Icons.sell_outlined),
              title: const Text('Pricing Engine'),
              onTap: () {
                Navigator.pop(context);
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const PricesPage()),
                );
              },
            ),
            ListTile(
              leading: const Icon(Icons.rule_outlined),
              title: const Text('Quality Deduction Rules'),
              onTap: () {
                Navigator.pop(context);
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const QualityRulesPage()),
                );
              },
            ),
            ListTile(
              leading: const Icon(Icons.inventory_2_outlined),
              title: const Text('Stock & Inventory'),
              onTap: () {
                Navigator.pop(context);
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const StockPage()),
                );
              },
            ),
            ListTile(
              leading: const Icon(Icons.menu_book_outlined),
              title: const Text('Catalog Master'),
              onTap: () {
                Navigator.pop(context);
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const CatalogPage()),
                );
              },
            ),
            ListTile(
              leading: const Icon(Icons.shield_outlined),
              title: const Text('Audit Logs'),
              onTap: () {
                Navigator.pop(context);
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const AuditLogsPage()),
                );
              },
            ),
            const Divider(height: 24),
            ListTile(
              leading: const Icon(Icons.logout, color: AppColors.danger),
              title: const Text(
                'Sign Out / ውጣ',
                style: TextStyle(color: AppColors.danger),
              ),
              onTap: () {
                Navigator.pop(context);
                context.read<AuthBloc>().add(LogoutRequested());
              },
            ),
          ],
        ),
      ),
      body: IndexedStack(index: _currentIndex, children: _primaryPages),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        type: BottomNavigationBarType.fixed,
        selectedItemColor: AppColors.adminPrimary,
        unselectedItemColor: Colors.blueGrey.shade400,
        onTap: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.layers_outlined),
            activeIcon: Icon(Icons.layers),
            label: 'Zigs',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.people_outline),
            activeIcon: Icon(Icons.people),
            label: 'Users',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.swap_horiz_outlined),
            activeIcon: Icon(Icons.swap_horiz),
            label: 'Sales',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.shopping_cart_outlined),
            activeIcon: Icon(Icons.shopping_cart),
            label: 'Procure',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.calculate_outlined),
            activeIcon: Icon(Icons.calculate),
            label: 'Settlement',
          ),
        ],
      ),
    );
  }
}
