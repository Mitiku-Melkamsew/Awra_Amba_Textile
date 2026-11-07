List<dynamic> extractJsonList(dynamic data, {required String key}) {
  if (data is List) return data;

  if (data is Map && data[key] is List) {
    return data[key] as List<dynamic>;
  }

  throw FormatException(
    'Expected a JSON array or an object containing a "$key" array.',
  );
}
