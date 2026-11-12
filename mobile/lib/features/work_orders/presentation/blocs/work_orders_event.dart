import 'package:equatable/equatable.dart';

abstract class WorkOrdersEvent extends Equatable {
  const WorkOrdersEvent();
  @override
  List<Object?> get props => [];
}

class LoadWorkOrders extends WorkOrdersEvent {
  final String? status;
  final int? weaverId;

  const LoadWorkOrders({this.status, this.weaverId});

  @override
  List<Object?> get props => [status, weaverId];
}

class LoadWorkOrderDetail extends WorkOrdersEvent {
  final String zigId;

  const LoadWorkOrderDetail(this.zigId);

  @override
  List<Object?> get props => [zigId];
}

class CreateWorkOrderSubmitted extends WorkOrdersEvent {
  final int weaverUserId;
  final String? zigId;
  final int fabricVariantId;
  final List<Map<String, dynamic>>? yarnLines;

  const CreateWorkOrderSubmitted({
    required this.weaverUserId,
    this.zigId,
    required this.fabricVariantId,
    this.yarnLines,
  });

  @override
  List<Object?> get props => [
    weaverUserId,
    zigId,
    fabricVariantId,
    yarnLines,
  ];
}

class AddYarnGivenSubmitted extends WorkOrdersEvent {
  final String zigId;
  final List<Map<String, dynamic>> lines;

  const AddYarnGivenSubmitted({required this.zigId, required this.lines});

  @override
  List<Object?> get props => [zigId, lines];
}

class DeleteYarnGivenSubmitted extends WorkOrdersEvent {
  final String zigId;
  final int id;

  const DeleteYarnGivenSubmitted({required this.zigId, required this.id});

  @override
  List<Object?> get props => [zigId, id];
}

class AddFabricReturnSubmitted extends WorkOrdersEvent {
  final String zigId;
  final int? fabricVariantId;
  final int? fabricId;
  final int? warpColorId;
  final int? weftColorId;
  final int? designId;
  final int quantityReturned;
  final double totalWeight;
  final double unitPrice;
  final double? lengthCm;
  final double? widthCm;
  final String? remark;
  final bool isDefective;
  final double? deductionAmount;
  final String? defectReason;

  const AddFabricReturnSubmitted({
    required this.zigId,
    this.fabricVariantId,
    this.fabricId,
    this.warpColorId,
    this.weftColorId,
    this.designId,
    required this.quantityReturned,
    required this.totalWeight,
    required this.unitPrice,
    this.lengthCm,
    this.widthCm,
    this.remark,
    this.isDefective = false,
    this.deductionAmount,
    this.defectReason,
  });

  @override
  List<Object?> get props => [
    zigId,
    quantityReturned,
    totalWeight,
    unitPrice,
    isDefective,
    deductionAmount,
  ];
}

class DeleteFabricReturnSubmitted extends WorkOrdersEvent {
  final String zigId;
  final int id;

  const DeleteFabricReturnSubmitted({required this.zigId, required this.id});

  @override
  List<Object?> get props => [zigId, id];
}

class UpdateWorkOrderStatusSubmitted extends WorkOrdersEvent {
  final String zigId;
  final String status;

  const UpdateWorkOrderStatusSubmitted({
    required this.zigId,
    required this.status,
  });

  @override
  List<Object?> get props => [zigId, status];
}

class MarkWorkOrderReturnedSubmitted extends WorkOrdersEvent {
  final String zigId;

  const MarkWorkOrderReturnedSubmitted(this.zigId);

  @override
  List<Object?> get props => [zigId];
}

class CancelWorkOrderSubmitted extends WorkOrdersEvent {
  final String zigId;

  const CancelWorkOrderSubmitted(this.zigId);

  @override
  List<Object?> get props => [zigId];
}

class RecordYarnReturnSubmitted extends WorkOrdersEvent {
  final String zigId;
  final int yarnVariantId;
  final double quantity;
  final String? remark;

  const RecordYarnReturnSubmitted({
    required this.zigId,
    required this.yarnVariantId,
    required this.quantity,
    this.remark,
  });

  @override
  List<Object?> get props => [zigId, yarnVariantId, quantity, remark];
}

class RecordFabricReturnToWeaverSubmitted extends WorkOrdersEvent {
  final String zigId;
  final int fabricVariantId;
  final int quantity;
  final String? remark;

  const RecordFabricReturnToWeaverSubmitted({
    required this.zigId,
    required this.fabricVariantId,
    required this.quantity,
    this.remark,
  });

  @override
  List<Object?> get props => [zigId, fabricVariantId, quantity, remark];
}
