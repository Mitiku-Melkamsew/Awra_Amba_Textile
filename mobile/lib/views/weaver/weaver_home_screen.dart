import 'package:flutter/material.dart';
import 'weaver_portal_screen.dart';
import 'weaver_zigs_screen.dart';
import 'weaver_payments_screen.dart';

class WeaverHomeScreen extends StatefulWidget {
  const WeaverHomeScreen({super.key});

  @override
  State<WeaverHomeScreen> createState() => _WeaverHomeScreenState();
}

class _WeaverHomeScreenState extends State<WeaverHomeScreen> {
  int _currentIndex = 0;

  final List<Widget> _pages = const [
    WeaverPortalScreen(),
    WeaverZigsScreen(),
    WeaverPaymentsScreen(),
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
