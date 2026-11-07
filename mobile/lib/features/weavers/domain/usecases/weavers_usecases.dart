import '../../../../core/usecase/usecase.dart';
import '../entities/weaver_entity.dart';
import '../repositories/weavers_repository.dart';

class GetWeaversParams {
  final String? search;
  final String? sort;
  const GetWeaversParams({this.search, this.sort});
}

class GetWeaversUseCase implements UseCase<List<WeaverEntity>, GetWeaversParams> {
  final WeaversRepository repository;
  GetWeaversUseCase(this.repository);

  @override
  Future<List<WeaverEntity>> call(GetWeaversParams params) {
    return repository.getWeavers(search: params.search, sort: params.sort);
  }
}

class GetWeaverDetailUseCase implements UseCase<WeaverEntity, int> {
  final WeaversRepository repository;
  GetWeaverDetailUseCase(this.repository);

  @override
  Future<WeaverEntity> call(int weaverId) {
    return repository.getWeaver(weaverId);
  }
}

class CreateWeaverParams {
  final String firstName;
  final String lastName;
  final String? phone;
  final String? email;
  final String? bankAccountNumber;

  const CreateWeaverParams({
    required this.firstName,
    required this.lastName,
    this.phone,
    this.email,
    this.bankAccountNumber,
  });
}

class CreateWeaverUseCase implements UseCase<WeaverEntity, CreateWeaverParams> {
  final WeaversRepository repository;
  CreateWeaverUseCase(this.repository);

  @override
  Future<WeaverEntity> call(CreateWeaverParams params) {
    return repository.createWeaver(
      firstName: params.firstName,
      lastName: params.lastName,
      phone: params.phone,
      email: params.email,
      bankAccountNumber: params.bankAccountNumber,
    );
  }
}

class GetUnsettledUseCase implements UseCase<Map<String, dynamic>, int> {
  final WeaversRepository repository;
  GetUnsettledUseCase(this.repository);

  @override
  Future<Map<String, dynamic>> call(int weaverId) {
    return repository.getUnsettled(weaverId);
  }
}
