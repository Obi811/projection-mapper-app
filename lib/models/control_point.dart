import 'dart:ui';

class ControlPoint {
  final String id;
  String name;
  double x;
  double y;
  bool isSelected;
  double radius;
  String label;

  ControlPoint({
    required this.id,
    required this.name,
    required this.x,
    required this.y,
    this.isSelected = false,
    this.radius = 10.0,
    this.label = '',
  });

  ControlPoint copyWith({
    String? id,
    String? name,
    double? x,
    double? y,
    bool? isSelected,
    double? radius,
    String? label,
  }) {
    return ControlPoint(
      id: id ?? this.id,
      name: name ?? this.name,
      x: x ?? this.x,
      y: y ?? this.y,
      isSelected: isSelected ?? this.isSelected,
      radius: radius ?? this.radius,
      label: label ?? this.label,
    );
  }

  static List<ControlPoint> createDefaultQuad() {
    return [
      ControlPoint(id: 'tl', name: 'Top Left', x: 0.2, y: 0.2, label: 'TL'),
      ControlPoint(id: 'tr', name: 'Top Right', x: 0.8, y: 0.2, label: 'TR'),
      ControlPoint(id: 'br', name: 'Bottom Right', x: 0.8, y: 0.8, label: 'BR'),
      ControlPoint(id: 'bl', name: 'Bottom Left', x: 0.2, y: 0.8, label: 'BL'),
    ];
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'x': x,
      'y': y,
      'isSelected': isSelected,
      'radius': radius,
      'label': label,
    };
  }

  factory ControlPoint.fromJson(Map<String, dynamic> json) {
    return ControlPoint(
      id: json['id'],
      name: json['name'],
      x: json['x'].toDouble(),
      y: json['y'].toDouble(),
      isSelected: json['isSelected'] ?? false,
      radius: json['radius']?.toDouble() ?? 10.0,
      label: json['label'] ?? '',
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is ControlPoint &&
          runtimeType == other.runtimeType &&
          id == other.id &&
          name == other.name &&
          x == other.x &&
          y == other.y;

  @override
  int get hashCode => Object.hash(id, name, x, y);
}