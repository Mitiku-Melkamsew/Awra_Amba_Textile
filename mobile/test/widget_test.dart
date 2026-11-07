import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:awra_amba_textile/main.dart';

void main() {
  testWidgets('Awra Amba App smoke test', (WidgetTester tester) async {
    // Basic test checking widget definition
    expect(const AwraAmbaApp(), isA<StatelessWidget>());
  });
}
