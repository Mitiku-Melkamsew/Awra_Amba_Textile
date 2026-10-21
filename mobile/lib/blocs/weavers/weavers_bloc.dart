import 'package:flutter_bloc/flutter_bloc.dart';
import '../../repositories/weavers_repository.dart';
import 'weavers_event.dart';
import 'weavers_state.dart';

class WeaversBloc extends Bloc<WeaversEvent, WeaversState> {
  final WeaversRepository weaversRepository;

  WeaversBloc({required this.weaversRepository}) : super(const WeaversState()) {
    on<LoadWeavers>(_onLoadWeavers);
    on<CreateWeaverSubmitted>(_onCreateWeaverSubmitted);
    on<LoadWeaverDetail>(_onLoadWeaverDetail);
  }

  Future<void> _onLoadWeavers(
    LoadWeavers event,
    Emitter<WeaversState> emit,
  ) async {
    emit(state.copyWith(
      status: WeaversStatus.loading,
      searchQuery: event.search,
      errorMessage: null,
    ));
    try {
      final list = await weaversRepository.getWeavers(
        search: event.search,
        sort: event.sort,
      );
      emit(state.copyWith(status: WeaversStatus.success, weavers: list));
    } catch (e) {
      emit(
        state.copyWith(
          status: WeaversStatus.error,
          errorMessage: e.toString().replaceAll('Exception: ', ''),
        ),
      );
    }
  }

  Future<void> _onCreateWeaverSubmitted(
    CreateWeaverSubmitted event,
    Emitter<WeaversState> emit,
  ) async {
    emit(state.copyWith(status: WeaversStatus.loading, errorMessage: null));
    try {
      await weaversRepository.createWeaver(
        firstName: event.firstName,
        lastName: event.lastName,
        phone: event.phone,
        email: event.email,
        bankAccountNumber: event.bankAccountNumber,
      );
      // Reload weavers list after creating
      final list = await weaversRepository.getWeavers();
      emit(state.copyWith(status: WeaversStatus.success, weavers: list));
    } catch (e) {
      emit(
        state.copyWith(
          status: WeaversStatus.error,
          errorMessage: e.toString().replaceAll('Exception: ', ''),
        ),
      );
    }
  }

  Future<void> _onLoadWeaverDetail(
    LoadWeaverDetail event,
    Emitter<WeaversState> emit,
  ) async {
    emit(state.copyWith(status: WeaversStatus.loading, errorMessage: null));
    try {
      final weaver = await weaversRepository.getWeaver(event.weaverId);
      final unsettled = await weaversRepository.getUnsettled(event.weaverId);
      emit(
        state.copyWith(
          status: WeaversStatus.success,
          selectedWeaver: weaver,
          unsettledData: unsettled,
        ),
      );
    } catch (e) {
      emit(
        state.copyWith(
          status: WeaversStatus.error,
          errorMessage: e.toString().replaceAll('Exception: ', ''),
        ),
      );
    }
  }
}
