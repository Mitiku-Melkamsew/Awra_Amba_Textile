import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../blocs/auth/auth_bloc.dart';
import '../../blocs/auth/auth_event.dart';
import '../../core/constants/app_colors.dart';
import 'weavers/weavers_list_screen.dart';
import 'zigs/zigs_list_screen.dart';
import 'transactions/transactions_list_screen.dart';
import 'settlement/settlement_screen.dart';
import 'stock/stock_screen.dart';

class AdminHomeScreen extends StatefulWidget {
  const AdminHomeScreen({super.key});

  @override
  State<AdminHomeScreen> createState() => _AdminHomeScreenState();
}

class _AdminHomeScreenState extends State<AdminHomeScreen> {
  int _currentIndex = 0;

  final List<Widget> _pages = const [
    WeaversListScreen(),
    ZigsListScreen(),
    TransactionsListScreen(),
    SettlementScreen(),
    StockScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _pages,
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.people_outline),
            activeIcon: Icon(Icons.people),
            label: 'Weavers',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.layers_outlined),
            activeIcon: Icon(Icons.layers),
            label: 'Zigs',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.swap_horiz_outlined),
            activeIcon: Icon(Icons.swap_horiz),
            label: 'Transactions',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.calculate_outlined),
            activeIcon: Icon(Icons.calculate),
            label: 'Settlement',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.inventory_2_outlined),
            activeIcon: Icon(Icons.inventory_2),
            label: 'Stock',
          ),
        ],
      ),
    );
  }
}
