import 'control_point.dart';

class Projection {
  String name;
  List<ControlPoint> points;
  String? imagePath;
  DateTime createdAt;
  DateTime? updatedAt;

  Projection({
    required this.name,
    required this.points,
    this.imagePath,
    required this.createdAt,
    this.updatedAt,
  });

  factory Projection.create({required String name}) {
    return Projection(
      name: name,
      points: ControlPoint.createDefaultQuad(),
      createdAt: DateTime.now(),
    );
  }

  ControlPoint? get selectedPoint {
    for (final point in points) {
      if (point.isSelected) return point;
    }
    return null;
  }

  void deselectAllPoints() {
    for (var i = 0; i < points.length; i++) {
      points[i] = points[i].copyWith(isSelected: false);
    }
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'points': points.map((p) => p.toJson()).toList(),
      'imagePath': imagePath,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
    };
  }

  factory Projection.fromJson(Map<String, dynamic> json) {
    return Projection(
      name: json['name'],
      points: (json['points'] as List)
          .map((p) => ControlPoint.fromJson(p))
          .toList(),
      imagePath: json['imagePath'],
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: json['updatedAt'] != null 
          ? DateTime.parse(json['updatedAt']) 
          : null,
    );
  }
}