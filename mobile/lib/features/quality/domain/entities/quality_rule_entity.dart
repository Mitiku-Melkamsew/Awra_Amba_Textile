import 'package:equatable/equatable.dart';

class QualityRuleEntity extends Equatable {
  final int id;
  final String factor;
  final String unit;
  final double deductionPerUnit;
  final bool isActive;

  const QualityRuleEntity({
    required this.id,
    required this.factor,
    required this.unit,
    required this.deductionPerUnit,
    this.isActive = true,
  });

  @override
  List<Object?> get props => [id, factor, unit, deductionPerUnit, isActive];
}
