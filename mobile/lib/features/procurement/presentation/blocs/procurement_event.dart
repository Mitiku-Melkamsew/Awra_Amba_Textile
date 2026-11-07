import 'package:equatable/equatable.dart';

abstract class ProcurementEvent extends Equatable {
  const ProcurementEvent();

  @override
  List<Object?> get props => [];
}

class LoadProcurements extends ProcurementEvent {}

class CreateProcurementSubmitted extends ProcurementEvent {
  final int supplierId;
  final String? purchaseDate;
  final String? notes;
  final List<Map<String, dynamic>> lines;

  const CreateProcurementSubmitted({
    required this.supplierId,
    this.purchaseDate,
    this.notes,
    required this.lines,
  });

  @override
  List<Object?> get props => [supplierId, purchaseDate, notes, lines];
}
