import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/constants/app_colors.dart';
import '../blocs/users_bloc.dart';
import '../blocs/users_event.dart';
import '../blocs/users_state.dart';

class UsersPage extends StatefulWidget {
  const UsersPage({super.key});

  @override
  State<UsersPage> createState() => _UsersPageState();
}

class _UsersPageState extends State<UsersPage> {
  final _searchController = TextEditingController();
  String? _selectedRole;

  @override
  void initState() {
    super.initState();
    context.read<UsersBloc>().add(const LoadUsers());
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _onFilterChanged(String? role) {
    setState(() => _selectedRole = role);
    context.read<UsersBloc>().add(
          LoadUsers(
            role: _selectedRole,
            search: _searchController.text.trim().isNotEmpty
                ? _searchController.text.trim()
                : null,
          ),
        );
  }

  void _showResetPasswordDialog(int userId, String username) {
    final passwordCtrl = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Reset Password for @$username'),
        content: TextField(
          controller: passwordCtrl,
          decoration: const InputDecoration(
            labelText: 'New Password',
            hintText: 'Minimum 6 characters',
          ),
          obscureText: true,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              if (passwordCtrl.text.length < 6) return;
              context.read<UsersBloc>().add(
                    ResetPasswordSubmitted(
                      userId: userId,
                      newPassword: passwordCtrl.text,
                    ),
                  );
              Navigator.pop(ctx);
            },
            child: const Text('Reset Password'),
          ),
        ],
      ),
    );
  }

  void _showCreateUserDialog() {
    final firstNameCtrl = TextEditingController();
    final lastNameCtrl = TextEditingController();
    final usernameCtrl = TextEditingController();
    final passwordCtrl = TextEditingController();
    final phoneCtrl = TextEditingController();
    final bankCtrl = TextEditingController();
    final companyCtrl = TextEditingController();
    String role = 'weaver';

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (dCtx, setDialogState) => AlertDialog(
          title: const Text('Create New User / አዲስ ተጠቃሚ'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                DropdownButtonFormField<String>(
                  initialValue: role,
                  decoration: const InputDecoration(labelText: 'Assigned Role'),
                  items: const [
                    DropdownMenuItem(value: 'weaver', child: Text('Weaver (አሸጋይ)')),
                    DropdownMenuItem(value: 'merchant', child: Text('Merchant (ነጋዴ)')),
                    DropdownMenuItem(value: 'admin', child: Text('Administrator (አስተዳዳሪ)')),
                  ],
                  onChanged: (val) {
                    if (val != null) setDialogState(() => role = val);
                  },
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: firstNameCtrl,
                        decoration: const InputDecoration(labelText: 'First Name'),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: TextField(
                        controller: lastNameCtrl,
                        decoration: const InputDecoration(labelText: 'Last Name'),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: usernameCtrl,
                  decoration: const InputDecoration(labelText: 'Username'),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: passwordCtrl,
                  decoration: const InputDecoration(labelText: 'Password'),
                  obscureText: true,
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: phoneCtrl,
                  decoration: const InputDecoration(labelText: 'Phone (optional)'),
                  keyboardType: TextInputType.phone,
                ),
                if (role == 'weaver') ...[
                  const SizedBox(height: 12),
                  TextField(
                    controller: bankCtrl,
                    decoration: const InputDecoration(labelText: 'CBE Bank Account #'),
                  ),
                ],
                if (role == 'merchant') ...[
                  const SizedBox(height: 12),
                  TextField(
                    controller: companyCtrl,
                    decoration: const InputDecoration(labelText: 'Company / Business Name'),
                  ),
                ],
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dCtx),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () {
                if (usernameCtrl.text.trim().isEmpty || passwordCtrl.text.length < 6) return;
                context.read<UsersBloc>().add(
                      CreateUserSubmitted(
                        firstName: firstNameCtrl.text.trim(),
                        lastName: lastNameCtrl.text.trim(),
                        username: usernameCtrl.text.trim(),
                        password: passwordCtrl.text,
                        role: role,
                        phone: phoneCtrl.text.trim().isNotEmpty ? phoneCtrl.text.trim() : null,
                        bankAccountNumber: bankCtrl.text.trim().isNotEmpty ? bankCtrl.text.trim() : null,
                        companyName: companyCtrl.text.trim().isNotEmpty ? companyCtrl.text.trim() : null,
                      ),
                    );
                Navigator.pop(dCtx);
              },
              child: const Text('Create User'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: Builder(
          builder: (ctx) => IconButton(
            icon: const Icon(Icons.menu),
            tooltip: 'Open Menu',
            onPressed: () {
              ctx.findRootAncestorStateOfType<ScaffoldState>()?.openDrawer();
            },
          ),
        ),
        title: const Text('User Management / የተጠቃሚዎች መዝገብ'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => _onFilterChanged(_selectedRole),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: AppColors.adminPrimary,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.person_add),
        label: const Text('New User'),
        onPressed: _showCreateUserDialog,
      ),
      body: BlocConsumer<UsersBloc, UsersState>(
        listener: (context, state) {
          if (state.status == UsersStatus.actionSuccess && state.successMessage != null) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text(state.successMessage!), backgroundColor: AppColors.success),
            );
          }
          if (state.status == UsersStatus.error && state.errorMessage != null) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text(state.errorMessage!), backgroundColor: AppColors.danger),
            );
          }
        },
        builder: (context, state) {
          return Column(
            children: [
              // Search & Role Filter Chips
              Container(
                color: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: Column(
                  children: [
                    TextField(
                      controller: _searchController,
                      decoration: InputDecoration(
                        hintText: 'Search by name or username...',
                        prefixIcon: const Icon(Icons.search, size: 20),
                        suffixIcon: _searchController.text.isNotEmpty
                            ? IconButton(
                                icon: const Icon(Icons.clear, size: 18),
                                onPressed: () {
                                  _searchController.clear();
                                  _onFilterChanged(_selectedRole);
                                },
                              )
                            : null,
                        contentPadding: const EdgeInsets.symmetric(vertical: 0, horizontal: 12),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      onSubmitted: (_) => _onFilterChanged(_selectedRole),
                    ),
                    const SizedBox(height: 8),
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: [
                          ChoiceChip(
                            label: const Text('All Roles'),
                            selected: _selectedRole == null,
                            onSelected: (val) {
                              if (val) _onFilterChanged(null);
                            },
                          ),
                          const SizedBox(width: 8),
                          ChoiceChip(
                            label: const Text('Weavers (አሸጋዮች)'),
                            selected: _selectedRole == 'weaver',
                            selectedColor: AppColors.weaverPrimary,
                            labelStyle: TextStyle(
                              color: _selectedRole == 'weaver' ? Colors.white : Colors.black87,
                            ),
                            onSelected: (val) => _onFilterChanged(val ? 'weaver' : null),
                          ),
                          const SizedBox(width: 8),
                          ChoiceChip(
                            label: const Text('Merchants (ነጋዴዎች)'),
                            selected: _selectedRole == 'merchant',
                            selectedColor: AppColors.merchantPrimary,
                            labelStyle: TextStyle(
                              color: _selectedRole == 'merchant' ? Colors.white : Colors.black87,
                            ),
                            onSelected: (val) => _onFilterChanged(val ? 'merchant' : null),
                          ),
                          const SizedBox(width: 8),
                          ChoiceChip(
                            label: const Text('Admins (አስተዳዳሪዎች)'),
                            selected: _selectedRole == 'admin',
                            selectedColor: AppColors.adminPrimary,
                            labelStyle: TextStyle(
                              color: _selectedRole == 'admin' ? Colors.white : Colors.black87,
                            ),
                            onSelected: (val) => _onFilterChanged(val ? 'admin' : null),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              // Users List
              Expanded(
                child: state.status == UsersStatus.loading && state.users.isEmpty
                    ? const Center(child: CircularProgressIndicator())
                    : state.users.isEmpty
                        ? const Center(child: Text('No users matching criteria.'))
                        : RefreshIndicator(
                            onRefresh: () async => _onFilterChanged(_selectedRole),
                            child: ListView.separated(
                              padding: const EdgeInsets.all(16),
                              itemCount: state.users.length,
                              separatorBuilder: (_, _) => const SizedBox(height: 8),
                              itemBuilder: (context, index) {
                                final user = state.users[index];
                                final isWeaver = user.isWeaver;
                                final isMerchant = user.isMerchant;
                                final roleColor = isWeaver
                                    ? AppColors.weaverPrimary
                                    : (isMerchant
                                        ? AppColors.merchantPrimary
                                        : AppColors.adminPrimary);

                                return Card(
                                  child: Padding(
                                    padding: const EdgeInsets.all(12),
                                    child: Row(
                                      children: [
                                        CircleAvatar(
                                          backgroundColor: roleColor.withValues(alpha: 0.12),
                                          foregroundColor: roleColor,
                                          child: Text(
                                            user.fullName.isNotEmpty
                                                ? user.fullName.substring(0, 1).toUpperCase()
                                                : 'U',
                                            style: const TextStyle(fontWeight: FontWeight.w700),
                                          ),
                                        ),
                                        const SizedBox(width: 12),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Row(
                                                children: [
                                                  Text(
                                                    user.fullName,
                                                    style: const TextStyle(
                                                      fontWeight: FontWeight.w700,
                                                      fontSize: 14.5,
                                                    ),
                                                  ),
                                                  const SizedBox(width: 6),
                                                  Container(
                                                    padding: const EdgeInsets.symmetric(
                                                      horizontal: 6,
                                                      vertical: 2,
                                                    ),
                                                    decoration: BoxDecoration(
                                                      color: roleColor.withValues(alpha: 0.12),
                                                      borderRadius: BorderRadius.circular(4),
                                                    ),
                                                    child: Text(
                                                      user.role.toUpperCase(),
                                                      style: TextStyle(
                                                        color: roleColor,
                                                        fontSize: 10,
                                                        fontWeight: FontWeight.w700,
                                                      ),
                                                    ),
                                                  ),
                                                ],
                                              ),
                                              const SizedBox(height: 2),
                                              Text(
                                                '@${user.username} ${user.phone != null ? "· ${user.phone}" : ""}',
                                                style: const TextStyle(
                                                  fontSize: 12,
                                                  color: AppColors.textSecondary,
                                                ),
                                              ),
                                              if (user.companyName != null) ...[
                                                const SizedBox(height: 2),
                                                Text(
                                                  'Company: ${user.companyName}',
                                                  style: const TextStyle(
                                                    fontSize: 11.5,
                                                    color: AppColors.textMuted,
                                                  ),
                                                ),
                                              ],
                                              if (user.bankAccountNumber != null) ...[
                                                const SizedBox(height: 2),
                                                Text(
                                                  'Bank: CBE ${user.bankAccountNumber}',
                                                  style: const TextStyle(
                                                    fontSize: 11.5,
                                                    color: AppColors.textMuted,
                                                  ),
                                                ),
                                              ],
                                            ],
                                          ),
                                        ),
                                        Column(
                                          children: [
                                            Switch(
                                              value: user.isActive,
                                              activeThumbColor: AppColors.success,
                                              onChanged: (val) {
                                                context.read<UsersBloc>().add(
                                                      ToggleUserStatusSubmitted(
                                                        userId: user.userId,
                                                        newStatus: val,
                                                      ),
                                                    );
                                              },
                                            ),
                                            IconButton(
                                              icon: const Icon(Icons.key, size: 18),
                                              tooltip: 'Reset Password',
                                              onPressed: () => _showResetPasswordDialog(
                                                user.userId,
                                                user.username,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
                                );
                              },
                            ),
                          ),
              ),
            ],
          );
        },
      ),
    );
  }
}
