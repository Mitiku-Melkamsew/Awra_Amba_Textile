import 'package:flutter_bloc/flutter_bloc.dart';
import '../../domain/usecases/audit_usecases.dart';
import 'audit_event.dart';
import 'audit_state.dart';

class AuditBloc extends Bloc<AuditEvent, AuditState> {
  final GetAuditLogsUseCase getAuditLogsUseCase;

  AuditBloc({required this.getAuditLogsUseCase}) : super(const AuditState()) {
    on<LoadAuditLogs>(_onLoadAuditLogs);
  }

  Future<void> _onLoadAuditLogs(
    LoadAuditLogs event,
    Emitter<AuditState> emit,
  ) async {
    emit(state.copyWith(
      status: AuditStatus.loading,
      entityFilter: event.entityType,
      errorMessage: null,
    ));
    try {
      final list = await getAuditLogsUseCase(
        GetAuditLogsParams(entityType: event.entityType, action: event.action),
      );
      emit(state.copyWith(status: AuditStatus.success, logs: list));
    } catch (e) {
      emit(state.copyWith(
        status: AuditStatus.error,
        errorMessage: e.toString().replaceAll('Exception: ', ''),
      ));
    }
  }
}
