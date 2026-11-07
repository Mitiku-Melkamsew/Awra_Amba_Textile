import '../entities/available_fabric_entity.dart';
import '../entities/fabric_price_entity.dart';

abstract class MerchantsRepository {
  Future<List<AvailableFabricEntity>> getAvailableFabrics();
  Future<List<FabricPriceEntity>> getFabricPrices({int? fabricId});
  Future<List<Map<String, dynamic>>> getMyTransactions();
}
