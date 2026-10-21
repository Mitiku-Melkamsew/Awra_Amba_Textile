import 'package:equatable/equatable.dart';
import 'weaver.dart';
import 'stock_item.dart';

class TransactionLine extends Equatable {
  final int lineId;
  final int? yarnVariantId;
  final int? fabricVariantId;
  final double quantity;
  final double unitPrice;
  final double deliveredQuantity;
  final String? description;
  final YarnVariant? yarnVariant;
  final FabricVariant? fabricVariant;

  const TransactionLine({
    required this.lineId,
    this.yarnVariantId,
    this.fabricVariantId,
    required this.quantity,
    required this.unitPrice,
    this.deliveredQuantity = 0.0,
    this.description,
    this.yarnVariant,
    this.fabricVariant,
  });

  double get subtotal => (quantity * unitPrice).roundToDouble();

  String get itemLabel {
    if (description != null && description!.isNotEmpty) return description!;
    if (fabricVariant != null) return fabricVariant!.displayName;
    if (yarnVariant != null) return yarnVariant!.displayName;
    return 'Item #$lineId';
  }

  factory TransactionLine.fromJson(Map<String, dynamic> json) {
    return TransactionLine(
      lineId: json['lineId'] is int
          ? json['lineId']
          : int.tryParse(json['lineId'].toString()) ?? 0,
      yarnVariantId: json['yarnVariantId'] != null
          ? int.tryParse(json['yarnVariantId'].toString())
          : null,
      fabricVariantId: json['fabricVariantId'] != null
          ? int.tryParse(json['fabricVariantId'].toString())
          : null,
      quantity: double.tryParse(json['quantity']?.toString() ?? '0') ?? 0.0,
      unitPrice: double.tryParse(json['unitPrice']?.toString() ?? '0') ?? 0.0,
      deliveredQuantity:
          double.tryParse(json['deliveredQuantity']?.toString() ?? '0') ?? 0.0,
      description: json['description']?.toString(),
      yarnVariant: json['yarnVariant'] != null
          ? YarnVariant.fromJson(json['yarnVariant'])
          : null,
      fabricVariant: json['fabricVariant'] != null
          ? FabricVariant.fromJson(json['fabricVariant'])
          : null,
    );
  }

  @override
  List<Object?> get props => [lineId, quantity, unitPrice, description];
}

class TransactionPayment extends Equatable {
  final int installmentId;
  final double amount;
  final String paymentDate;
  final String? paymentMethod;
  final String? notes;

  const TransactionPayment({
    required this.installmentId,
    required this.amount,
    required this.paymentDate,
    this.paymentMethod,
    this.notes,
  });

  factory TransactionPayment.fromJson(Map<String, dynamic> json) {
    return TransactionPayment(
      installmentId: json['installmentId'] is int
          ? json['installmentId']
          : int.tryParse(json['installmentId'].toString()) ?? 0,
      amount: double.tryParse(json['amount']?.toString() ?? '0') ?? 0.0,
      paymentDate: json['paymentDate'] ?? '',
      paymentMethod: json['paymentMethod']?.toString(),
      notes: json['notes']?.toString(),
    );
  }

  @override
  List<Object?> get props => [installmentId, amount, paymentDate];
}

class CommercialTransaction extends Equatable {
  final String transactionId;
  final String type;
  final String status;
  final String paymentTerms;
  final int? supplierId;
  final int? weaverId;
  final int? merchantId;
  final double totalAmount;
  final double amountPaid;
  final String? deliveredAt;
  final String? notes;
  final String createdAt;
  final Supplier? supplier;
  final Weaver? weaver;
  final Map<String, dynamic>? merchant;
  final List<TransactionLine> lines;
  final List<TransactionPayment> payments;

  const CommercialTransaction({
    required this.transactionId,
    required this.type,
    required this.status,
    required this.paymentTerms,
    this.supplierId,
    this.weaverId,
    this.merchantId,
    required this.totalAmount,
    required this.amountPaid,
    this.deliveredAt,
    this.notes,
    required this.createdAt,
    this.supplier,
    this.weaver,
    this.merchant,
    this.lines = const [],
    this.payments = const [],
  });

  double get balanceDue => (totalAmount - amountPaid).roundToDouble();
  bool get isFullyPaid => amountPaid >= totalAmount && totalAmount > 0;
  bool get isDelivered => deliveredAt != null;

  String get counterpartyName {
    if (weaver != null) return weaver!.fullName;
    if (supplier != null) return supplier!.name;
    if (merchant != null) {
      return merchant!['companyName'] ?? merchant!['contactPhone'] ?? 'Merchant';
    }
    return '-';
  }

  String get typeLabel {
    switch (type) {
      case 'yarn_purchase':
        return 'Yarn Purchase (Supplier)';
      case 'fabric_purchase':
        return 'Fabric Purchase (Weaver)';
      case 'yarn_sale':
        return 'Yarn Sale (Weaver)';
      case 'fabric_sale':
        return 'Fabric Sale (Merchant)';
      case 'weaver_payout':
        return 'Weaver Payout';
      default:
        return type.replaceAll('_', ' ').toUpperCase();
    }
  }

  factory CommercialTransaction.fromJson(Map<String, dynamic> json) {
    return CommercialTransaction(
      transactionId: json['transactionId'] ?? '',
      type: json['type'] ?? '',
      status: json['status'] ?? 'pending',
      paymentTerms: json['paymentTerms'] ?? 'on_delivery',
      supplierId: json['supplierId'] != null
          ? int.tryParse(json['supplierId'].toString())
          : null,
      weaverId: json['weaverId'] != null
          ? int.tryParse(json['weaverId'].toString())
          : null,
      merchantId: json['merchantId'] != null
          ? int.tryParse(json['merchantId'].toString())
          : null,
      totalAmount: double.tryParse(json['totalAmount']?.toString() ?? '0') ?? 0.0,
      amountPaid: double.tryParse(json['amountPaid']?.toString() ?? '0') ?? 0.0,
      deliveredAt: json['deliveredAt']?.toString(),
      notes: json['notes']?.toString(),
      createdAt: json['createdAt'] ?? '',
      supplier: json['supplier'] != null ? Supplier.fromJson(json['supplier']) : null,
      weaver: json['weaver'] != null ? Weaver.fromJson(json['weaver']) : null,
      merchant: json['merchant'],
      lines: (json['lines'] as List?)
              ?.map((e) => TransactionLine.fromJson(e))
              .toList() ??
          [],
      payments: (json['payments'] as List?)
              ?.map((e) => TransactionPayment.fromJson(e))
              .toList() ??
          [],
    );
  }

  @override
  List<Object?> get props => [
        transactionId,
        type,
        status,
        totalAmount,
        amountPaid,
        deliveredAt,
      ];
}
