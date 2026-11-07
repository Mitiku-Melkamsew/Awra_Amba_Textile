import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/widgets/custom_widgets.dart';
import '../blocs/auth_bloc.dart';
import '../blocs/auth_event.dart';
import '../blocs/auth_state.dart';

class SignupPage extends StatefulWidget {
  const SignupPage({super.key});

  @override
  State<SignupPage> createState() => _SignupPageState();
}

class _SignupPageState extends State<SignupPage> {
  final _formKey = GlobalKey<FormState>();
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _companyNameController = TextEditingController();
  final _usernameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;
  String _selectedRole = 'weaver'; // 'weaver' or 'merchant'

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _companyNameController.dispose();
    _usernameController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _submit() {
    if (_formKey.currentState?.validate() ?? false) {
      context.read<AuthBloc>().add(
            SignupSubmitted(
              firstName: _firstNameController.text.trim(),
              lastName: _lastNameController.text.trim(),
              username: _usernameController.text.trim(),
              password: _passwordController.text,
              phone: _phoneController.text.trim().isNotEmpty
                  ? _phoneController.text.trim()
                  : null,
              role: _selectedRole,
              companyName: _selectedRole == 'merchant' &&
                      _companyNameController.text.trim().isNotEmpty
                  ? _companyNameController.text.trim()
                  : null,
            ),
          );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Create Account / መለያ ፍጠር'),
      ),
      body: BlocConsumer<AuthBloc, AuthState>(
        listener: (context, state) {
          if (state.isAuthenticated) {
            Navigator.pop(context);
          }
          if (state.status == AuthStatus.error && state.errorMessage != null) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.errorMessage!),
                backgroundColor: AppColors.danger,
              ),
            );
          }
        },
        builder: (context, state) {
          final isLoading = state.status == AuthStatus.loading;

          return Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 440),
                child: Card(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Form(
                      key: _formKey,
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          const Text(
                            'Account Registration / የምዝገባ ቅጽ',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          const SizedBox(height: 6),
                          const Text(
                            'Join as an artisan weaver or commercial wholesale merchant',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 12.5,
                              color: AppColors.textSecondary,
                            ),
                          ),
                          const SizedBox(height: 18),
                          // Role Selection Segment
                          Container(
                            decoration: BoxDecoration(
                              color: Colors.grey.shade100,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            padding: const EdgeInsets.all(4),
                            child: Row(
                              children: [
                                Expanded(
                                  child: ChoiceChip(
                                    label: const Center(
                                      child: Text('Weaver / አሸጋይ'),
                                    ),
                                    selected: _selectedRole == 'weaver',
                                    selectedColor: AppColors.weaverPrimary,
                                    labelStyle: TextStyle(
                                      color: _selectedRole == 'weaver'
                                          ? Colors.white
                                          : Colors.black87,
                                      fontWeight: FontWeight.w600,
                                    ),
                                    onSelected: (val) {
                                      if (val) setState(() => _selectedRole = 'weaver');
                                    },
                                  ),
                                ),
                                const SizedBox(width: 6),
                                Expanded(
                                  child: ChoiceChip(
                                    label: const Center(
                                      child: Text('Merchant / ነጋዴ'),
                                    ),
                                    selected: _selectedRole == 'merchant',
                                    selectedColor: AppColors.merchantPrimary,
                                    labelStyle: TextStyle(
                                      color: _selectedRole == 'merchant'
                                          ? Colors.white
                                          : Colors.black87,
                                      fontWeight: FontWeight.w600,
                                    ),
                                    onSelected: (val) {
                                      if (val) setState(() => _selectedRole = 'merchant');
                                    },
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 16),
                          if (state.status == AuthStatus.error &&
                              state.errorMessage != null)
                            ErrorBanner(message: state.errorMessage!),
                          Row(
                            children: [
                              Expanded(
                                child: TextFormField(
                                  controller: _firstNameController,
                                  decoration: const InputDecoration(
                                    labelText: 'First Name',
                                  ),
                                  validator: (val) =>
                                      val == null || val.trim().isEmpty
                                          ? 'Required'
                                          : null,
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: TextFormField(
                                  controller: _lastNameController,
                                  decoration: const InputDecoration(
                                    labelText: 'Last Name',
                                  ),
                                  validator: (val) =>
                                      val == null || val.trim().isEmpty
                                          ? 'Required'
                                          : null,
                                ),
                              ),
                            ],
                          ),
                          if (_selectedRole == 'merchant') ...[
                            const SizedBox(height: 14),
                            TextFormField(
                              controller: _companyNameController,
                              decoration: const InputDecoration(
                                labelText: 'Company / Business Name (የድርጅት ስም)',
                                prefixIcon: Icon(Icons.business_outlined),
                              ),
                              validator: (val) => _selectedRole == 'merchant' &&
                                      (val == null || val.trim().isEmpty)
                                  ? 'Company name is required for merchants'
                                  : null,
                            ),
                          ],
                          const SizedBox(height: 14),
                          TextFormField(
                            controller: _usernameController,
                            decoration: const InputDecoration(
                              labelText: 'Username',
                              prefixIcon: Icon(Icons.person_outline),
                            ),
                            validator: (val) => val == null || val.trim().isEmpty
                                ? 'Please enter a username'
                                : null,
                          ),
                          const SizedBox(height: 14),
                          TextFormField(
                            controller: _phoneController,
                            decoration: const InputDecoration(
                              labelText: 'Phone Number (optional)',
                              prefixIcon: Icon(Icons.phone_outlined),
                            ),
                            keyboardType: TextInputType.phone,
                          ),
                          const SizedBox(height: 14),
                          TextFormField(
                            controller: _passwordController,
                            obscureText: _obscurePassword,
                            decoration: InputDecoration(
                              labelText: 'Password',
                              prefixIcon: const Icon(Icons.lock_outline),
                              suffixIcon: IconButton(
                                icon: Icon(
                                  _obscurePassword
                                      ? Icons.visibility_outlined
                                      : Icons.visibility_off_outlined,
                                ),
                                onPressed: () {
                                  setState(() {
                                    _obscurePassword = !_obscurePassword;
                                  });
                                },
                              ),
                            ),
                            validator: (val) => val == null || val.length < 6
                                ? 'Password must be at least 6 characters'
                                : null,
                          ),
                          const SizedBox(height: 24),
                          ElevatedButton(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: _selectedRole == 'merchant'
                                  ? AppColors.merchantPrimary
                                  : AppColors.weaverPrimary,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 14),
                            ),
                            onPressed: isLoading ? null : _submit,
                            child: isLoading
                                ? const SizedBox(
                                    height: 20,
                                    width: 20,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      valueColor:
                                          AlwaysStoppedAnimation<Color>(Colors.white),
                                    ),
                                  )
                                : Text(
                                    _selectedRole == 'merchant'
                                        ? 'Register as Merchant'
                                        : 'Register as Weaver',
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w700,
                                      fontSize: 15,
                                    ),
                                  ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
