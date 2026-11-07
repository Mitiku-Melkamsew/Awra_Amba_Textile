import 'package:equatable/equatable.dart';
import '../../domain/entities/weaver_entity.dart';

enum WeaversStatus { initial, loading, success, error }

class WeaversState extends Equatable {
  final WeaversStatus status;
  final List<WeaverEntity> weavers;
  final WeaverEntity? selectedWeaver;
  final Map<String, dynamic>? unsettledData;
  final String? searchQuery;
  final String? errorMessage;

  const WeaversState({
    this.status = WeaversStatus.initial,
    this.weavers = const [],
    this.selectedWeaver,
    this.unsettledData,
    this.searchQuery,
    this.errorMessage,
  });

  WeaversState copyWith({
    WeaversStatus? status,
    List<WeaverEntity>? weavers,
    WeaverEntity? selectedWeaver,
    Map<String, dynamic>? unsettledData,
    String? searchQuery,
    String? errorMessage,
  }) {
    return WeaversState(
      status: status ?? this.status,
      weavers: weavers ?? this.weavers,
      selectedWeaver: selectedWeaver ?? this.selectedWeaver,
      unsettledData: unsettledData ?? this.unsettledData,
      searchQuery: searchQuery ?? this.searchQuery,
      errorMessage: errorMessage ?? this.errorMessage,
    );
  }

  @override
  List<Object?> get props => [
        status,
        weavers,
        selectedWeaver,
        unsettledData,
        searchQuery,
        errorMessage,
      ];
}
