import 'package:flutter_bloc/flutter_bloc.dart';
import '../../domain/usecases/weavers_usecases.dart';
import '../../domain/repositories/weavers_repository.dart';
import 'weavers_event.dart';
import 'weavers_state.dart';

class WeaversBloc extends Bloc<WeaversEvent, WeaversState> {
  final GetWeaversUseCase getWeaversUseCase;
  final GetWeaverDetailUseCase getWeaverDetailUseCase;
  final CreateWeaverUseCase createWeaverUseCase;
  final GetUnsettledUseCase getUnsettledUseCase;
  final WeaversRepository weaversRepository;

  WeaversBloc({
    required this.getWeaversUseCase,
    required this.getWeaverDetailUseCase,
    required this.createWeaverUseCase,
    required this.getUnsettledUseCase,
    required this.weaversRepository,
  }) : super(const WeaversState()) {
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
      final list = await getWeaversUseCase(
        GetWeaversParams(search: event.search, sort: event.sort),
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
      await createWeaverUseCase(
        CreateWeaverParams(
          firstName: event.firstName,
          lastName: event.lastName,
          phone: event.phone,
          email: event.email,
          bankAccountNumber: event.bankAccountNumber,
        ),
      );
      final list = await getWeaversUseCase(const GetWeaversParams());
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
      final weaver = await getWeaverDetailUseCase(event.weaverId);
      final unsettled = await getUnsettledUseCase(event.weaverId);
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
