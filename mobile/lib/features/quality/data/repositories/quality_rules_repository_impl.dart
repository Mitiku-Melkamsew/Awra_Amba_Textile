import '../../domain/entities/quality_rule_entity.dart';
import '../../domain/repositories/quality_rules_repository.dart';
import '../datasources/quality_rules_remote_data_source.dart';

class QualityRulesRepositoryImpl implements QualityRulesRepository {
  final QualityRulesRemoteDataSource remoteDataSource;

  QualityRulesRepositoryImpl({required this.remoteDataSource});

  @override
  Future<List<QualityRuleEntity>> getQualityRules() =>
      remoteDataSource.getQualityRules();

  @override
  Future<QualityRuleEntity> createQualityRule({
    required String factor,
    required String unit,
    required double deductionPerUnit,
  }) =>
      remoteDataSource.createQualityRule(
        factor: factor,
        unit: unit,
        deductionPerUnit: deductionPerUnit,
      );

  @override
  Future<QualityRuleEntity> updateQualityRule({
    required int id,
    String? factor,
    String? unit,
    double? deductionPerUnit,
    bool? isActive,
  }) =>
      remoteDataSource.updateQualityRule(
        id: id,
        factor: factor,
        unit: unit,
        deductionPerUnit: deductionPerUnit,
        isActive: isActive,
      );
}
