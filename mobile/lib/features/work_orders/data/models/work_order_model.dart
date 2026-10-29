import 'package:awra_amba_textile/features/products/data/models/product_model.dart';
import 'package:awra_amba_textile/features/weavers/data/models/weaver_model.dart';
import 'package:awra_amba_textile/features/work_orders/domain/entities/work_order_entity.dart';

class YarnGivenItemModel extends YarnGivenItemEntity {
  const YarnGivenItemModel({
    required super.yarnGivenId,
    required super.quantity,
    required super.unitPrice,
    required super.dateGiven,
    super.paymentId,
    required super.yarnSku,
    required super.yarnMaterial,
    required super.yarnColor,
  });

  factory YarnGivenItemModel.fromJson(Map<String, dynamic> json) {
    final yv = json['yarnVariant'] ?? {};
    return YarnGivenItemModel(
      yarnGivenId: json['yarnGivenId'] is int
          ? json['yarnGivenId']
          : int.tryParse(json['yarnGivenId'].toString()) ?? 0,
      quantity: double.tryParse(json['quantity']?.toString() ?? '0') ?? 0.0,
      unitPrice: double.tryParse(json['unitPrice']?.toString() ?? '0') ?? 0.0,
      dateGiven: json['dateGiven'] ?? '',
      paymentId: json['paymentId'] != null
          ? int.tryParse(json['paymentId'].toString())
          : null,
      yarnSku: yv['sku'] ?? '',
      yarnMaterial: yv['yarnType']?['materialName'] ?? '',
      yarnColor: yv['color']?['name'] ?? '',
    );
  }
}

class FabricReturnItemModel extends FabricReturnItemEntity {
  const FabricReturnItemModel({
    required super.returnId,
    required super.quantityReturned,
    required super.totalWeight,
    required super.unitPrice,
    super.calculatedDeduction,
    super.netCreditValue,
    super.remark,
    required super.dateReturned,
    super.paymentId,
    super.fabricVariant,
  });

  factory FabricReturnItemModel.fromJson(Map<String, dynamic> json) {
    return FabricReturnItemModel(
      returnId: json['returnId'] is int
          ? json['returnId']
          : int.tryParse(json['returnId'].toString()) ?? 0,
      quantityReturned: json['quantityReturned'] is int
          ? json['quantityReturned']
          : int.tryParse(json['quantityReturned'].toString()) ?? 0,
      totalWeight: double.tryParse(json['totalWeight']?.toString() ?? '0') ?? 0.0,
      unitPrice: double.tryParse(json['unitPrice']?.toString() ?? '0') ?? 0.0,
      calculatedDeduction:
          double.tryParse(json['calculatedDeduction']?.toString() ?? ''),
      netCreditValue: double.tryParse(json['netCreditValue']?.toString() ?? ''),
      remark: json['remark']?.toString(),
      dateReturned: json['dateReturned'] ?? '',
      paymentId: json['paymentId'] != null
          ? int.tryParse(json['paymentId'].toString())
          : null,
      fabricVariant: json['fabricVariant'] != null
          ? FabricVariantModel.fromJson(json['fabricVariant'])
          : null,
    );
  }
}

class WorkOrderModel extends WorkOrderEntity {
  const WorkOrderModel({
    required super.zigId,
    required super.weaverId,
    required super.fabricVariantId,
    required super.status,
    required super.dateIssued,
    super.weaver,
    super.fabricVariant,
    super.yarnGivenCount = 0,
    super.fabricReturnsCount = 0,
  });

  factory WorkOrderModel.fromJson(Map<String, dynamic> json) {
    return WorkOrderModel(
      zigId: json['zigId']?.toString() ?? '',
      weaverId: json['weaverId'] is int
          ? json['weaverId']
          : int.tryParse(json['weaverId'].toString()) ?? 0,
      fabricVariantId: json['fabricVariantId'] is int
          ? json['fabricVariantId']
          : int.tryParse(json['fabricVariantId'].toString()) ?? 0,
      status: json['status']?.toString() ?? 'assigned',
      dateIssued: json['dateIssued']?.toString() ?? '',
      weaver: json['weaver'] != null ? WeaverModel.fromJson(json['weaver']) : null,
      fabricVariant: json['fabricVariant'] != null
          ? FabricVariantModel.fromJson(json['fabricVariant'])
          : null,
      yarnGivenCount: json['_count']?['yarnGiven'] ?? 0,
      fabricReturnsCount: json['_count']?['fabricReturns'] ?? 0,
    );
  }
}

class WorkOrderDetailModel extends WorkOrderDetailEntity {
  const WorkOrderDetailModel({
    required super.zigId,
    required super.weaverId,
    required super.fabricVariantId,
    required super.status,
    required super.dateIssued,
    super.weaver,
    super.fabricVariant,
    required super.yarnGiven,
    required super.fabricReturns,
  });

  factory WorkOrderDetailModel.fromJson(Map<String, dynamic> json) {
    return WorkOrderDetailModel(
      zigId: json['zigId']?.toString() ?? '',
      weaverId: json['weaverId'] is int
          ? json['weaverId']
          : int.tryParse(json['weaverId'].toString()) ?? 0,
      fabricVariantId: json['fabricVariantId'] is int
          ? json['fabricVariantId']
          : int.tryParse(json['fabricVariantId'].toString()) ?? 0,
      status: json['status']?.toString() ?? 'assigned',
      dateIssued: json['dateIssued']?.toString() ?? '',
      weaver: json['weaver'] != null ? WeaverModel.fromJson(json['weaver']) : null,
      fabricVariant: json['fabricVariant'] != null
          ? FabricVariantModel.fromJson(json['fabricVariant'])
          : null,
      yarnGiven: (json['yarnGiven'] as List?)
              ?.map((e) => YarnGivenItemModel.fromJson(e))
              .toList() ??
          [],
      fabricReturns: (json['fabricReturns'] as List?)
              ?.map((e) => FabricReturnItemModel.fromJson(e))
              .toList() ??
          [],
    );
  }
}
