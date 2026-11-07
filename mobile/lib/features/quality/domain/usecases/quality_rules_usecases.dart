import '../../../../core/usecase/usecase.dart';
import '../entities/quality_rule_entity.dart';
import '../repositories/quality_rules_repository.dart';

class GetQualityRulesUseCase implements UseCase<List<QualityRuleEntity>, NoParams> {
  final QualityRulesRepository repository;
  GetQualityRulesUseCase(this.repository);

  @override
  Future<List<QualityRuleEntity>> call(NoParams params) {
    return repository.getQualityRules();
  }
}

class CreateQualityRuleParams {
  final String factor;
  final String unit;
  final double deductionPerUnit;

  const CreateQualityRuleParams({
    required this.factor,
    required this.unit,
    required this.deductionPerUnit,
  });
}

class CreateQualityRuleUseCase implements UseCase<QualityRuleEntity, CreateQualityRuleParams> {
  final QualityRulesRepository repository;
  CreateQualityRuleUseCase(this.repository);

  @override
  Future<QualityRuleEntity> call(CreateQualityRuleParams params) {
    return repository.createQualityRule(
      factor: params.factor,
      unit: params.unit,
      deductionPerUnit: params.deductionPerUnit,
    );
  }
}

class UpdateQualityRuleParams {
  final int id;
  final String? factor;
  final String? unit;
  final double? deductionPerUnit;
  final bool? isActive;

  const UpdateQualityRuleParams({
    required this.id,
    this.factor,
    this.unit,
    this.deductionPerUnit,
    this.isActive,
  });
}

class UpdateQualityRuleUseCase implements UseCase<QualityRuleEntity, UpdateQualityRuleParams> {
  final QualityRulesRepository repository;
  UpdateQualityRuleUseCase(this.repository);

  @override
  Future<QualityRuleEntity> call(UpdateQualityRuleParams params) {
    return repository.updateQualityRule(
      id: params.id,
      factor: params.factor,
      unit: params.unit,
      deductionPerUnit: params.deductionPerUnit,
      isActive: params.isActive,
    );
  }
}
