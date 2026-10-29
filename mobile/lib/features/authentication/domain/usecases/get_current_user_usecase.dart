import '../../../../core/usecase/usecase.dart';
import '../entities/auth_user_entity.dart';
import '../repositories/auth_repository.dart';

class GetCurrentUserUseCase implements UseCase<AuthUserEntity?, NoParams> {
  final AuthRepository repository;
  GetCurrentUserUseCase(this.repository);

  @override
  Future<AuthUserEntity?> call(NoParams params) {
    return repository.getCurrentUser();
  }
}
