import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import 'core/constants/app_colors.dart';
import 'core/constants/app_theme.dart';
import 'core/network/api_client.dart';
import 'core/storage/token_storage.dart';

// Authentication Feature
import 'features/authentication/data/datasources/auth_local_data_source.dart';
import 'features/authentication/data/datasources/auth_remote_data_source.dart';
import 'features/authentication/data/repositories/auth_repository_impl.dart';
import 'features/authentication/domain/repositories/auth_repository.dart';
import 'features/authentication/domain/usecases/get_current_user_usecase.dart';
import 'features/authentication/domain/usecases/login_usecase.dart';
import 'features/authentication/domain/usecases/logout_usecase.dart';
import 'features/authentication/domain/usecases/signup_usecase.dart';
import 'features/authentication/presentation/blocs/auth_bloc.dart';
import 'features/authentication/presentation/blocs/auth_event.dart';
import 'features/authentication/presentation/blocs/auth_state.dart';
import 'features/authentication/presentation/pages/login_page.dart';

// Products Feature
import 'features/products/data/datasources/products_remote_data_source.dart';
import 'features/products/data/repositories/products_repository_impl.dart';
import 'features/products/domain/repositories/products_repository.dart';
import 'features/products/domain/usecases/calculate_deduction_usecase.dart';
import 'features/products/domain/usecases/get_catalog_lookup_usecase.dart';
import 'features/products/domain/usecases/get_fabric_variants_usecase.dart';
import 'features/products/domain/usecases/get_stock_usecase.dart';
import 'features/products/domain/usecases/get_yarn_variants_usecase.dart';
import 'features/products/presentation/blocs/stock_bloc.dart';

// Weavers Feature
import 'features/weavers/data/datasources/weavers_remote_data_source.dart';
import 'features/weavers/data/repositories/weavers_repository_impl.dart';
import 'features/weavers/domain/repositories/weavers_repository.dart';
import 'features/weavers/domain/usecases/weavers_usecases.dart';
import 'features/weavers/presentation/blocs/weavers_bloc.dart';

// Work Orders Feature
import 'features/work_orders/data/datasources/work_orders_remote_data_source.dart';
import 'features/work_orders/data/repositories/work_orders_repository_impl.dart';
import 'features/work_orders/domain/repositories/work_orders_repository.dart';
import 'features/work_orders/domain/usecases/work_orders_usecases.dart';
import 'features/work_orders/presentation/blocs/work_orders_bloc.dart';

// Transactions Feature
import 'features/transactions/data/datasources/transactions_remote_data_source.dart';
import 'features/transactions/data/repositories/transactions_repository_impl.dart';
import 'features/transactions/domain/repositories/transactions_repository.dart';
import 'features/transactions/domain/usecases/transactions_usecases.dart';
import 'features/transactions/presentation/blocs/transactions_bloc.dart';

// Settlement Feature
import 'features/settlement/data/datasources/settlement_remote_data_source.dart';
import 'features/settlement/data/repositories/settlement_repository_impl.dart';
import 'features/settlement/domain/repositories/settlement_repository.dart';
import 'features/settlement/domain/usecases/settlement_usecases.dart';
import 'features/settlement/presentation/blocs/settlement_bloc.dart';

// Home / Portals
import 'features/home/presentation/pages/admin_home_page.dart';
import 'features/home/presentation/pages/weaver_home_page.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Core Storage & Network Client (Web-safe)
  final tokenStorage = await TokenStorage.create();
  final apiClient = ApiClient(tokenStorage: tokenStorage);

  // Authentication Feature Assembly
  final authRemoteDataSource = AuthRemoteDataSourceImpl(apiClient: apiClient);
  final authLocalDataSource = AuthLocalDataSourceImpl(tokenStorage: tokenStorage);
  final authRepository = AuthRepositoryImpl(
    remoteDataSource: authRemoteDataSource,
    localDataSource: authLocalDataSource,
  );
  final loginUseCase = LoginUseCase(authRepository);
  final signupUseCase = SignupUseCase(authRepository);
  final getCurrentUserUseCase = GetCurrentUserUseCase(authRepository);
  final logoutUseCase = LogoutUseCase(authRepository);

  // Products Feature Assembly
  final productsRemoteDataSource = ProductsRemoteDataSourceImpl(apiClient: apiClient);
  final productsRepository = ProductsRepositoryImpl(remoteDataSource: productsRemoteDataSource);
  final getFabricVariantsUseCase = GetFabricVariantsUseCase(productsRepository);
  final getYarnVariantsUseCase = GetYarnVariantsUseCase(productsRepository);
  final getCatalogLookupUseCase = GetCatalogLookupUseCase(productsRepository);
  final getStockUseCase = GetStockUseCase(productsRepository);
  final calculateDeductionUseCase = CalculateDeductionUseCase(productsRepository);

  // Weavers Feature Assembly
  final weaversRemoteDataSource = WeaversRemoteDataSourceImpl(apiClient: apiClient);
  final weaversRepository = WeaversRepositoryImpl(remoteDataSource: weaversRemoteDataSource);
  final getWeaversUseCase = GetWeaversUseCase(weaversRepository);
  final getWeaverDetailUseCase = GetWeaverDetailUseCase(weaversRepository);
  final createWeaverUseCase = CreateWeaverUseCase(weaversRepository);
  final getUnsettledUseCase = GetUnsettledUseCase(weaversRepository);

  // Work Orders Feature Assembly
  final workOrdersRemoteDataSource = WorkOrdersRemoteDataSourceImpl(apiClient: apiClient);
  final workOrdersRepository = WorkOrdersRepositoryImpl(remoteDataSource: workOrdersRemoteDataSource);
  final getWorkOrdersUseCase = GetWorkOrdersUseCase(workOrdersRepository);
  final getWorkOrderDetailUseCase = GetWorkOrderDetailUseCase(workOrdersRepository);
  final createWorkOrderUseCase = CreateWorkOrderUseCase(workOrdersRepository);
  final updateWorkOrderStatusUseCase = UpdateWorkOrderStatusUseCase(workOrdersRepository);
  final addYarnGivenUseCase = AddYarnGivenUseCase(workOrdersRepository);
  final addFabricReturnUseCase = AddFabricReturnUseCase(workOrdersRepository);

  // Transactions Feature Assembly
  final transactionsRemoteDataSource = TransactionsRemoteDataSourceImpl(apiClient: apiClient);
  final transactionsRepository = TransactionsRepositoryImpl(remoteDataSource: transactionsRemoteDataSource);
  final getTransactionsUseCase = GetTransactionsUseCase(transactionsRepository);
  final getTransactionDetailUseCase = GetTransactionDetailUseCase(transactionsRepository);
  final createTransactionUseCase = CreateTransactionUseCase(transactionsRepository);
  final deliverTransactionUseCase = DeliverTransactionUseCase(transactionsRepository);
  final addTransactionPaymentUseCase = AddTransactionPaymentUseCase(transactionsRepository);
  final cancelTransactionUseCase = CancelTransactionUseCase(transactionsRepository);

  // Settlement Feature Assembly
  final settlementRemoteDataSource = SettlementRemoteDataSourceImpl(apiClient: apiClient);
  final settlementRepository = SettlementRepositoryImpl(remoteDataSource: settlementRemoteDataSource);
  final generateBatchPreviewUseCase = GenerateBatchPreviewUseCase(settlementRepository);
  final getSettlementPreviewUseCase = GetSettlementPreviewUseCase(settlementRepository);
  final commitBatchUseCase = CommitBatchUseCase(settlementRepository);

  runApp(
    MultiRepositoryProvider(
      providers: [
        RepositoryProvider<TokenStorage>.value(value: tokenStorage),
        RepositoryProvider<ApiClient>.value(value: apiClient),
        RepositoryProvider<AuthRepository>.value(value: authRepository),
        RepositoryProvider<ProductsRepository>.value(value: productsRepository),
        RepositoryProvider<WeaversRepository>.value(value: weaversRepository),
        RepositoryProvider<WorkOrdersRepository>.value(value: workOrdersRepository),
        RepositoryProvider<TransactionsRepository>.value(value: transactionsRepository),
        RepositoryProvider<SettlementRepository>.value(value: settlementRepository),
      ],
      child: MultiBlocProvider(
        providers: [
          BlocProvider(
            create: (_) => AuthBloc(
              loginUseCase: loginUseCase,
              signupUseCase: signupUseCase,
              getCurrentUserUseCase: getCurrentUserUseCase,
              logoutUseCase: logoutUseCase,
              authRepository: authRepository,
            )..add(AppStarted()),
          ),
          BlocProvider(
            create: (_) => WeaversBloc(
              getWeaversUseCase: getWeaversUseCase,
              getWeaverDetailUseCase: getWeaverDetailUseCase,
              createWeaverUseCase: createWeaverUseCase,
              getUnsettledUseCase: getUnsettledUseCase,
              weaversRepository: weaversRepository,
            ),
          ),
          BlocProvider(
            create: (_) => WorkOrdersBloc(
              getWorkOrdersUseCase: getWorkOrdersUseCase,
              getWorkOrderDetailUseCase: getWorkOrderDetailUseCase,
              createWorkOrderUseCase: createWorkOrderUseCase,
              updateWorkOrderStatusUseCase: updateWorkOrderStatusUseCase,
              addYarnGivenUseCase: addYarnGivenUseCase,
              addFabricReturnUseCase: addFabricReturnUseCase,
              workOrdersRepository: workOrdersRepository,
            ),
          ),
          BlocProvider(
            create: (_) => TransactionsBloc(
              getTransactionsUseCase: getTransactionsUseCase,
              getTransactionDetailUseCase: getTransactionDetailUseCase,
              createTransactionUseCase: createTransactionUseCase,
              deliverTransactionUseCase: deliverTransactionUseCase,
              addTransactionPaymentUseCase: addTransactionPaymentUseCase,
              cancelTransactionUseCase: cancelTransactionUseCase,
              transactionsRepository: transactionsRepository,
            ),
          ),
          BlocProvider(
            create: (_) => SettlementBloc(
              generateBatchPreviewUseCase: generateBatchPreviewUseCase,
              getSettlementPreviewUseCase: getSettlementPreviewUseCase,
              commitBatchUseCase: commitBatchUseCase,
              settlementRepository: settlementRepository,
            ),
          ),
          BlocProvider(
            create: (_) => StockBloc(
              getStockUseCase: getStockUseCase,
              getFabricVariantsUseCase: getFabricVariantsUseCase,
              getYarnVariantsUseCase: getYarnVariantsUseCase,
              getCatalogLookupUseCase: getCatalogLookupUseCase,
              calculateDeductionUseCase: calculateDeductionUseCase,
              productsRepository: productsRepository,
            ),
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
            home = const AdminHomePage();
          } else {
            home = const WeaverHomePage();
          }
        } else {
          home = const LoginPage();
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
                color: Colors.white.withValues(alpha: 0.12),
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
