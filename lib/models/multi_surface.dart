import 'control_point.dart';

class ProjectionSurface {
  final String id;
  String name;
  List<ControlPoint> points;
  String? imagePath;
  bool isVisible;
  double opacity;
  int zIndex;

  ProjectionSurface({
    required this.id,
    required this.name,
    required this.points,
    this.imagePath,
    this.isVisible = true,
    this.opacity = 1.0,
    this.zIndex = 0,
  });

  factory ProjectionSurface.create({required String name, String? id, List<ControlPoint>? points}) {
    return ProjectionSurface(
      id: id ?? 'surface_${DateTime.now().millisecondsSinceEpoch}',
      name: name,
      points: points ?? ControlPoint.createDefaultQuad(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'points': points.map((p) => p.toJson()).toList(),
      'imagePath': imagePath,
      'isVisible': isVisible,
      'opacity': opacity,
      'zIndex': zIndex,
    };
  }

  factory ProjectionSurface.fromJson(Map<String, dynamic> json) {
    return ProjectionSurface(
      id: json['id'],
      name: json['name'],
      points: (json['points'] as List).map((p) => ControlPoint.fromJson(p)).toList(),
      imagePath: json['imagePath'],
      isVisible: json['isVisible'] ?? true,
      opacity: json['opacity']?.toDouble() ?? 1.0,
      zIndex: json['zIndex'] ?? 0,
    );
  }
}

class MultiSurfaceProject {
  String name;
  List<ProjectionSurface> surfaces;
  String? selectedSurfaceId;
  DateTime createdAt;

  MultiSurfaceProject({
    required this.name,
    required this.surfaces,
    this.selectedSurfaceId,
    required this.createdAt,
  });

  factory MultiSurfaceProject.create({required String name}) {
    final firstSurface = ProjectionSurface.create(name: 'Surface 1');
    return MultiSurfaceProject(
      name: name,
      surfaces: [firstSurface],
      selectedSurfaceId: firstSurface.id,
      createdAt: DateTime.now(),
    );
  }

  // KORRIGIERTE METHODE:
  ProjectionSurface? get selectedSurface {
    if (selectedSurfaceId == null || surfaces.isEmpty) return null;
    
    try {
      return surfaces.firstWhere((s) => s.id == selectedSurfaceId);
    } catch (e) {
      return surfaces.first;
    }
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'surfaces': surfaces.map((s) => s.toJson()).toList(),
      'selectedSurfaceId': selectedSurfaceId,
      'createdAt': createdAt.toIso8601String(),
    };
  }

  factory MultiSurfaceProject.fromJson(Map<String, dynamic> json) {
    return MultiSurfaceProject(
      name: json['name'],
      surfaces: (json['surfaces'] as List).map((s) => ProjectionSurface.fromJson(s)).toList(),
      selectedSurfaceId: json['selectedSurfaceId'],
      createdAt: DateTime.parse(json['createdAt']),
    );
  }
}