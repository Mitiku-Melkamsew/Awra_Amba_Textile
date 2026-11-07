import 'package:intl/intl.dart';

class Formatters {
  static final NumberFormat _currencyFormat = NumberFormat('#,##0', 'en_US');
  static final NumberFormat _decimalFormat = NumberFormat('#,##0.00', 'en_US');
  static final DateFormat _dateFormat = DateFormat('dd/MM/yyyy');
  static final DateFormat _dateTimeFormat = DateFormat('dd/MM/yyyy HH:mm');

  static String currency(num? amount, {bool showDecimal = false}) {
    if (amount == null) return '0 ETB';
    final formatted = showDecimal
        ? _decimalFormat.format(amount)
        : _currencyFormat.format(amount.round());
    return '$formatted ETB';
  }

  static String date(dynamic dateVal) {
    if (dateVal == null) return '-';
    if (dateVal is DateTime) {
      return _dateFormat.format(dateVal);
    }
    if (dateVal is String) {
      try {
        final parsed = DateTime.parse(dateVal);
        return _dateFormat.format(parsed);
      } catch (_) {
        return dateVal;
      }
    }
    return dateVal.toString();
  }

  static String dateTime(dynamic dateVal) {
    if (dateVal == null) return '-';
    if (dateVal is DateTime) {
      return _dateTimeFormat.format(dateVal);
    }
    if (dateVal is String) {
      try {
        final parsed = DateTime.parse(dateVal);
        return _dateTimeFormat.format(parsed);
      } catch (_) {
        return dateVal;
      }
    }
    return dateVal.toString();
  }

  static String number(num? val) {
    if (val == null) return '0';
    return _currencyFormat.format(val);
  }
}
