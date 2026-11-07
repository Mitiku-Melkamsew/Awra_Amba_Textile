import '../../domain/entities/quality_rule_entity.dart';

class QualityRuleModel extends QualityRuleEntity {
  const QualityRuleModel({
    required super.id,
    required super.factor,
    required super.unit,
    required super.deductionPerUnit,
    super.isActive,
  });

  factory QualityRuleModel.fromJson(Map<String, dynamic> json) {
    return QualityRuleModel(
      id: int.tryParse(json['id']?.toString() ?? json['ruleId']?.toString() ?? '0') ?? 0,
      factor: json['factor']?.toString() ?? '',
      unit: json['unit']?.toString() ?? 'unit',
      deductionPerUnit: double.tryParse(json['deductionPerUnit']?.toString() ?? '0') ?? 0.0,
      isActive: json['isActive'] == null || json['isActive'] == true,
    );
  }

  Map<String, dynamic> toJson() => {
    'factor': factor,
    'unit': unit,
    'deductionPerUnit': deductionPerUnit,
    'isActive': isActive,
  };
}
