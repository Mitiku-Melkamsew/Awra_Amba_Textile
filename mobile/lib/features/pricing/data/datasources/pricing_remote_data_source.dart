import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/api_client.dart';
import '../models/price_model.dart';

abstract class PricingRemoteDataSource {
  Future<List<FabricPriceItemModel>> getFabricPrices();
  Future<FabricPriceItemModel> createFabricPrice({
    required int fabricVariantId,
    required double unitPrice,
    String? effectiveDate,
  });

  Future<List<YarnPriceItemModel>> getYarnPrices();
  Future<YarnPriceItemModel> createYarnPrice({
    required int yarnVariantId,
    required double costPerKg,
    String? effectiveDate,
  });
}

class PricingRemoteDataSourceImpl implements PricingRemoteDataSource {
  final ApiClient apiClient;

  PricingRemoteDataSourceImpl({required this.apiClient});

  @override
  Future<List<FabricPriceItemModel>> getFabricPrices() async {
    final response = await apiClient.dio.get(ApiConstants.catalogFabricPrices);
    final list = response.data as List;
    return list.map((e) => FabricPriceItemModel.fromJson(e as Map<String, dynamic>)).toList();
  }

  @override
  Future<FabricPriceItemModel> createFabricPrice({
    required int fabricVariantId,
    required double unitPrice,
    String? effectiveDate,
  }) async {
    final response = await apiClient.dio.post(
      ApiConstants.catalogFabricPrices,
      data: {
        'fabricVariantId': fabricVariantId,
        'unitPrice': unitPrice,
        if (effectiveDate != null && effectiveDate.isNotEmpty) 'effectiveDate': effectiveDate,
      },
    );
    return FabricPriceItemModel.fromJson(response.data as Map<String, dynamic>);
  }

  @override
  Future<List<YarnPriceItemModel>> getYarnPrices() async {
    final response = await apiClient.dio.get(ApiConstants.catalogYarnPrices);
    final list = response.data as List;
    return list.map((e) => YarnPriceItemModel.fromJson(e as Map<String, dynamic>)).toList();
  }

  @override
  Future<YarnPriceItemModel> createYarnPrice({
    required int yarnVariantId,
    required double costPerKg,
    String? effectiveDate,
  }) async {
    final response = await apiClient.dio.post(
      ApiConstants.catalogYarnPrices,
      data: {
        'yarnVariantId': yarnVariantId,
        'pricePerKg': costPerKg,
        if (effectiveDate != null && effectiveDate.isNotEmpty) 'effectiveDate': effectiveDate,
      },
    );
    return YarnPriceItemModel.fromJson(response.data as Map<String, dynamic>);
  }
}
