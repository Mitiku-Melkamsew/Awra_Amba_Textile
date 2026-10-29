import 'package:equatable/equatable.dart';

class SettlementLineItemEntity extends Equatable {
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

  const SettlementLineItemEntity({
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

  @override
  List<Object?> get props => [returnId, zigId, quantityReturned, netCredit];
}

class ZigDetailEntity extends Equatable {
  final String zigId;
  final List<SettlementLineItemEntity> returns;
  final double yarnQty;
  final double yarnTotal;
  final double yarnAvgPrice;
  final double fabricTotal;
  final double netProfit;

  const ZigDetailEntity({
    required this.zigId,
    required this.returns,
    required this.yarnQty,
    required this.yarnTotal,
    required this.yarnAvgPrice,
    required this.fabricTotal,
    required this.netProfit,
  });

  @override
  List<Object?> get props => [zigId, yarnQty, yarnTotal, fabricTotal, netProfit];
}

class WeaverSettlementDetailEntity extends Equatable {
  final int weaverId;
  final String weaverName;
  final List<String> zigIds;
  final int returnCount;
  final int yarnCount;
  final double netSettlement;
  final List<SettlementLineItemEntity> lineItems;
  final List<ZigDetailEntity> zigDetails;

  const WeaverSettlementDetailEntity({
    required this.weaverId,
    required this.weaverName,
    required this.zigIds,
    this.returnCount = 0,
    this.yarnCount = 0,
    required this.netSettlement,
    this.lineItems = const [],
    this.zigDetails = const [],
  });

  @override
  List<Object?> get props => [weaverId, weaverName, netSettlement];
}

class BatchSettlementPreviewEntity extends Equatable {
  final String previewId;
  final String status;
  final int weaverCount;
  final double grandTotal;
  final String amharicAmountInWords;
  final String? generatedAt;
  final String? cutoffDate;
  final List<WeaverSettlementDetailEntity> weavers;

  const BatchSettlementPreviewEntity({
    required this.previewId,
    this.status = 'draft',
    required this.weaverCount,
    required this.grandTotal,
    required this.amharicAmountInWords,
    this.generatedAt,
    this.cutoffDate,
    required this.weavers,
  });

  @override
  List<Object?> get props => [
        previewId,
        weaverCount,
        grandTotal,
        amharicAmountInWords,
        cutoffDate,
      ];
}

class CommittedPaymentResultEntity extends Equatable {
  final int paymentId;
  final int weaverId;
  final String weaverName;
  final double amount;
  final List<String> reconciledZigIds;

  const CommittedPaymentResultEntity({
    required this.paymentId,
    required this.weaverId,
    required this.weaverName,
    required this.amount,
    required this.reconciledZigIds,
  });

  @override
  List<Object?> get props => [paymentId, weaverId, amount];
}
