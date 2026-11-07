import 'package:equatable/equatable.dart';

abstract class WeaversEvent extends Equatable {
  const WeaversEvent();

  @override
  List<Object?> get props => [];
}

class LoadWeavers extends WeaversEvent {
  final String? search;
  final String? sort;

  const LoadWeavers({this.search, this.sort});

  @override
  List<Object?> get props => [search, sort];
}

class CreateWeaverSubmitted extends WeaversEvent {
  final String firstName;
  final String lastName;
  final String? phone;
  final String? email;
  final String? bankAccountNumber;

  const CreateWeaverSubmitted({
    required this.firstName,
    required this.lastName,
    this.phone,
    this.email,
    this.bankAccountNumber,
  });

  @override
  List<Object?> get props => [
        firstName,
        lastName,
        phone,
        email,
        bankAccountNumber,
      ];
}

class LoadWeaverDetail extends WeaversEvent {
  final int weaverId;

  const LoadWeaverDetail(this.weaverId);

  @override
  List<Object?> get props => [weaverId];
}
