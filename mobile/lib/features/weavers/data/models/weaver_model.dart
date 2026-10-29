import '../../domain/entities/weaver_entity.dart';

class WeaverModel extends WeaverEntity {
  const WeaverModel({
    required super.weaverId,
    required super.firstName,
    required super.lastName,
    super.phone,
    super.email,
    super.bankAccountNumber,
  });

  factory WeaverModel.fromJson(Map<String, dynamic> json) {
    return WeaverModel(
      weaverId: json['weaverId'] is int
          ? json['weaverId']
          : int.tryParse(json['weaverId'].toString()) ?? 0,
      firstName: json['firstName'] ?? '',
      lastName: json['lastName'] ?? '',
      phone: json['phone']?.toString(),
      email: json['email']?.toString(),
      bankAccountNumber: json['bankAccountNumber']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'weaverId': weaverId,
      'firstName': firstName,
      'lastName': lastName,
      'phone': phone,
      'email': email,
      'bankAccountNumber': bankAccountNumber,
    };
  }

  factory WeaverModel.fromEntity(WeaverEntity entity) {
    return WeaverModel(
      weaverId: entity.weaverId,
      firstName: entity.firstName,
      lastName: entity.lastName,
      phone: entity.phone,
      email: entity.email,
      bankAccountNumber: entity.bankAccountNumber,
    );
  }
}
