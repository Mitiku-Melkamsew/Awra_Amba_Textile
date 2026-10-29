import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/widgets/custom_widgets.dart';
import 'package:awra_amba_textile/features/authentication/presentation/blocs/auth_bloc.dart';
import 'package:awra_amba_textile/features/authentication/presentation/blocs/auth_event.dart';
import '../blocs/weavers_bloc.dart';
import '../blocs/weavers_event.dart';
import '../blocs/weavers_state.dart';
import 'create_weaver_dialog.dart';
import 'weaver_detail_page.dart';

class WeaversListPage extends StatefulWidget {
  const WeaversListPage({super.key});

  @override
  State<WeaversListPage> createState() => _WeaversListPageState();
}

class _WeaversListPageState extends State<WeaversListPage> {
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    context.read<WeaversBloc>().add(const LoadWeavers());
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Weavers Directory (አሸጋዮች)'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout_outlined),
            tooltip: 'Logout',
            onPressed: () {
              context.read<AuthBloc>().add(LogoutRequested());
            },
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: AppColors.adminPrimary,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.person_add_outlined),
        label: const Text('Add Weaver'),
        onPressed: () {
          showDialog(
            context: context,
            builder: (_) => const CreateWeaverDialog(),
          );
        },
      ),
      body: Column(
        children: [
          Container(
            color: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search weavers by name or ID...',
                prefixIcon: const Icon(Icons.search, size: 20),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear, size: 18),
                        onPressed: () {
                          _searchController.clear();
                          context.read<WeaversBloc>().add(const LoadWeavers());
                        },
                      )
                    : null,
                contentPadding: const EdgeInsets.symmetric(vertical: 8),
              ),
              onChanged: (query) {
                context.read<WeaversBloc>().add(LoadWeavers(search: query));
              },
            ),
          ),
          Expanded(
            child: BlocBuilder<WeaversBloc, WeaversState>(
              builder: (context, state) {
                if (state.status == WeaversStatus.loading &&
                    state.weavers.isEmpty) {
                  return const Center(child: CircularProgressIndicator());
                }

                if (state.status == WeaversStatus.error &&
                    state.weavers.isEmpty) {
                  return Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.error_outline,
                              size: 40, color: AppColors.danger),
                          const SizedBox(height: 12),
                          Text(state.errorMessage ?? 'Failed to load weavers'),
                          const SizedBox(height: 12),
                          ElevatedButton(
                            onPressed: () => context
                                .read<WeaversBloc>()
                                .add(const LoadWeavers()),
                            child: const Text('Retry'),
                          ),
                        ],
                      ),
                    ),
                  );
                }

                if (state.weavers.isEmpty) {
                  return EmptyState(
                    title: 'No Weavers Found',
                    message: state.searchQuery != null &&
                            state.searchQuery!.isNotEmpty
                        ? 'No weavers matching "${state.searchQuery}"'
                        : 'No weavers registered yet. Tap "Add Weaver" below to start.',
                  );
                }

                return RefreshIndicator(
                  onRefresh: () async {
                    context.read<WeaversBloc>().add(LoadWeavers(
                          search: _searchController.text,
                        ));
                  },
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: state.weavers.length,
                    separatorBuilder: (_, _) => const SizedBox(height: 10),
                    itemBuilder: (context, index) {
                      final weaver = state.weavers[index];
                      return Card(
                        child: InkWell(
                          borderRadius: BorderRadius.circular(12),
                          onTap: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => WeaverDetailPage(
                                  weaverId: weaver.weaverId,
                                  weaverName: weaver.fullName,
                                ),
                              ),
                            );
                          },
                          child: Padding(
                            padding: const EdgeInsets.all(14),
                            child: Row(
                              children: [
                                CircleAvatar(
                                  backgroundColor:
                                      AppColors.adminPrimary.withValues(alpha: 0.08),
                                  foregroundColor: AppColors.adminPrimary,
                                  child: Text(
                                    weaver.weaverId.toString(),
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w700,
                                      fontSize: 13,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 14),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        weaver.fullName,
                                        style: const TextStyle(
                                          fontWeight: FontWeight.w600,
                                          fontSize: 15,
                                          color: AppColors.textPrimary,
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Row(
                                        children: [
                                          if (weaver.phone != null) ...[
                                            const Icon(Icons.phone_outlined,
                                                size: 13,
                                                color: AppColors.textMuted),
                                            const SizedBox(width: 4),
                                            Text(
                                              weaver.phone!,
                                              style: const TextStyle(
                                                fontSize: 12,
                                                color: AppColors.textSecondary,
                                              ),
                                            ),
                                            const SizedBox(width: 12),
                                          ],
                                          if (weaver.bankAccountNumber !=
                                              null) ...[
                                            const Icon(
                                                Icons.account_balance_outlined,
                                                size: 13,
                                                color: AppColors.textMuted),
                                            const SizedBox(width: 4),
                                            Expanded(
                                              child: Text(
                                                weaver.bankAccountNumber!,
                                                style: const TextStyle(
                                                  fontSize: 12,
                                                  color:
                                                      AppColors.textSecondary,
                                                ),
                                                overflow: TextOverflow.ellipsis,
                                              ),
                                            ),
                                          ],
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                                const Icon(Icons.chevron_right,
                                    color: AppColors.textMuted),
                              ],
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
