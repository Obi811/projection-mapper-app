import 'dart:convert';
import 'control_point.dart';

class Projection {
  String id;
  String name;
  List<ControlPoint> points;
  String? imagePath;
  DateTime lastModified;

  Projection({
    required this.id,
    required this.name,
    required this.points,
    this.imagePath,
    DateTime? lastModified,
  }) : lastModified = lastModified ?? DateTime.now();

  Projection.initial()
      : id = DateTime.now().millisecondsSinceEpoch.toString(),
        name = 'New Project',
        points = [
          ControlPoint(id: '1', x: 0.2, y: 0.2, label: 'TL'),
          ControlPoint(id: '2', x: 0.8, y: 0.2, label: 'TR'),
          ControlPoint(id: '3', x: 0.8, y: 0.8, label: 'BR'),
          ControlPoint(id: '4', x: 0.2, y: 0.8, label: 'BL'),
        ],
        lastModified = DateTime.now();

  void addPoint(ControlPoint point) {
    points.add(point);
    lastModified = DateTime.now();
  }

  void removePoint(String pointId) {
    if (points.length > 3) {
      points.removeWhere((p) => p.id == pointId);
      lastModified = DateTime.now();
    }
  }

  void clearSelection() {
    for (var point in points) {
      point.isSelected = false;
    }
  }

  ControlPoint? getSelectedPoint() {
    for (var point in points) {
      if (point.isSelected) return point;
    }
    return null;
  }

  String toJsonString() {
    final json = {
      'id': id,
      'name': name,
      'points': points.map((p) => p.toJson()).toList(),
      'imagePath': imagePath,
      'lastModified': lastModified.toIso8601String(),
    };
    final encoder = JsonEncoder.withIndent('  ');
    return encoder.convert(json);
  }

  String toCsvString() {
    final buffer = StringBuffer();
    buffer.writeln('id,x,y,label');
    for (var point in points) {
      buffer.writeln('${point.id},${point.x},${point.y},${point.label}');
    }
    return buffer.toString();
  }
}