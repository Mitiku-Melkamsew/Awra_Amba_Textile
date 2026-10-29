import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import 'blocs/auth/auth_bloc.dart';
import 'blocs/auth/auth_event.dart';
import 'blocs/auth/auth_state.dart';
import 'blocs/settlement/settlement_bloc.dart';
import 'blocs/stock/stock_bloc.dart';
import 'blocs/transactions/transactions_bloc.dart';
import 'blocs/weavers/weavers_bloc.dart';
import 'blocs/work_orders/work_orders_bloc.dart';
import 'core/constants/app_colors.dart';
import 'core/constants/app_theme.dart';
import 'core/network/api_client.dart';
import 'core/storage/token_storage.dart';
import 'repositories/auth_repository.dart';
import 'repositories/settlement_repository.dart';
import 'repositories/stock_repository.dart';
import 'repositories/transactions_repository.dart';
import 'repositories/weavers_repository.dart';
import 'repositories/work_orders_repository.dart';
import 'views/admin/admin_home_screen.dart';
import 'views/auth/login_screen.dart';
import 'views/weaver/weaver_home_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize persistent token and settings storage
  final tokenStorage = await TokenStorage.create();

  // Create HTTP API Client with interceptors
  final apiClient = ApiClient(tokenStorage: tokenStorage);

  // Initialize data repositories
  final authRepository = AuthRepository(apiClient: apiClient);
  final weaversRepository = WeaversRepository(apiClient: apiClient);
  final workOrdersRepository = WorkOrdersRepository(apiClient: apiClient);
  final transactionsRepository = TransactionsRepository(apiClient: apiClient);
  final settlementRepository = SettlementRepository(apiClient: apiClient);
  final stockRepository = StockRepository(apiClient: apiClient);

  runApp(
    MultiRepositoryProvider(
      providers: [
        RepositoryProvider.value(value: tokenStorage),
        RepositoryProvider.value(value: apiClient),
        RepositoryProvider.value(value: authRepository),
        RepositoryProvider.value(value: weaversRepository),
        RepositoryProvider.value(value: workOrdersRepository),
        RepositoryProvider.value(value: transactionsRepository),
        RepositoryProvider.value(value: settlementRepository),
        RepositoryProvider.value(value: stockRepository),
      ],
      child: MultiBlocProvider(
        providers: [
          BlocProvider(
            create: (_) => AuthBloc(authRepository: authRepository)..add(AppStarted()),
          ),
          BlocProvider(
            create: (_) => WeaversBloc(weaversRepository: weaversRepository),
          ),
          BlocProvider(
            create: (_) => WorkOrdersBloc(workOrdersRepository: workOrdersRepository),
          ),
          BlocProvider(
            create: (_) =>
                TransactionsBloc(transactionsRepository: transactionsRepository),
          ),
          BlocProvider(
            create: (_) =>
                SettlementBloc(settlementRepository: settlementRepository),
          ),
          BlocProvider(
            create: (_) => StockBloc(stockRepository: stockRepository),
          ),
        ],
        child: const AwraAmbaApp(),
      ),
    ),
  );
}

class AwraAmbaApp extends StatelessWidget {
  const AwraAmbaApp({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<AuthBloc, AuthState>(
      buildWhen: (previous, current) =>
          previous.status != current.status || previous.user != current.user,
      builder: (context, authState) {
        final isWeaver = authState.user?.isWeaver ?? false;
        final theme = isWeaver ? AppTheme.weaverTheme : AppTheme.adminTheme;

        Widget home;
        if (authState.status == AuthStatus.initial ||
            (authState.status == AuthStatus.loading && authState.user == null)) {
          home = const _SplashScreen();
        } else if (authState.isAuthenticated) {
          if (authState.isAdmin) {
            home = const AdminHomeScreen();
          } else {
            home = const WeaverHomeScreen();
          }
        } else {
          home = const LoginScreen();
        }

        return MaterialApp(
          title: 'Awra Amba Textile',
          debugShowCheckedModeBanner: false,
          theme: theme,
          home: home,
        );
      },
    );
  }
}

class _SplashScreen extends StatelessWidget {
  const _SplashScreen();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.adminPrimary,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.12),
                shape: BoxShape.circle,
                border: Border.all(color: Colors.white24, width: 2),
              ),
              child: const Icon(
                Icons.grid_view_rounded,
                size: 40,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              'አዕራ አምባ ቴክስታይል',
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w700,
                color: Colors.white,
                letterSpacing: 0.5,
              ),
            ),
            const SizedBox(height: 6),
            const Text(
              'Awra Amba Textile Community',
              style: TextStyle(
                fontSize: 14,
                color: Colors.white70,
              ),
            ),
            const SizedBox(height: 36),
            const SizedBox(
              width: 28,
              height: 28,
              child: CircularProgressIndicator(
                strokeWidth: 2.5,
                valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
