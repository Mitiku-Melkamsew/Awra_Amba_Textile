import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../authentication/presentation/blocs/auth_bloc.dart';
import '../../../authentication/presentation/blocs/auth_event.dart';
import 'merchant_fabrics_page.dart';
import 'merchant_orders_page.dart';
import 'merchant_prices_page.dart';

class MerchantHomePage extends StatefulWidget {
  const MerchantHomePage({super.key});

  @override
  State<MerchantHomePage> createState() => _MerchantHomePageState();
}

class _MerchantHomePageState extends State<MerchantHomePage> {
  int _currentIndex = 0;

  final List<Widget> _pages = const [
    MerchantFabricsPage(),
    MerchantPricesPage(),
    MerchantOrdersPage(),
  ];

  @override
  Widget build(BuildContext context) {
    final authState = context.watch<AuthBloc>().state;
    final user = authState.user;

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Merchant Portal / የነጋዴ ፖርታል',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
            ),
            Text(
              user?.displayName ?? 'Wholesale Partner',
              style: const TextStyle(fontSize: 11.5, color: Color(0xFFBAE6FD)),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: 'Sign Out / ውጣ',
            onPressed: () {
              showDialog(
                context: context,
                builder: (ctx) => AlertDialog(
                  title: const Text('Sign Out'),
                  content: const Text('Are you sure you want to sign out?'),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.pop(ctx),
                      child: const Text('Cancel'),
                    ),
                    ElevatedButton(
                      onPressed: () {
                        Navigator.pop(ctx);
                        context.read<AuthBloc>().add(LogoutRequested());
                      },
                      child: const Text('Sign Out'),
                    ),
                  ],
                ),
              );
            },
          ),
        ],
      ),
      body: IndexedStack(
        index: _currentIndex,
        children: _pages,
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        selectedItemColor: AppColors.merchantPrimary,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.storefront_outlined),
            activeIcon: Icon(Icons.storefront),
            label: 'Available Fabrics',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.sell_outlined),
            activeIcon: Icon(Icons.sell),
            label: 'Price List',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.receipt_long_outlined),
            activeIcon: Icon(Icons.receipt_long),
            label: 'My Purchases',
          ),
        ],
      ),
    );
  }
}
