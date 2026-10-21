import 'package:equatable/equatable.dart';
import '../../models/weaver.dart';

enum WeaversStatus { initial, loading, success, error }

class WeaversState extends Equatable {
  final WeaversStatus status;
  final List<Weaver> weavers;
  final Weaver? selectedWeaver;
  final Map<String, dynamic>? unsettledData;
  final String? errorMessage;
  final String? searchQuery;

  const WeaversState({
    this.status = WeaversStatus.initial,
    this.weavers = const [],
    this.selectedWeaver,
    this.unsettledData,
    this.errorMessage,
    this.searchQuery,
  });

  WeaversState copyWith({
    WeaversStatus? status,
    List<Weaver>? weavers,
    Weaver? selectedWeaver,
    Map<String, dynamic>? unsettledData,
    String? errorMessage,
    String? searchQuery,
  }) {
    return WeaversState(
      status: status ?? this.status,
      weavers: weavers ?? this.weavers,
      selectedWeaver: selectedWeaver ?? this.selectedWeaver,
      unsettledData: unsettledData ?? this.unsettledData,
      errorMessage: errorMessage ?? this.errorMessage,
      searchQuery: searchQuery ?? this.searchQuery,
    );
  }

  @override
  List<Object?> get props => [
        status,
        weavers,
        selectedWeaver,
        unsettledData,
        errorMessage,
        searchQuery,
      ];
}
