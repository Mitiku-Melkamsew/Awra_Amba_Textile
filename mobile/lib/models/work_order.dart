import 'package:equatable/equatable.dart';
import 'weaver.dart';
import 'stock_item.dart';

class YarnGivenItem extends Equatable {
  final int yarnGivenId;
  final double quantity;
  final double unitPrice;
  final String dateGiven;
  final int? paymentId;
  final String yarnSku;
  final String yarnMaterial;
  final String yarnColor;

  const YarnGivenItem({
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

  factory YarnGivenItem.fromJson(Map<String, dynamic> json) {
    final yv = json['yarnVariant'] ?? {};
    return YarnGivenItem(
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

  @override
  List<Object?> get props => [yarnGivenId, quantity, unitPrice, dateGiven, paymentId];
}

class FabricReturnItem extends Equatable {
  final int returnId;
  final int quantityReturned;
  final double totalWeight;
  final double unitPrice;
  final double? calculatedDeduction;
  final double? netCreditValue;
  final String? remark;
  final String dateReturned;
  final int? paymentId;
  final FabricVariant? fabricVariant;

  const FabricReturnItem({
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

  factory FabricReturnItem.fromJson(Map<String, dynamic> json) {
    return FabricReturnItem(
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
          ? FabricVariant.fromJson(json['fabricVariant'])
          : null,
    );
  }

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

class WorkOrder extends Equatable {
  final String zigId;
  final int weaverId;
  final int fabricVariantId;
  final String status;
  final String dateIssued;
  final Weaver? weaver;
  final FabricVariant? fabricVariant;
  final int yarnGivenCount;
  final int fabricReturnsCount;

  const WorkOrder({
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

  factory WorkOrder.fromJson(Map<String, dynamic> json) {
    return WorkOrder(
      zigId: json['zigId']?.toString() ?? '',
      weaverId: json['weaverId'] is int
          ? json['weaverId']
          : int.tryParse(json['weaverId'].toString()) ?? 0,
      fabricVariantId: json['fabricVariantId'] is int
          ? json['fabricVariantId']
          : int.tryParse(json['fabricVariantId'].toString()) ?? 0,
      status: json['status']?.toString() ?? 'assigned',
      dateIssued: json['dateIssued']?.toString() ?? '',
      weaver: json['weaver'] != null ? Weaver.fromJson(json['weaver']) : null,
      fabricVariant: json['fabricVariant'] != null
          ? FabricVariant.fromJson(json['fabricVariant'])
          : null,
      yarnGivenCount: json['_count']?['yarnGiven'] ?? 0,
      fabricReturnsCount: json['_count']?['fabricReturns'] ?? 0,
    );
  }

  @override
  List<Object?> get props => [
        zigId,
        weaverId,
        fabricVariantId,
        status,
        dateIssued,
      ];
}

class WorkOrderDetail extends WorkOrder {
  final List<YarnGivenItem> yarnGiven;
  final List<FabricReturnItem> fabricReturns;

  const WorkOrderDetail({
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

  factory WorkOrderDetail.fromJson(Map<String, dynamic> json) {
    return WorkOrderDetail(
      zigId: json['zigId']?.toString() ?? '',
      weaverId: json['weaverId'] is int
          ? json['weaverId']
          : int.tryParse(json['weaverId'].toString()) ?? 0,
      fabricVariantId: json['fabricVariantId'] is int
          ? json['fabricVariantId']
          : int.tryParse(json['fabricVariantId'].toString()) ?? 0,
      status: json['status']?.toString() ?? 'assigned',
      dateIssued: json['dateIssued']?.toString() ?? '',
      weaver: json['weaver'] != null ? Weaver.fromJson(json['weaver']) : null,
      fabricVariant: json['fabricVariant'] != null
          ? FabricVariant.fromJson(json['fabricVariant'])
          : null,
      yarnGiven: (json['yarnGiven'] as List?)
              ?.map((e) => YarnGivenItem.fromJson(e))
              .toList() ??
          [],
      fabricReturns: (json['fabricReturns'] as List?)
              ?.map((e) => FabricReturnItem.fromJson(e))
              .toList() ??
          [],
    );
  }
}
