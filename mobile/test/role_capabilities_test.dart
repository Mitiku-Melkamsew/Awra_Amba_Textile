import 'package:flutter_test/flutter_test.dart';
import 'package:awra_amba_textile/features/authentication/data/models/auth_user_model.dart';
import 'package:awra_amba_textile/features/authentication/domain/entities/auth_user_entity.dart';
import 'package:awra_amba_textile/features/work_orders/domain/entities/work_order_entity.dart';
import 'package:awra_amba_textile/features/merchants/data/models/available_fabric_model.dart';
import 'package:awra_amba_textile/features/merchants/data/models/fabric_price_model.dart';

void main() {
  group('AuthUserEntity and AuthUserModel Role Resolution', () {
    test('resolves admin role from roles array or single role string', () {
      final user = AuthUserModel.fromJson({
        'userId': 1,
        'username': 'admin_user',
        'fullName': 'Abebe Admin',
        'roles': ['admin', 'weaver'],
        'role': 'admin',
      });

      expect(user.isAdmin, isTrue);
      expect(user.isWeaver, isTrue);
      expect(user.isMerchant, isFalse);
      expect(user.displayName, equals('Abebe Admin'));
    });

    test('resolves merchant role properly', () {
      final user = AuthUserModel.fromJson({
        'userId': 42,
        'username': 'merchant_partner',
        'roles': ['merchant'],
        'role': 'merchant',
      });

      expect(user.isMerchant, isTrue);
      expect(user.isAdmin, isFalse);
      expect(user.isWeaver, isFalse);
      expect(user.displayName, equals('merchant_partner'));
    });

    test('resolves weaver role properly', () {
      const user = AuthUserEntity(
        userId: 10,
        username: 'chala_weaver',
        role: 'weaver',
        roles: ['weaver'],
      );

      expect(user.isWeaver, isTrue);
      expect(user.isAdmin, isFalse);
      expect(user.isMerchant, isFalse);
    });
  });

  group('WorkOrderEntity & WorkOrderDetail Lifecycle & Returns', () {
    test('verifies lifecycle flags: canMarkReturned, canCancel', () {
      const activeZig = WorkOrderEntity(
        zigId: 'ZIG-100',
        weaverId: 5,
        fabricVariantId: 2,
        status: 'in_progress',
        dateIssued: '2026-11-01',
      );

      expect(activeZig.canMarkReturned, isTrue);
      expect(activeZig.canCancel, isTrue);
      expect(activeZig.isInProgress, isTrue);

      const returnedZig = WorkOrderEntity(
        zigId: 'ZIG-101',
        weaverId: 5,
        fabricVariantId: 2,
        status: 'returned',
        dateIssued: '2026-11-01',
      );

      expect(returnedZig.canMarkReturned, isFalse);
      expect(returnedZig.canCancel, isTrue);
      expect(returnedZig.isReturned, isTrue);

      const reconciledZig = WorkOrderEntity(
        zigId: 'ZIG-102',
        weaverId: 5,
        fabricVariantId: 2,
        status: 'reconciled',
        dateIssued: '2026-11-01',
      );

      expect(reconciledZig.canMarkReturned, isFalse);
      expect(reconciledZig.canCancel, isFalse);
      expect(reconciledZig.isReconciled, isTrue);

      const cancelledZig = WorkOrderEntity(
        zigId: 'ZIG-103',
        weaverId: 5,
        fabricVariantId: 2,
        status: 'cancelled',
        dateIssued: '2026-11-01',
      );

      expect(cancelledZig.canMarkReturned, isFalse);
      expect(cancelledZig.canCancel, isFalse);
      expect(cancelledZig.isCancelled, isTrue);
    });

    test('calculates net yarn and defective returns correctly in detail entity', () {
      const detail = WorkOrderDetailEntity(
        zigId: 'ZIG-200',
        weaverId: 8,
        fabricVariantId: 3,
        status: 'in_progress',
        dateIssued: '2026-11-01',
        yarnGiven: [
          YarnGivenItemEntity(
            yarnGivenId: 1,
            quantity: 15.0,
            unitPrice: 200.0,
            dateGiven: '2026-11-01',
            yarnSku: 'YV-COTTON-WHITE',
            yarnMaterial: 'Cotton',
            yarnColor: 'White',
          ),
        ],
        yarnReturns: [
          YarnReturnItemEntity(
            yarnReturnId: 1,
            quantity: 3.0,
            dateReturned: '2026-11-02',
            yarnSku: 'YV-COTTON-WHITE',
            yarnMaterial: 'Cotton',
            yarnColor: 'White',
          ),
        ],
        fabricReturns: [
          FabricReturnItemEntity(
            returnId: 1,
            quantityReturned: 10,
            totalWeight: 2000.0,
            unitPrice: 500.0,
            calculatedDeduction: 20.0,
            netCreditValue: 4800.0,
            dateReturned: '2026-11-02',
          ),
        ],
        fabricReturnsToWeaver: [
          FabricReturnToWeaverItemEntity(
            fabricReturnToWeaverId: 1,
            quantity: 2,
            dateReturned: '2026-11-02',
            fabricName: 'Gabi',
            designName: 'Standard',
          ),
        ],
      );

      expect(detail.totalYarnQuantity, equals(15.0));
      expect(detail.totalYarnReturned, equals(3.0));
      expect(detail.netYarnQuantity, equals(12.0));
      expect(detail.totalFabricReturnedToWeaver, equals(2));
      expect(detail.totalFabricQuantity, equals(10));
      expect(detail.totalFabricCredit, equals(4800.0));
      expect(detail.totalYarnCost, equals(3000.0));
      expect(detail.netProfit, equals(1800.0));
    });
  });

  group('Merchant Available Fabric and Price Models', () {
    test('parses available fabric json correctly', () {
      final fabric = AvailableFabricModel.fromJson({
        'fabricVariantId': 10,
        'sku': 'FV-GABI-01',
        'fabricId': 1,
        'fabricName': 'Gabi / ጋቢ',
        'standardLengthCm': 200,
        'standardWidthCm': 150,
        'standardWeightG': 650,
        'design': 'Border Pattern',
        'warpColor': 'Natural',
        'weftColor': 'Bleached',
        'sellingPrice': 450,
      });

      expect(fabric.fabricVariantId, equals(10));
      expect(fabric.sku, equals('FV-GABI-01'));
      expect(fabric.sellingPrice, equals(450.0));
      expect(fabric.dimensionsText, equals('200 × 150 cm · 650g'));
    });

    test('parses official fabric price json correctly', () {
      final price = FabricPriceModel.fromJson({
        'fabricPriceId': 5,
        'fabricId': 2,
        'fabric': {
          'name': 'Netela / ነጠላ',
          'standardLengthCm': 180,
          'standardWidthCm': 90,
          'standardWeightG': 300,
        },
        'sellingPrice': 250,
        'effectiveFrom': '2026-11-01T00:00:00.000Z',
        'isActive': true,
      });

      expect(price.fabricPriceId, equals(5));
      expect(price.fabricName, equals('Netela / ነጠላ'));
      expect(price.sellingPrice, equals(250.0));
      expect(price.isActive, isTrue);
      expect(price.specsText, equals('180 × 90 cm · 300g'));
    });
  });
}
