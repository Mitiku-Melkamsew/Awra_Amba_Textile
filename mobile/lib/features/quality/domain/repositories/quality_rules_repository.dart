import '../entities/quality_rule_entity.dart';

abstract class QualityRulesRepository {
  Future<List<QualityRuleEntity>> getQualityRules();
  Future<QualityRuleEntity> createQualityRule({
    required String factor,
    required String unit,
    required double deductionPerUnit,
  });
  Future<QualityRuleEntity> updateQualityRule({
    required int id,
    String? factor,
    String? unit,
    double? deductionPerUnit,
    bool? isActive,
  });
}
