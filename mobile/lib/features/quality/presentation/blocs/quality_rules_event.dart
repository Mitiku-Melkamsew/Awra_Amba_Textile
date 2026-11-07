import 'package:equatable/equatable.dart';

abstract class QualityRulesEvent extends Equatable {
  const QualityRulesEvent();

  @override
  List<Object?> get props => [];
}

class LoadQualityRules extends QualityRulesEvent {}

class CreateQualityRuleSubmitted extends QualityRulesEvent {
  final String factor;
  final String unit;
  final double deductionPerUnit;

  const CreateQualityRuleSubmitted({
    required this.factor,
    required this.unit,
    required this.deductionPerUnit,
  });

  @override
  List<Object?> get props => [factor, unit, deductionPerUnit];
}

class ToggleQualityRuleStatusSubmitted extends QualityRulesEvent {
  final int id;
  final bool newStatus;

  const ToggleQualityRuleStatusSubmitted({required this.id, required this.newStatus});

  @override
  List<Object?> get props => [id, newStatus];
}
