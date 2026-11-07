import '../../domain/entities/procurement_entity.dart';

class ProcurementLineModel extends ProcurementLineEntity {
  const ProcurementLineModel({
    required super.lineId,
    required super.yarnVariantId,
    super.yarnName,
    required super.quantity,
    required super.unitPrice,
  });

  factory ProcurementLineModel.fromJson(Map<String, dynamic> json) {
    return ProcurementLineModel(
      lineId: int.tryParse(json['id']?.toString() ?? json['lineId']?.toString() ?? '0') ?? 0,
      yarnVariantId: int.tryParse(json['yarnVariantId']?.toString() ?? '0') ?? 0,
      yarnName: json['yarnName']?.toString() ?? json['yarnVariant']?['displayName']?.toString() ?? 'Yarn Variant #${json['yarnVariantId']}',
      quantity: double.tryParse(json['quantity']?.toString() ?? '0') ?? 0.0,
      unitPrice: double.tryParse(json['unitPrice']?.toString() ?? '0') ?? 0.0,
    );
  }

  Map<String, dynamic> toJson() => {
    'yarnVariantId': yarnVariantId,
    'quantity': quantity,
    'unitPrice': unitPrice,
  };
}

class ProcurementModel extends ProcurementEntity {
  const ProcurementModel({
    required super.procurementId,
    required super.supplierId,
    super.supplierName,
    required super.purchaseDate,
    required super.totalCost,
    super.notes,
    required super.lines,
  });

  factory ProcurementModel.fromJson(Map<String, dynamic> json) {
    final rawLines = json['lines'] as List? ?? [];
    final linesList = rawLines
        .map((l) => ProcurementLineModel.fromJson(l as Map<String, dynamic>))
        .toList();

    return ProcurementModel(
      procurementId: int.tryParse(json['id']?.toString() ?? json['procurementId']?.toString() ?? '0') ?? 0,
      supplierId: int.tryParse(json['supplierId']?.toString() ?? '0') ?? 0,
      supplierName: json['supplierName']?.toString() ?? json['supplier']?['name']?.toString() ?? 'Supplier #${json['supplierId']}',
      purchaseDate: json['purchaseDate']?.toString() ?? json['createdAt']?.toString() ?? '',
      totalCost: double.tryParse(json['totalCost']?.toString() ?? '0') ?? 0.0,
      notes: json['notes']?.toString(),
      lines: linesList,
    );
  }
}
