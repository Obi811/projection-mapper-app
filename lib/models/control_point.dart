class ControlPoint {
  String id;
  double x;
  double y;
  double radius = 20.0;
  bool isSelected = false;
  String label;

  ControlPoint({
    required this.id,
    required this.x,
    required this.y,
    this.label = '',
  });

  ControlPoint copyWith({
    double? x,
    double? y,
    bool? isSelected,
    String? label,
  }) {
    return ControlPoint(
      id: id,
      x: x ?? this.x,
      y: y ?? this.y,
      label: label ?? this.label,
    )..isSelected = isSelected ?? this.isSelected;
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'x': x,
      'y': y,
      'label': label,
    };
  }

  factory ControlPoint.fromJson(Map<String, dynamic> json) {
    return ControlPoint(
      id: json['id'],
      x: (json['x'] as num).toDouble(),
      y: (json['y'] as num).toDouble(),
      label: json['label'] ?? '',
    );
  }
}