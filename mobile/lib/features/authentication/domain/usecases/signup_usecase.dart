import '../../../../core/usecase/usecase.dart';
import '../entities/auth_user_entity.dart';
import '../repositories/auth_repository.dart';

class SignupParams {
  final String firstName;
  final String lastName;
  final String username;
  final String password;
  final String? phone;
  final String role;
  final String? companyName;

  const SignupParams({
    required this.firstName,
    required this.lastName,
    required this.username,
    required this.password,
    this.phone,
    this.role = 'weaver',
    this.companyName,
  });
}

class SignupUseCase implements UseCase<AuthUserEntity, SignupParams> {
  final AuthRepository repository;
  SignupUseCase(this.repository);

  @override
  Future<AuthUserEntity> call(SignupParams params) {
    return repository.signup(
      firstName: params.firstName,
      lastName: params.lastName,
      username: params.username,
      password: params.password,
      phone: params.phone,
      role: params.role,
      companyName: params.companyName,
    );
  }
}
