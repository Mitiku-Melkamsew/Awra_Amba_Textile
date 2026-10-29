import 'package:equatable/equatable.dart';
import 'package:awra_amba_textile/features/products/domain/entities/product_entity.dart';
import 'package:awra_amba_textile/features/weavers/domain/entities/weaver_entity.dart';

class YarnGivenItemEntity extends Equatable {
  final int yarnGivenId;
  final double quantity;
  final double unitPrice;
  final String dateGiven;
  final int? paymentId;
  final String yarnSku;
  final String yarnMaterial;
  final String yarnColor;

  const YarnGivenItemEntity({
    required this.yarnGivenId,
    required this.quantity,
    required this.unitPrice,
    required this.dateGiven,
    this.paymentId,
    required this.yarnSku,
    required this.yarnMaterial,
    required this.yarnColor,
  });

  double get totalCost => (quantity * unitPrice).roundToDouble();

  @override
  List<Object?> get props => [yarnGivenId, quantity, unitPrice, dateGiven, paymentId];
}

class FabricReturnItemEntity extends Equatable {
  final int returnId;
  final int quantityReturned;
  final double totalWeight;
  final double unitPrice;
  final double? calculatedDeduction;
  final double? netCreditValue;
  final String? remark;
  final String dateReturned;
  final int? paymentId;
  final FabricVariantEntity? fabricVariant;

  const FabricReturnItemEntity({
    required this.returnId,
    required this.quantityReturned,
    required this.totalWeight,
    required this.unitPrice,
    this.calculatedDeduction,
    this.netCreditValue,
    this.remark,
    required this.dateReturned,
    this.paymentId,
    this.fabricVariant,
  });

  double get avgWeight =>
      quantityReturned > 0 ? (totalWeight / quantityReturned) : 0.0;

  double get lineTotal => netCreditValue ??
      ((unitPrice - (calculatedDeduction ?? 0)) * quantityReturned).roundToDouble();

  @override
  List<Object?> get props => [
        returnId,
        quantityReturned,
        totalWeight,
        unitPrice,
        calculatedDeduction,
        netCreditValue,
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
  final List<FabricReturnItemEntity> fabricReturns;

  const WorkOrderDetailEntity({
    required super.zigId,
    required super.weaverId,
    required super.fabricVariantId,
    required super.status,
    required super.dateIssued,
    super.weaver,
    super.fabricVariant,
    required this.yarnGiven,
    required this.fabricReturns,
  });

  double get totalYarnQuantity =>
      yarnGiven.fold(0.0, (sum, item) => sum + item.quantity);

  double get totalYarnCost =>
      yarnGiven.fold(0.0, (sum, item) => sum + item.totalCost);

  int get totalFabricQuantity =>
      fabricReturns.fold(0, (sum, item) => sum + item.quantityReturned);

  double get totalFabricCredit =>
      fabricReturns.fold(0.0, (sum, item) => sum + item.lineTotal);

  double get netProfit => (totalFabricCredit - totalYarnCost).roundToDouble();
}
