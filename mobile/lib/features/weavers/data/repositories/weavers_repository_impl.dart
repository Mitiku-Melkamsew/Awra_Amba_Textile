import '../../domain/entities/weaver_entity.dart';
import '../../domain/repositories/weavers_repository.dart';
import '../datasources/weavers_remote_data_source.dart';

class WeaversRepositoryImpl implements WeaversRepository {
  final WeaversRemoteDataSource remoteDataSource;

  WeaversRepositoryImpl({required this.remoteDataSource});

  @override
  Future<List<WeaverEntity>> getWeavers({String? search, String? sort}) =>
      remoteDataSource.getWeavers(search: search, sort: sort);

  @override
  Future<WeaverEntity> getWeaver(int id) =>
      remoteDataSource.getWeaver(id);

  @override
  Future<WeaverEntity> createWeaver({
    required String firstName,
    required String lastName,
    String? phone,
    String? email,
    String? bankAccountNumber,
  }) =>
      remoteDataSource.createWeaver(
        firstName: firstName,
        lastName: lastName,
        phone: phone,
        email: email,
        bankAccountNumber: bankAccountNumber,
      );

  @override
  Future<Map<String, dynamic>> getUnsettled(int weaverId) =>
      remoteDataSource.getUnsettled(weaverId);
}
