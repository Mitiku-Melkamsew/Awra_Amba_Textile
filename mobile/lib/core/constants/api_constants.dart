class ApiConstants {
  // Default development URLs
  // Android emulator uses 10.0.2.2 to access host machine localhost
  // iOS simulator, desktop, or web uses localhost
  static const String defaultAndroidBaseUrl = 'http://10.0.2.2:3001/api/v1';
  static const String defaultLocalhostBaseUrl = 'http://localhost:3001/api/v1';

  // Endpoints
  static const String authLogin = '/auth/login';
  static const String authSignup = '/auth/signup';
  static const String authMe = '/auth/me';

  static const String weavers = '/weavers';
  static const String workOrders = '/work-orders';
  static const String yarnGiven = '/yarn-given';
  static const String fabricReturns = '/fabric-returns';
  static const String transactions = '/transactions';
  static const String merchants = '/merchants';
  static const String stock = '/stock';
  static const String catalogLookup = '/catalog/lookup';

  static const String batchPreview = '/calculations/settlements/batch-preview';
  static const String batchCommit = '/calculations/settlements/batch-commit';
  static const String settlementPreview = '/calculations/settlements/preview';
  static const String hisabBatchReport = '/reports/hisab/batch';
  static const String hisabPaymentReport = '/reports/hisab';
  static const String deductionCalc = '/calculations/deduction';
  static const String bonusCalc = '/calculations/bonus';
}
