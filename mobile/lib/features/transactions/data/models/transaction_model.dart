import 'package:awra_amba_textile/features/products/data/models/product_model.dart';
import 'package:awra_amba_textile/features/weavers/data/models/weaver_model.dart';
import '../../domain/entities/transaction_entity.dart';

class TransactionLineModel extends TransactionLineEntity {
  const TransactionLineModel({
    required super.lineId,
    super.yarnVariantId,
    super.fabricVariantId,
    required super.quantity,
    required super.unitPrice,
    super.deliveredQuantity = 0.0,
    super.description,
    super.yarnVariant,
    super.fabricVariant,
  });

  factory TransactionLineModel.fromJson(Map<String, dynamic> json) {
    return TransactionLineModel(
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
          ? YarnVariantModel.fromJson(json['yarnVariant'])
          : null,
      fabricVariant: json['fabricVariant'] != null
          ? FabricVariantModel.fromJson(json['fabricVariant'])
          : null,
    );
  }
}

class TransactionPaymentModel extends TransactionPaymentEntity {
  const TransactionPaymentModel({
    required super.installmentId,
    required super.amount,
    required super.paymentDate,
    super.paymentMethod,
    super.notes,
  });

  factory TransactionPaymentModel.fromJson(Map<String, dynamic> json) {
    return TransactionPaymentModel(
      installmentId: json['installmentId'] is int
          ? json['installmentId']
          : int.tryParse(json['installmentId'].toString()) ?? 0,
      amount: double.tryParse(json['amount']?.toString() ?? '0') ?? 0.0,
      paymentDate: json['paymentDate'] ?? '',
      paymentMethod: json['paymentMethod']?.toString(),
      notes: json['notes']?.toString(),
    );
  }
}

class CommercialTransactionModel extends CommercialTransactionEntity {
  const CommercialTransactionModel({
    required super.transactionId,
    required super.type,
    required super.status,
    required super.paymentTerms,
    super.supplierId,
    super.weaverId,
    super.merchantId,
    required super.totalAmount,
    required super.amountPaid,
    super.deliveredAt,
    super.notes,
    required super.createdAt,
    super.supplier,
    super.weaver,
    super.merchant,
    super.lines = const [],
    super.payments = const [],
  });

  factory CommercialTransactionModel.fromJson(Map<String, dynamic> json) {
    return CommercialTransactionModel(
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
      supplier: json['supplier'] != null ? SupplierModel.fromJson(json['supplier']) : null,
      weaver: json['weaver'] != null ? WeaverModel.fromJson(json['weaver']) : null,
      merchant: json['merchant'],
      lines: (json['lines'] as List?)
              ?.map((e) => TransactionLineModel.fromJson(e))
              .toList() ??
          [],
      payments: (json['payments'] as List?)
              ?.map((e) => TransactionPaymentModel.fromJson(e))
              .toList() ??
          [],
    );
  }
}
