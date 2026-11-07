import 'package:equatable/equatable.dart';
import '../../domain/entities/quality_rule_entity.dart';

enum QualityRulesStatus { initial, loading, success, actionSuccess, error }

class QualityRulesState extends Equatable {
  final QualityRulesStatus status;
  final List<QualityRuleEntity> rules;
  final String? errorMessage;
  final String? successMessage;

  const QualityRulesState({
    this.status = QualityRulesStatus.initial,
    this.rules = const [],
    this.errorMessage,
    this.successMessage,
  });

  QualityRulesState copyWith({
    QualityRulesStatus? status,
    List<QualityRuleEntity>? rules,
    String? errorMessage,
    String? successMessage,
  }) {
    return QualityRulesState(
      status: status ?? this.status,
      rules: rules ?? this.rules,
      errorMessage: errorMessage,
      successMessage: successMessage,
    );
  }

  @override
  List<Object?> get props => [status, rules, errorMessage, successMessage];
}
