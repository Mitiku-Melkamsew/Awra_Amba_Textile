import '../entities/weaver_entity.dart';

abstract class WeaversRepository {
  Future<List<WeaverEntity>> getWeavers({String? search, String? sort});
  Future<WeaverEntity> getWeaver(int id);
  Future<WeaverEntity> createWeaver({
    required String firstName,
    required String lastName,
    String? phone,
    String? email,
    String? bankAccountNumber,
  });
  Future<Map<String, dynamic>> getUnsettled(int weaverId);
}
