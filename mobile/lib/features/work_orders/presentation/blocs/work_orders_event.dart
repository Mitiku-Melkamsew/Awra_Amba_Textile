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
  final int weaverId;
  final String? zigId;
  final int productId;
  final int warpColorId;
  final int weftColorId;
  final int? designId;
  final double? unitPrice;
  final List<Map<String, dynamic>>? yarnLines;

  const CreateWorkOrderSubmitted({
    required this.weaverId,
    this.zigId,
    required this.productId,
    required this.warpColorId,
    required this.weftColorId,
    this.designId,
    this.unitPrice,
    this.yarnLines,
  });

  @override
  List<Object?> get props => [
        weaverId,
        zigId,
        productId,
        warpColorId,
        weftColorId,
        designId,
        unitPrice,
      ];
}

class AddYarnGivenSubmitted extends WorkOrdersEvent {
  final String zigId;
  final List<Map<String, dynamic>> lines;

  const AddYarnGivenSubmitted({required this.zigId, required this.lines});

  @override
  List<Object?> get props => [zigId, lines];
}

class AddFabricReturnSubmitted extends WorkOrdersEvent {
  final String zigId;
  final int? fabricVariantId;
  final int? warpColorId;
  final int? weftColorId;
  final int? designId;
  final int quantityReturned;
  final double totalWeight;
  final double unitPrice;
  final double? lengthCm;
  final double? widthCm;
  final String? remark;

  const AddFabricReturnSubmitted({
    required this.zigId,
    this.fabricVariantId,
    this.warpColorId,
    this.weftColorId,
    this.designId,
    required this.quantityReturned,
    required this.totalWeight,
    required this.unitPrice,
    this.lengthCm,
    this.widthCm,
    this.remark,
  });

  @override
  List<Object?> get props => [
        zigId,
        quantityReturned,
        totalWeight,
        unitPrice,
      ];
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
