import 'package:flutter/material.dart';
import '../../../authentication/presentation/pages/login_page.dart';
import '../../../authentication/presentation/pages/server_settings_dialog.dart';
import '../../../authentication/presentation/pages/signup_page.dart';

class PublicHomePage extends StatelessWidget {
  const PublicHomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0F172A),
        elevation: 0,
        title: Row(
          children: [
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFFEA580C), Color(0xFFD97706)],
                ),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Center(
                child: Text('🧵', style: TextStyle(fontSize: 16)),
              ),
            ),
            const SizedBox(width: 10),
            const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'አውራ አምባ ቴክስታይል',
                  style: TextStyle(
                    color: Color(0xFF94A3B8),
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Text(
                  'Awra Amba Textile',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_outlined, color: Color(0xFF94A3B8)),
            tooltip: 'Server Settings',
            onPressed: () => showDialog(
              context: context,
              builder: (_) => const ServerSettingsDialog(),
            ),
          ),
          TextButton(
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const LoginPage()),
            ),
            child: const Text(
              'Sign In',
              style: TextStyle(
                color: Color(0xFF38BDF8),
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Ethiopian Community Badge ──
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Colors.white.withValues(alpha: 0.15)),
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text('🇪🇹 ', style: TextStyle(fontSize: 13)),
                  Text(
                    'አውራ አምባ ማህበር · Cooperative Enterprise',
                    style: TextStyle(
                      color: Color(0xFFF8FAFC),
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 18),

            // ── Hero Title ──
            RichText(
              text: const TextSpan(
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.w800,
                  color: Colors.white,
                  height: 1.25,
                ),
                children: [
                  TextSpan(text: 'Artisan-Crafted\n'),
                  TextSpan(
                    text: 'Cooperative Textiles',
                    style: TextStyle(
                      color: Color(0xFF38BDF8),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 12),

            const Text(
              'Equitable community textile management, transparent artisan work orders, and commercial wholesale catalog for Awra Amba Community.',
              style: TextStyle(
                fontSize: 14,
                color: Color(0xFF94A3B8),
                height: 1.5,
              ),
            ),

            const SizedBox(height: 24),

            // ── Primary Actions ──
            Row(
              children: [
                Expanded(
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF0284C7),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                    onPressed: () => Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const LoginPage()),
                    ),
                    child: const Text(
                      'Sign In / ይግቡ',
                      style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: OutlinedButton(
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.white,
                      side: BorderSide(color: Colors.white.withValues(alpha: 0.25)),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                    onPressed: () => Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const SignupPage()),
                    ),
                    child: const Text(
                      'Join / ይመዝገቡ',
                      style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
                    ),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 36),

            // ── Role Portals Section ──
            const Text(
              'Platform Roles & Portals',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w800,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 6),
            const Text(
              'Select your workspace or sign in with your role-assigned credentials:',
              style: TextStyle(fontSize: 13, color: Color(0xFF94A3B8)),
            ),

            const SizedBox(height: 16),

            // ── Portal Card 1: Admin ──
            _PortalCard(
              icon: '🛡️',
              badge: 'Cooperative Management',
              amharicBadge: 'የማህበር አስተዳዳሪ',
              title: 'Admin Operations Portal',
              desc:
                  'Complete production oversight, yarn inventory, work order (Zig) assignments, direct transactions, and automated batch HISAB settlement.',
              accentColor: const Color(0xFFEA580C),
              onTap: () => Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => const LoginPage(
                    initialUsername: 'admin',
                    initialPassword: 'password123',
                  ),
                ),
              ),
            ),

            const SizedBox(height: 14),

            // ── Portal Card 2: Weaver ──
            _PortalCard(
              icon: '🪢',
              badge: 'Artisan Workspace',
              amharicBadge: 'የሸማኔዎች መድረክ',
              title: 'Weaver Portal',
              desc:
                  'Personal work orders, issued yarn records, fabric delivery weight measurements, and verified payroll settlement statements.',
              accentColor: const Color(0xFF10B981),
              onTap: () => Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => const LoginPage(
                    initialUsername: 'weaver_almaz',
                    initialPassword: 'password123',
                  ),
                ),
              ),
            ),

            const SizedBox(height: 14),

            // ── Portal Card 3: Merchant ──
            _PortalCard(
              icon: '🏬',
              badge: 'Commercial Catalog',
              amharicBadge: 'የነጋዴ ካታሎግ',
              title: 'Merchant Portal',
              desc:
                  'Browse authentic handcrafted fabrics, review physical specifications (dimensions and weight), and check current official cooperative selling prices.',
              accentColor: const Color(0xFF0284C7),
              onTap: () => Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => const LoginPage(
                    initialUsername: 'merchant_dani',
                    initialPassword: 'password123',
                  ),
                ),
              ),
            ),

            const SizedBox(height: 36),

            // ── Community Highlights ──
            const Text(
              'Cooperative Principles',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w800,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 14),

            _HighlightRow(
              icon: '🧵',
              title: 'Work Order (Zig) Lifecycle',
              desc:
                  'From yarn disbursement to multi-variant fabric returns with floored quality deductions.',
            ),
            const SizedBox(height: 12),
            _HighlightRow(
              icon: '📦',
              title: 'Multi-Role Transparency',
              desc:
                  'Role-specific capabilities strictly separating internal cost data from public commercial prices.',
            ),
            const SizedBox(height: 12),
            _HighlightRow(
              icon: '💳',
              title: 'Automated Batch HISAB',
              desc:
                  'Atomic settlement runs, floored deduction formulas, and official receipts with Amharic words.',
            ),
            const SizedBox(height: 12),
            _HighlightRow(
              icon: '⚖️',
              title: 'Community Owned',
              desc:
                  'Equitable cooperative model empowering both master artisans and trusted commercial buyers.',
            ),

            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }
}

class _PortalCard extends StatelessWidget {
  final String icon;
  final String badge;
  final String amharicBadge;
  final String title;
  final String desc;
  final Color accentColor;
  final VoidCallback onTap;

  const _PortalCard({
    required this.icon,
    required this.badge,
    required this.amharicBadge,
    required this.title,
    required this.desc,
    required this.accentColor,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: const Color(0xFF1E293B),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: accentColor.withValues(alpha: 0.35)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text(icon, style: const TextStyle(fontSize: 24)),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        badge,
                        style: TextStyle(
                          color: accentColor,
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 0.3,
                        ),
                      ),
                      Text(
                        amharicBadge,
                        style: const TextStyle(
                          color: Color(0xFF94A3B8),
                          fontSize: 10.5,
                        ),
                      ),
                    ],
                  ),
                ),
                Icon(Icons.arrow_forward_ios, size: 14, color: accentColor),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              title,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              desc,
              style: const TextStyle(
                color: Color(0xFF94A3B8),
                fontSize: 12.5,
                height: 1.4,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _HighlightRow extends StatelessWidget {
  final String icon;
  final String title;
  final String desc;

  const _HighlightRow({
    required this.icon,
    required this.title,
    required this.desc,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(icon, style: const TextStyle(fontSize: 20)),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 13.5,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  desc,
                  style: const TextStyle(
                    color: Color(0xFF94A3B8),
                    fontSize: 12,
                    height: 1.35,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
