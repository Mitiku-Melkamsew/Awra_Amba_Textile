import 'package:equatable/equatable.dart';

class SettlementLineItem extends Equatable {
  final int returnId;
  final String zigId;
  final String fabricType;
  final int quantityReturned;
  final double avgWeight;
  final double unitPrice;
  final double deductionPerPiece;
  final double adjustedPrice;
  final double lineSubtotal;
  final double netCredit;

  const SettlementLineItem({
    required this.returnId,
    required this.zigId,
    this.fabricType = '',
    required this.quantityReturned,
    required this.avgWeight,
    required this.unitPrice,
    required this.deductionPerPiece,
    this.adjustedPrice = 0.0,
    this.lineSubtotal = 0.0,
    required this.netCredit,
  });

  factory SettlementLineItem.fromJson(Map<String, dynamic> json) {
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

    return SettlementLineItem(
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

  @override
  List<Object?> get props => [returnId, zigId, quantityReturned, netCredit];
}

class ZigDetail extends Equatable {
  final String zigId;
  final List<SettlementLineItem> returns;
  final double yarnQty;
  final double yarnTotal;
  final double yarnAvgPrice;
  final double fabricTotal;
  final double netProfit;

  const ZigDetail({
    required this.zigId,
    required this.returns,
    required this.yarnQty,
    required this.yarnTotal,
    required this.yarnAvgPrice,
    required this.fabricTotal,
    required this.netProfit,
  });

  factory ZigDetail.fromJson(Map<String, dynamic> json) {
    return ZigDetail(
      zigId: json['zigId']?.toString() ?? '',
      returns: (json['returns'] as List?)
              ?.map((e) => SettlementLineItem.fromJson(e))
              .toList() ??
          [],
      yarnQty: double.tryParse(json['yarnQty']?.toString() ?? '0') ?? 0.0,
      yarnTotal: double.tryParse(json['yarnTotal']?.toString() ?? '0') ?? 0.0,
      yarnAvgPrice: double.tryParse(json['yarnAvgPrice']?.toString() ?? '0') ?? 0.0,
      fabricTotal: double.tryParse(json['fabricTotal']?.toString() ?? '0') ?? 0.0,
      netProfit: double.tryParse(json['netProfit']?.toString() ?? '0') ?? 0.0,
    );
  }

  @override
  List<Object?> get props => [zigId, yarnQty, yarnTotal, fabricTotal, netProfit];
}

class WeaverSettlementDetail extends Equatable {
  final int weaverId;
  final String weaverName;
  final List<String> zigIds;
  final int returnCount;
  final int yarnCount;
  final double netSettlement;
  final List<SettlementLineItem> lineItems;
  final List<ZigDetail> zigDetails;

  const WeaverSettlementDetail({
    required this.weaverId,
    required this.weaverName,
    required this.zigIds,
    this.returnCount = 0,
    this.yarnCount = 0,
    required this.netSettlement,
    this.lineItems = const [],
    this.zigDetails = const [],
  });

  factory WeaverSettlementDetail.fromJson(Map<String, dynamic> json) {
    return WeaverSettlementDetail(
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
              ?.map((e) => SettlementLineItem.fromJson(e))
              .toList() ??
          [],
      zigDetails: (json['zigDetails'] as List?)
              ?.map((e) => ZigDetail.fromJson(e))
              .toList() ??
          [],
    );
  }

  @override
  List<Object?> get props => [weaverId, weaverName, netSettlement];
}

class BatchSettlementPreview extends Equatable {
  final String previewId;
  final String status;
  final int weaverCount;
  final double grandTotal;
  final String amharicAmountInWords;
  final String? generatedAt;
  final String? cutoffDate;
  final List<WeaverSettlementDetail> weavers;

  const BatchSettlementPreview({
    required this.previewId,
    this.status = 'draft',
    required this.weaverCount,
    required this.grandTotal,
    required this.amharicAmountInWords,
    this.generatedAt,
    this.cutoffDate,
    required this.weavers,
  });

  factory BatchSettlementPreview.fromJson(Map<String, dynamic> json) {
    return BatchSettlementPreview(
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
              ?.map((e) => WeaverSettlementDetail.fromJson(e))
              .toList() ??
          [],
    );
  }

  @override
  List<Object?> get props => [
        previewId,
        weaverCount,
        grandTotal,
        amharicAmountInWords,
        cutoffDate,
      ];
}

class CommittedPaymentResult extends Equatable {
  final int paymentId;
  final int weaverId;
  final String weaverName;
  final double amount;
  final List<String> reconciledZigIds;

  const CommittedPaymentResult({
    required this.paymentId,
    required this.weaverId,
    required this.weaverName,
    required this.amount,
    required this.reconciledZigIds,
  });

  factory CommittedPaymentResult.fromJson(Map<String, dynamic> json) {
    return CommittedPaymentResult(
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

  @override
  List<Object?> get props => [paymentId, weaverId, amount];
}
