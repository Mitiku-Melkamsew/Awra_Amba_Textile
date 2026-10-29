import 'package:flutter/material.dart';
import 'package:awra_amba_textile/features/weavers/presentation/pages/weaver_portal_page.dart';
import 'package:awra_amba_textile/features/work_orders/presentation/pages/weaver_zigs_page.dart';
import 'package:awra_amba_textile/features/settlement/presentation/pages/weaver_payments_page.dart';

class WeaverHomePage extends StatefulWidget {
  const WeaverHomePage({super.key});

  @override
  State<WeaverHomePage> createState() => _WeaverHomePageState();
}

class _WeaverHomePageState extends State<WeaverHomePage> {
  int _currentIndex = 0;

  final List<Widget> _pages = const [
    WeaverPortalPage(),
    WeaverZigsPage(),
    WeaverPaymentsPage(),
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
        onTap: (index) => setState(() => _currentIndex = index),
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.dashboard_outlined),
            activeIcon: Icon(Icons.dashboard),
            label: 'Dashboard',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.layers_outlined),
            activeIcon: Icon(Icons.layers),
            label: 'My Zigs',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.receipt_long_outlined),
            activeIcon: Icon(Icons.receipt_long),
            label: 'Payments',
          ),
        ],
      ),
    );
  }
}
