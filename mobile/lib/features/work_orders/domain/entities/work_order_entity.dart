import 'package:equatable/equatable.dart';
import 'package:awra_amba_textile/features/products/domain/entities/product_entity.dart';
import 'package:awra_amba_textile/features/weavers/domain/entities/weaver_entity.dart';

class YarnGivenItemEntity extends Equatable {
  final int yarnGivenId;
  final int yarnVariantId;
  final double quantity;
  final double unitPrice;
  final String dateGiven;
  final int? paymentId;
  final String yarnSku;
  final String yarnMaterial;
  final String yarnColor;
  final String? yarnSupplier;

  const YarnGivenItemEntity({
    required this.yarnGivenId,
    this.yarnVariantId = 0,
    required this.quantity,
    required this.unitPrice,
    required this.dateGiven,
    this.paymentId,
    required this.yarnSku,
    required this.yarnMaterial,
    required this.yarnColor,
    this.yarnSupplier,
  });

  double get totalCost => (quantity * unitPrice).roundToDouble();

  @override
  List<Object?> get props => [
    yarnGivenId,
    yarnVariantId,
    quantity,
    unitPrice,
    dateGiven,
    paymentId,
  ];
}

class YarnReturnItemEntity extends Equatable {
  final int yarnReturnId;
  final int yarnVariantId;
  final double quantity;
  final String dateReturned;
  final String? remark;
  final String yarnSku;
  final String yarnMaterial;
  final String yarnColor;
  final String? yarnSupplier;

  const YarnReturnItemEntity({
    required this.yarnReturnId,
    this.yarnVariantId = 0,
    required this.quantity,
    required this.dateReturned,
    this.remark,
    required this.yarnSku,
    required this.yarnMaterial,
    required this.yarnColor,
    this.yarnSupplier,
  });

  @override
  List<Object?> get props => [
    yarnReturnId,
    yarnVariantId,
    quantity,
    dateReturned,
    remark,
    yarnSku,
  ];
}

class FabricReturnToWeaverItemEntity extends Equatable {
  final int fabricReturnToWeaverId;
  final int fabricVariantId;
  final int quantity;
  final String dateReturned;
  final String? remark;
  final String fabricName;
  final String designName;

  const FabricReturnToWeaverItemEntity({
    required this.fabricReturnToWeaverId,
    this.fabricVariantId = 0,
    required this.quantity,
    required this.dateReturned,
    this.remark,
    required this.fabricName,
    required this.designName,
  });

  @override
  List<Object?> get props => [
    fabricReturnToWeaverId,
    fabricVariantId,
    quantity,
    dateReturned,
    remark,
  ];
}

class FabricReturnItemEntity extends Equatable {
  final int returnId;
  final int quantityReturned;
  final double totalWeight;
  final double unitPrice;
  final double? calculatedDeduction;
  final double? netCreditValue;
  final double? lengthCm;
  final double? widthCm;
  final String? remark;
  final String dateReturned;
  final int? paymentId;
  final FabricVariantEntity? fabricVariant;
  final bool isDefective;
  final double? deductionAmount;
  final String? defectReason;

  const FabricReturnItemEntity({
    required this.returnId,
    required this.quantityReturned,
    required this.totalWeight,
    required this.unitPrice,
    this.calculatedDeduction,
    this.netCreditValue,
    this.lengthCm,
    this.widthCm,
    this.remark,
    required this.dateReturned,
    this.paymentId,
    this.fabricVariant,
    this.isDefective = false,
    this.deductionAmount,
    this.defectReason,
  });

  double get avgWeight =>
      quantityReturned > 0 ? (totalWeight / quantityReturned) : 0.0;

  double get lineTotal =>
      netCreditValue ??
      ((unitPrice - (calculatedDeduction ?? 0)) * quantityReturned)
          .roundToDouble();

  @override
  List<Object?> get props => [
    returnId,
    quantityReturned,
    totalWeight,
    unitPrice,
    calculatedDeduction,
    netCreditValue,
    lengthCm,
    widthCm,
    paymentId,
  ];
}

class WorkOrderEntity extends Equatable {
  final String zigId;
  final int weaverId;
  final int fabricVariantId;
  final String status;
  final String dateIssued;
  final WeaverEntity? weaver;
  final FabricVariantEntity? fabricVariant;
  final int yarnGivenCount;
  final int fabricReturnsCount;

  const WorkOrderEntity({
    required this.zigId,
    required this.weaverId,
    required this.fabricVariantId,
    required this.status,
    required this.dateIssued,
    this.weaver,
    this.fabricVariant,
    this.yarnGivenCount = 0,
    this.fabricReturnsCount = 0,
  });

  bool get canMarkReturned =>
      status != 'returned' && status != 'reconciled' && status != 'cancelled';

  bool get canCancel => status != 'reconciled' && status != 'cancelled';

  bool get isReturned => status == 'returned';
  bool get isReconciled => status == 'reconciled';
  bool get isCancelled => status == 'cancelled';
  bool get isInProgress => status == 'in_progress';

  @override
  List<Object?> get props => [
    zigId,
    weaverId,
    fabricVariantId,
    status,
    dateIssued,
  ];
}

class WorkOrderDetailEntity extends WorkOrderEntity {
  final List<YarnGivenItemEntity> yarnGiven;
  final List<YarnReturnItemEntity> yarnReturns;
  final List<FabricReturnItemEntity> fabricReturns;
  final List<FabricReturnToWeaverItemEntity> fabricReturnsToWeaver;

  const WorkOrderDetailEntity({
    required super.zigId,
    required super.weaverId,
    required super.fabricVariantId,
    required super.status,
    required super.dateIssued,
    super.weaver,
    super.fabricVariant,
    required this.yarnGiven,
    this.yarnReturns = const [],
    required this.fabricReturns,
    this.fabricReturnsToWeaver = const [],
  });

  double get totalYarnQuantity =>
      yarnGiven.fold(0.0, (sum, item) => sum + item.quantity);

  double get totalYarnReturned =>
      yarnReturns.fold(0.0, (sum, item) => sum + item.quantity);

  double get netYarnQuantity =>
      (totalYarnQuantity - totalYarnReturned).clamp(0.0, double.infinity);

  double get totalYarnCost =>
      yarnGiven.fold(0.0, (sum, item) => sum + item.totalCost);

  int get totalFabricQuantity =>
      fabricReturns.fold(0, (sum, item) => sum + item.quantityReturned);

  int get totalFabricReturnedToWeaver =>
      fabricReturnsToWeaver.fold(0, (sum, item) => sum + item.quantity);

  double get totalFabricCredit =>
      fabricReturns.fold(0.0, (sum, item) => sum + item.lineTotal);

  double get netProfit => (totalFabricCredit - totalYarnCost).roundToDouble();
}
