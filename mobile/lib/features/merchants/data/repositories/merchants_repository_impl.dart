import '../../domain/entities/available_fabric_entity.dart';
import '../../domain/entities/fabric_price_entity.dart';
import '../../domain/repositories/merchants_repository.dart';
import '../datasources/merchants_remote_data_source.dart';

class MerchantsRepositoryImpl implements MerchantsRepository {
  final MerchantsRemoteDataSource remoteDataSource;

  MerchantsRepositoryImpl({required this.remoteDataSource});

  @override
  Future<List<AvailableFabricEntity>> getAvailableFabrics() {
    return remoteDataSource.getAvailableFabrics();
  }

  @override
  Future<List<FabricPriceEntity>> getFabricPrices({int? fabricId}) {
    return remoteDataSource.getFabricPrices(fabricId: fabricId);
  }

  @override
  Future<List<Map<String, dynamic>>> getMyTransactions() {
    return remoteDataSource.getMyTransactions();
  }
}
