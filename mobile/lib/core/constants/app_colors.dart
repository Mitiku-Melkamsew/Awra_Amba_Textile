import 'package:flutter/material.dart';

class AppColors {
  // Admin Palette (Warm Earth & Dark Brown)
  static const Color adminPrimary = Color(0xFF2D231E);
  static const Color adminSecondary = Color(0xFF4A3B32);
  static const Color adminAccent = Color(0xFFD97706); // Warm Amber
  static const Color adminBackground = Color(0xFFF9F7F4);

  // Weaver Palette (Forest Green & Natural Flora)
  static const Color weaverPrimary = Color(0xFF1E3A2F);
  static const Color weaverSecondary = Color(0xFF2D5A46);
  static const Color weaverAccent = Color(0xFF10B981); // Emerald
  static const Color weaverBackground = Color(0xFFF4F7F5);

  // Neutral tones
  static const Color background = Color(0xFFF8F9FA);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color surfaceVariant = Color(0xFFF1F3F5);
  static const Color border = Color(0xFFE5E7EB);
  static const Color borderStrong = Color(0xFFD1D5DB);

  // Text
  static const Color textPrimary = Color(0xFF111827);
  static const Color textSecondary = Color(0xFF4B5563);
  static const Color textMuted = Color(0xFF9CA3AF);

  // Status & Financial Indicators
  static const Color success = Color(0xFF16A34A);
  static const Color successLight = Color(0xFFDCFCE7);
  static const Color danger = Color(0xFFDC2626);
  static const Color dangerLight = Color(0xFFFEE2E2);
  static const Color warning = Color(0xFFD97706);
  static const Color warningLight = Color(0xFFFEF3C7);
  static const Color info = Color(0xFF2563EB);
  static const Color infoLight = Color(0xFFDBEAFE);

  // Status Colors for Work Orders
  static Color statusColor(String status) {
    switch (status.toLowerCase()) {
      case 'assigned':
        return const Color(0xFF6B7280);
      case 'in_progress':
        return const Color(0xFF2563EB);
      case 'returned':
        return const Color(0xFFD97706);
      case 'reconciled':
      case 'settled':
      case 'completed':
        return const Color(0xFF16A34A);
      default:
        return const Color(0xFF4B5563);
    }
  }

  static Color statusBgColor(String status) {
    switch (status.toLowerCase()) {
      case 'assigned':
        return const Color(0xFFF3F4F6);
      case 'in_progress':
        return const Color(0xFFDBEAFE);
      case 'returned':
        return const Color(0xFFFEF3C7);
      case 'reconciled':
      case 'settled':
      case 'completed':
        return const Color(0xFFDCFCE7);
      default:
        return const Color(0xFFF3F4F6);
    }
  }
}
