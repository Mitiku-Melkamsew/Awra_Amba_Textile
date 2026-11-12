class ApiConstants {
  // Default development URLs
  // Android emulator uses 10.0.2.2 to access host machine localhost
  // iOS simulator, desktop, or web uses localhost
  static const String defaultAndroidBaseUrl = 'http://10.0.2.2:3001/api/v1';
  static const String defaultLocalhostBaseUrl = 'http://localhost:3001/api/v1';

  // Authentication
  static const String authLogin = '/auth/login';
  static const String authSignup = '/auth/signup';
  static const String authMe = '/auth/me';

  // Users & Roles
  static const String users = '/users';
  static String userById(int id) => '/users/$id';
  static String userStatus(int id) => '/users/$id/status';
  static String userResetPassword(int id) => '/users/$id/reset-password';
  static const String weavers =
      '/users'; // For backward compatibility; filtered with ?role=weaver

  // Work Orders (Zigs)
  static const String workOrders = '/work-orders';
  static const String workOrdersNextId = '/work-orders/next-id';
  static String workOrderByZigId(String zigId) => '/work-orders/$zigId';
  static String workOrderStatus(String zigId) => '/work-orders/$zigId/status';
  static String workOrderCancel(String zigId) => '/work-orders/$zigId/cancel';
  static String workOrderMarkReturned(String zigId) =>
      '/work-orders/$zigId/status';

  // Nested Work Order Item Operations
  static String workOrderYarnGiven(String zigId) =>
      '/work-orders/$zigId/yarn-given';
  static String workOrderFabricReturns(String zigId) =>
      '/work-orders/$zigId/fabric-returns';
  static String workOrderYarnReturns(String zigId) =>
      '/work-orders/$zigId/yarn-returns';
  static String workOrderReturnsToWeaver(String zigId) =>
      '/work-orders/$zigId/returns-to-weaver';
  static String yarnGivenItem(int id) => '/work-orders/yarn-given/$id';
  static String fabricReturnItem(int id) => '/work-orders/fabric-returns/$id';

  // Legacy mappings for backward compatibility
  static const String yarnGiven = '/work-orders';
  static const String fabricReturns = '/work-orders';
  static const String workOrdersYarnReturns = '/work-orders';
  static const String workOrdersFabricReturnsToWeavers = '/work-orders';

  // Commercial & Direct Transactions
  static const String transactions = '/direct-transactions';
  static const String directTransactions = '/direct-transactions';
  static String directTransactionById(String id) => '/direct-transactions/$id';
  static String directTransactionPayments(String id) =>
      '/direct-transactions/$id/payments';
  static String directTransactionCancel(String id) =>
      '/direct-transactions/$id/cancel';

  // Procurement (Raw Yarn Purchases from Suppliers)
  static const String procurementYarnPurchases = '/procurement/yarn-purchases';
  static String procurementYarnPurchaseById(int id) =>
      '/procurement/yarn-purchases/$id';

  // Settlements (HISAB)
  static const String settlementsUnsettled = '/settlements/unsettled';
  static const String settlementsPreview = '/settlements/preview';
  static const String settlementsBatches = '/settlements/batches';
  static String settlementBatchPay(String id) => '/settlements/batches/$id/pay';
  static const String settlementsSingle = '/settlements/single';
  static String settlementPay(int id) => '/settlements/$id/pay';
  static String settlementOverrideLine(int id) =>
      '/settlements/lines/$id/override';

  // Legacy settlement aliases
  static const String batchPreview = '/settlements/preview';
  static const String batchCommit = '/settlements/batches';
  static const String settlementPreview = '/settlements/preview';
  static const String deductionCalc = '/calculations/deduction';
  static const String bonusCalc = '/calculations/bonus';

  // Catalog Master
  static const String catalogLookup = '/catalog/lookup';
  static const String catalogFabrics = '/catalog/fabrics';
  static const String catalogYarns = '/catalog/yarns';
  static const String catalogColors = '/catalog/colors';
  static const String catalogDesigns = '/catalog/designs';
  static const String catalogSuppliers = '/catalog/suppliers';
  static const String catalogFabricVariants = '/catalog/fabric-variants';
  static const String catalogYarnVariants = '/catalog/yarn-variants';

  // Pricing Engine
  static const String catalogFabricPrices = '/catalog/fabric-prices';
  static const String catalogYarnPrices = '/catalog/yarn-prices';

  // Quality Rules
  static const String catalogQualityRules = '/catalog/quality-rules';

  // Stock
  static const String stock = '/stock';
  static const String stockAvailableFabrics = '/stock/available-fabrics';

  // Reports
  static String reportsHisab(int id) => '/reports/hisab/$id';
  static const String reportsFinancialSummary = '/reports/financial-summary';
  static const String reportsWeaversBalance = '/reports/weavers-balance';
  static const String reportsMerchantsBalance = '/reports/merchants-balance';
  static const String hisabBatchReport = '/settlements/batches';
  static const String hisabPaymentReport = '/reports/hisab';

  // Audit Logs
  static const String auditLogs = '/audit-logs';

  // Weaver Portal
  static const String weaverProfile = '/weaver/profile';
  static const String weaverWorkOrders = '/weaver/work-orders';
  static String weaverWorkOrderDetail(String zigId) =>
      '/weaver/work-orders/$zigId';
  static const String weaverSettlements = '/weaver/settlements';
  static String weaverSettlementStatement(int id) =>
      '/weaver/settlements/$id/statement';
  static const String weaverDirectTransactions = '/weaver/direct-transactions';

  // Merchant Portal
  static const String merchantProfile = '/merchant/profile';
  static const String merchantCatalog = '/merchant/catalog';
  static const String merchantTransactions = '/merchant/transactions';
  static String merchantTransactionDetail(String id) =>
      '/merchant/transactions/$id';
}
