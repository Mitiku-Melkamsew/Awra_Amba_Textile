import 'package:awra_amba_textile/features/products/data/models/product_model.dart';
import 'package:awra_amba_textile/features/weavers/data/models/weaver_model.dart';
import 'package:awra_amba_textile/features/work_orders/domain/entities/work_order_entity.dart';

class YarnGivenItemModel extends YarnGivenItemEntity {
  const YarnGivenItemModel({
    required super.yarnGivenId,
    super.yarnVariantId = 0,
    required super.quantity,
    required super.unitPrice,
    required super.dateGiven,
    super.paymentId,
    required super.yarnSku,
    required super.yarnMaterial,
    required super.yarnColor,
    super.yarnSupplier,
  });

  factory YarnGivenItemModel.fromJson(Map<String, dynamic> json) {
    final yv = json['yarnVariant'] ?? {};
    final yarnMaterial = yv['yarn']?['name'] ??
        yv['yarnType']?['materialName'] ??
        yv['materialName'] ??
        '';
    final yarnColor = yv['color']?['name'] ?? '';
    final yarnSupplier = yv['supplier']?['name'];

    return YarnGivenItemModel(
      yarnGivenId: json['yarnGivenId'] is int
          ? json['yarnGivenId']
          : int.tryParse(json['yarnGivenId'].toString()) ?? 0,
      yarnVariantId: json['yarnVariantId'] is int
          ? json['yarnVariantId']
          : int.tryParse(json['yarnVariantId']?.toString() ?? '') ??
              (yv['yarnVariantId'] is int
                  ? yv['yarnVariantId']
                  : int.tryParse(yv['yarnVariantId']?.toString() ?? '') ?? 0),
      quantity: double.tryParse(json['quantity']?.toString() ?? '0') ?? 0.0,
      unitPrice: double.tryParse(json['unitPrice']?.toString() ?? '0') ?? 0.0,
      dateGiven: json['dateGiven']?.toString() ?? '',
      paymentId: json['paymentId'] != null
          ? int.tryParse(json['paymentId'].toString())
          : null,
      yarnSku: yv['sku']?.toString() ?? '',
      yarnMaterial: yarnMaterial,
      yarnColor: yarnColor,
      yarnSupplier: yarnSupplier,
    );
  }
}

class YarnReturnItemModel extends YarnReturnItemEntity {
  const YarnReturnItemModel({
    required super.yarnReturnId,
    super.yarnVariantId = 0,
    required super.quantity,
    required super.dateReturned,
    super.remark,
    required super.yarnSku,
    required super.yarnMaterial,
    required super.yarnColor,
    super.yarnSupplier,
  });

  factory YarnReturnItemModel.fromJson(Map<String, dynamic> json) {
    final yv = json['yarnVariant'] ?? {};
    final yarnMaterial = yv['yarn']?['name'] ??
        yv['yarnType']?['materialName'] ??
        yv['materialName'] ??
        '';
    final yarnColor = yv['color']?['name'] ?? '';
    final yarnSupplier = yv['supplier']?['name'];

    return YarnReturnItemModel(
      yarnReturnId: json['yarnReturnId'] is int
          ? json['yarnReturnId']
          : int.tryParse(json['yarnReturnId'].toString()) ?? 0,
      yarnVariantId: json['yarnVariantId'] is int
          ? json['yarnVariantId']
          : int.tryParse(json['yarnVariantId']?.toString() ?? '') ??
              (yv['yarnVariantId'] is int
                  ? yv['yarnVariantId']
                  : int.tryParse(yv['yarnVariantId']?.toString() ?? '') ?? 0),
      quantity: double.tryParse(json['quantity']?.toString() ?? '0') ?? 0.0,
      dateReturned: json['dateReturned']?.toString() ?? '',
      remark: json['remark']?.toString(),
      yarnSku: yv['sku']?.toString() ?? '',
      yarnMaterial: yarnMaterial,
      yarnColor: yarnColor,
      yarnSupplier: yarnSupplier,
    );
  }
}

class FabricReturnToWeaverItemModel extends FabricReturnToWeaverItemEntity {
  const FabricReturnToWeaverItemModel({
    required super.fabricReturnToWeaverId,
    super.fabricVariantId = 0,
    required super.quantity,
    required super.dateReturned,
    super.remark,
    required super.fabricName,
    required super.designName,
  });

  factory FabricReturnToWeaverItemModel.fromJson(Map<String, dynamic> json) {
    final fv = json['fabricVariant'] ?? {};
    final fabricName = fv['fabric']?['name'] ?? fv['product']?['name'] ?? 'Fabric';
    final designName = fv['design']?['name'] ?? 'Standard';

    return FabricReturnToWeaverItemModel(
      fabricReturnToWeaverId: json['fabricReturnToWeaverId'] is int
          ? json['fabricReturnToWeaverId']
          : int.tryParse(json['fabricReturnToWeaverId'].toString()) ?? 0,
      fabricVariantId: json['fabricVariantId'] is int
          ? json['fabricVariantId']
          : int.tryParse(json['fabricVariantId']?.toString() ?? '') ??
              (fv['fabricVariantId'] is int
                  ? fv['fabricVariantId']
                  : int.tryParse(fv['fabricVariantId']?.toString() ?? '') ?? 0),
      quantity: json['quantity'] is int
          ? json['quantity']
          : int.tryParse(json['quantity']?.toString() ?? '0') ?? 0,
      dateReturned: json['dateReturned']?.toString() ?? '',
      remark: json['remark']?.toString(),
      fabricName: fabricName,
      designName: designName,
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
    super.lengthCm,
    super.widthCm,
    super.remark,
    required super.dateReturned,
    super.paymentId,
    super.fabricVariant,
    super.isDefective,
    super.deductionAmount,
    super.defectReason,
  });

  factory FabricReturnItemModel.fromJson(Map<String, dynamic> json) {
    return FabricReturnItemModel(
      returnId: json['returnId'] is int
          ? json['returnId']
          : int.tryParse(json['returnId'].toString()) ?? 0,
      quantityReturned: json['quantityReturned'] is int
          ? json['quantityReturned']
          : int.tryParse(json['quantityReturned'].toString()) ?? 0,
      totalWeight:
          double.tryParse(json['totalWeight']?.toString() ?? '0') ?? 0.0,
      unitPrice: double.tryParse(json['unitPrice']?.toString() ?? '0') ?? 0.0,
      calculatedDeduction: double.tryParse(
        json['calculatedDeduction']?.toString() ?? '',
      ),
      netCreditValue: double.tryParse(json['netCreditValue']?.toString() ?? ''),
      lengthCm: double.tryParse(json['lengthCm']?.toString() ?? ''),
      widthCm: double.tryParse(json['widthCm']?.toString() ?? ''),
      remark: json['remark']?.toString(),
      dateReturned: json['dateReturned'] ?? '',
      paymentId: json['paymentId'] != null
          ? int.tryParse(json['paymentId'].toString())
          : null,
      fabricVariant: json['fabricVariant'] != null
          ? FabricVariantModel.fromJson(json['fabricVariant'])
          : null,
      isDefective: json['isDefective'] == true,
      deductionAmount: double.tryParse(json['deductionAmount']?.toString() ?? ''),
      defectReason: json['defectReason']?.toString(),
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
          : int.tryParse(json['weaverId']?.toString() ?? '') ??
              (json['weaverUserId'] is int
                  ? json['weaverUserId']
                  : int.tryParse(json['weaverUserId']?.toString() ?? '') ?? 0),
      fabricVariantId: json['fabricVariantId'] is int
          ? json['fabricVariantId']
          : int.tryParse(json['fabricVariantId']?.toString() ?? '') ?? 0,
      status: json['status']?.toString() ?? 'assigned',
      dateIssued: json['dateIssued']?.toString() ?? '',
      weaver: json['weaver'] != null
          ? WeaverModel.fromJson(json['weaver'])
          : null,
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
    super.yarnReturns = const [],
    required super.fabricReturns,
    super.fabricReturnsToWeaver = const [],
  });

  factory WorkOrderDetailModel.fromJson(Map<String, dynamic> json) {
    return WorkOrderDetailModel(
      zigId: json['zigId']?.toString() ?? '',
      weaverId: json['weaverId'] is int
          ? json['weaverId']
          : int.tryParse(json['weaverId']?.toString() ?? '') ??
              (json['weaverUserId'] is int
                  ? json['weaverUserId']
                  : int.tryParse(json['weaverUserId']?.toString() ?? '') ?? 0),
      fabricVariantId: json['fabricVariantId'] is int
          ? json['fabricVariantId']
          : int.tryParse(json['fabricVariantId']?.toString() ?? '') ?? 0,
      status: json['status']?.toString() ?? 'assigned',
      dateIssued: json['dateIssued']?.toString() ?? '',
      weaver: json['weaver'] != null
          ? WeaverModel.fromJson(json['weaver'])
          : null,
      fabricVariant: json['fabricVariant'] != null
          ? FabricVariantModel.fromJson(json['fabricVariant'])
          : null,
      yarnGiven:
          (json['yarnGiven'] as List?)
              ?.map((e) => YarnGivenItemModel.fromJson(e))
              .toList() ??
          [],
      yarnReturns:
          (json['yarnReturns'] as List?)
              ?.map((e) => YarnReturnItemModel.fromJson(e))
              .toList() ??
          [],
      fabricReturns:
          (json['fabricReturns'] as List?)
              ?.map((e) => FabricReturnItemModel.fromJson(e))
              .toList() ??
          [],
      fabricReturnsToWeaver:
          (json['fabricReturnsToWeaver'] as List?)
              ?.map((e) => FabricReturnToWeaverItemModel.fromJson(e))
              .toList() ??
          [],
    );
  }
}
