import 'package:equatable/equatable.dart';

class ProcurementLineEntity extends Equatable {
  final int lineId;
  final int yarnVariantId;
  final String yarnName;
  final double quantity;
  final double unitPrice;

  const ProcurementLineEntity({
    required this.lineId,
    required this.yarnVariantId,
    this.yarnName = '',
    required this.quantity,
    required this.unitPrice,
  });

  double get lineTotal => (quantity * unitPrice).roundToDouble();

  @override
  List<Object?> get props => [lineId, yarnVariantId, yarnName, quantity, unitPrice];
}

class ProcurementEntity extends Equatable {
  final int procurementId;
  final int supplierId;
  final String supplierName;
  final String purchaseDate;
  final double totalCost;
  final String? notes;
  final List<ProcurementLineEntity> lines;

  const ProcurementEntity({
    required this.procurementId,
    required this.supplierId,
    this.supplierName = '',
    required this.purchaseDate,
    required this.totalCost,
    this.notes,
    required this.lines,
  });

  @override
  List<Object?> get props => [
    procurementId,
    supplierId,
    supplierName,
    purchaseDate,
    totalCost,
    notes,
    lines,
  ];
}
