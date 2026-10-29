import '../../../../core/usecase/usecase.dart';
import '../entities/auth_user_entity.dart';
import '../repositories/auth_repository.dart';

class LoginParams {
  final String username;
  final String password;
  const LoginParams({required this.username, required this.password});
}

class LoginUseCase implements UseCase<AuthUserEntity, LoginParams> {
  final AuthRepository repository;
  LoginUseCase(this.repository);

  @override
  Future<AuthUserEntity> call(LoginParams params) {
    return repository.login(params.username, params.password);
  }
}
