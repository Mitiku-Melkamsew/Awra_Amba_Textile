import 'package:equatable/equatable.dart';
import 'package:awra_amba_textile/features/products/domain/entities/product_entity.dart';
import 'package:awra_amba_textile/features/weavers/domain/entities/weaver_entity.dart';

class TransactionLineEntity extends Equatable {
  final int lineId;
  final int? yarnVariantId;
  final int? fabricVariantId;
  final double quantity;
  final double unitPrice;
  final double deliveredQuantity;
  final String? description;
  final YarnVariantEntity? yarnVariant;
  final FabricVariantEntity? fabricVariant;

  const TransactionLineEntity({
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

  @override
  List<Object?> get props => [lineId, quantity, unitPrice, description];
}

class TransactionPaymentEntity extends Equatable {
  final int installmentId;
  final double amount;
  final String paymentDate;
  final String? paymentMethod;
  final String? notes;

  const TransactionPaymentEntity({
    required this.installmentId,
    required this.amount,
    required this.paymentDate,
    this.paymentMethod,
    this.notes,
  });

  @override
  List<Object?> get props => [installmentId, amount, paymentDate];
}

class CommercialTransactionEntity extends Equatable {
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
  final SupplierEntity? supplier;
  final WeaverEntity? weaver;
  final Map<String, dynamic>? merchant;
  final List<TransactionLineEntity> lines;
  final List<TransactionPaymentEntity> payments;

  const CommercialTransactionEntity({
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
