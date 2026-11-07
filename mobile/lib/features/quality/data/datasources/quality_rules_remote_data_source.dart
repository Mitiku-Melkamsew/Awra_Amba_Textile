import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/api_client.dart';
import '../models/quality_rule_model.dart';

abstract class QualityRulesRemoteDataSource {
  Future<List<QualityRuleModel>> getQualityRules();
  Future<QualityRuleModel> createQualityRule({
    required String factor,
    required String unit,
    required double deductionPerUnit,
  });
  Future<QualityRuleModel> updateQualityRule({
    required int id,
    String? factor,
    String? unit,
    double? deductionPerUnit,
    bool? isActive,
  });
}

class QualityRulesRemoteDataSourceImpl implements QualityRulesRemoteDataSource {
  final ApiClient apiClient;

  QualityRulesRemoteDataSourceImpl({required this.apiClient});

  @override
  Future<List<QualityRuleModel>> getQualityRules() async {
    final response = await apiClient.dio.get(ApiConstants.catalogQualityRules);
    final list = response.data as List;
    return list.map((e) => QualityRuleModel.fromJson(e as Map<String, dynamic>)).toList();
  }

  @override
  Future<QualityRuleModel> createQualityRule({
    required String factor,
    required String unit,
    required double deductionPerUnit,
  }) async {
    final response = await apiClient.dio.post(
      ApiConstants.catalogQualityRules,
      data: {
        'factor': factor,
        'unit': unit,
        'deductionPerUnit': deductionPerUnit,
      },
    );
    return QualityRuleModel.fromJson(response.data as Map<String, dynamic>);
  }

  @override
  Future<QualityRuleModel> updateQualityRule({
    required int id,
    String? factor,
    String? unit,
    double? deductionPerUnit,
    bool? isActive,
  }) async {
    final response = await apiClient.dio.patch(
      '${ApiConstants.catalogQualityRules}/$id',
      data: {
        'factor': ?factor,
        'unit': ?unit,
        'deductionPerUnit': ?deductionPerUnit,
        'isActive': ?isActive,
      },
    );
    return QualityRuleModel.fromJson(response.data as Map<String, dynamic>);
  }
}
