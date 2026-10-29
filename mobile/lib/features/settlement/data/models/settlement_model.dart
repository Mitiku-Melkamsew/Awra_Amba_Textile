import '../../domain/entities/settlement_entity.dart';

class SettlementLineItemModel extends SettlementLineItemEntity {
  const SettlementLineItemModel({
    required super.returnId,
    required super.zigId,
    super.fabricType = '',
    required super.quantityReturned,
    required super.avgWeight,
    required super.unitPrice,
    required super.deductionPerPiece,
    super.adjustedPrice = 0.0,
    super.lineSubtotal = 0.0,
    required super.netCredit,
  });

  factory SettlementLineItemModel.fromJson(Map<String, dynamic> json) {
    final up = double.tryParse(json['unitPrice']?.toString() ?? '0') ?? 0.0;
    final ded = double.tryParse(json['deductionPerPiece']?.toString() ?? '0') ?? 0.0;
    final qty = json['quantityReturned'] is int
        ? json['quantityReturned']
        : int.tryParse(json['quantityReturned']?.toString() ??
                json['quantity']?.toString() ??
                '0') ??
            0;
    final adj = double.tryParse(json['adjustedPrice']?.toString() ?? '') ?? (up - ded);
    final nc = double.tryParse(json['netCredit']?.toString() ?? '') ?? (adj * qty);

    return SettlementLineItemModel(
      returnId: json['returnId'] is int
          ? json['returnId']
          : int.tryParse(json['returnId'].toString()) ?? 0,
      zigId: json['zigId']?.toString() ?? '',
      fabricType: json['fabricType']?.toString() ?? '',
      quantityReturned: qty,
      avgWeight: double.tryParse(json['avgWeight']?.toString() ?? '0') ?? 0.0,
      unitPrice: up,
      deductionPerPiece: ded,
      adjustedPrice: adj,
      lineSubtotal: double.tryParse(json['lineSubtotal']?.toString() ?? '') ?? nc,
      netCredit: nc,
    );
  }
}

class ZigDetailModel extends ZigDetailEntity {
  const ZigDetailModel({
    required super.zigId,
    required super.returns,
    required super.yarnQty,
    required super.yarnTotal,
    required super.yarnAvgPrice,
    required super.fabricTotal,
    required super.netProfit,
  });

  factory ZigDetailModel.fromJson(Map<String, dynamic> json) {
    return ZigDetailModel(
      zigId: json['zigId']?.toString() ?? '',
      returns: (json['returns'] as List?)
              ?.map((e) => SettlementLineItemModel.fromJson(e))
              .toList() ??
          [],
      yarnQty: double.tryParse(json['yarnQty']?.toString() ?? '0') ?? 0.0,
      yarnTotal: double.tryParse(json['yarnTotal']?.toString() ?? '0') ?? 0.0,
      yarnAvgPrice: double.tryParse(json['yarnAvgPrice']?.toString() ?? '0') ?? 0.0,
      fabricTotal: double.tryParse(json['fabricTotal']?.toString() ?? '0') ?? 0.0,
      netProfit: double.tryParse(json['netProfit']?.toString() ?? '0') ?? 0.0,
    );
  }
}

class WeaverSettlementDetailModel extends WeaverSettlementDetailEntity {
  const WeaverSettlementDetailModel({
    required super.weaverId,
    required super.weaverName,
    required super.zigIds,
    super.returnCount = 0,
    super.yarnCount = 0,
    required super.netSettlement,
    super.lineItems = const [],
    super.zigDetails = const [],
  });

  factory WeaverSettlementDetailModel.fromJson(Map<String, dynamic> json) {
    return WeaverSettlementDetailModel(
      weaverId: json['weaverId'] is int
          ? json['weaverId']
          : int.tryParse(json['weaverId'].toString()) ?? 0,
      weaverName: json['weaverName'] ?? '',
      zigIds: (json['zigIds'] as List?)?.map((e) => e.toString()).toList() ?? [],
      returnCount: json['returnCount'] ?? 0,
      yarnCount: json['yarnCount'] ?? 0,
      netSettlement:
          double.tryParse(json['netSettlement']?.toString() ?? '0') ?? 0.0,
      lineItems: (json['lineItems'] as List?)
              ?.map((e) => SettlementLineItemModel.fromJson(e))
              .toList() ??
          [],
      zigDetails: (json['zigDetails'] as List?)
              ?.map((e) => ZigDetailModel.fromJson(e))
              .toList() ??
          [],
    );
  }
}

class BatchSettlementPreviewModel extends BatchSettlementPreviewEntity {
  const BatchSettlementPreviewModel({
    required super.previewId,
    super.status = 'draft',
    required super.weaverCount,
    required super.grandTotal,
    required super.amharicAmountInWords,
    super.generatedAt,
    super.cutoffDate,
    required super.weavers,
  });

  factory BatchSettlementPreviewModel.fromJson(Map<String, dynamic> json) {
    return BatchSettlementPreviewModel(
      previewId: json['previewId'] ?? '',
      status: json['status'] ?? 'draft',
      weaverCount: json['weaverCount'] is int
          ? json['weaverCount']
          : int.tryParse(json['weaverCount']?.toString() ?? '0') ?? 0,
      grandTotal: double.tryParse(json['grandTotal']?.toString() ?? '0') ?? 0.0,
      amharicAmountInWords: json['amharicAmountInWords'] ?? '',
      generatedAt: json['generatedAt']?.toString(),
      cutoffDate: json['cutoffDate']?.toString(),
      weavers: (json['weavers'] as List?)
              ?.map((e) => WeaverSettlementDetailModel.fromJson(e))
              .toList() ??
          [],
    );
  }
}

class CommittedPaymentResultModel extends CommittedPaymentResultEntity {
  const CommittedPaymentResultModel({
    required super.paymentId,
    required super.weaverId,
    required super.weaverName,
    required super.amount,
    required super.reconciledZigIds,
  });

  factory CommittedPaymentResultModel.fromJson(Map<String, dynamic> json) {
    return CommittedPaymentResultModel(
      paymentId: json['paymentId'] is int
          ? json['paymentId']
          : int.tryParse(json['paymentId'].toString()) ?? 0,
      weaverId: json['weaverId'] is int
          ? json['weaverId']
          : int.tryParse(json['weaverId'].toString()) ?? 0,
      weaverName: json['weaverName'] ?? '',
      amount: double.tryParse(json['amount']?.toString() ?? '0') ?? 0.0,
      reconciledZigIds: (json['reconciledZigIds'] as List?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
    );
  }
}
