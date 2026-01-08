import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import '../models/projection.dart';
import '../models/multi_surface.dart';
import '../models/control_point.dart';  // WICHTIG!

class ProjectionService extends ChangeNotifier {
  Projection? _projection;
  MultiSurfaceProject? _multiProject;

  Projection? get projection => _projection;
  MultiSurfaceProject? get multiProject => _multiProject;

  void newProject(String name) {
    _projection = Projection.create(name: name);
    _multiProject = null;
    notifyListeners();
  }

  void loadProject(Map<String, dynamic> json) {
    _projection = Projection.fromJson(json);
    _multiProject = null;
    notifyListeners();
  }

  Future<void> saveProject(Projection projection, String path) async {
    final file = File(path);
    await file.writeAsString(jsonEncode(projection.toJson()));
  }

  void updatePoints(List<ControlPoint> points) {
    if (_projection != null) {
      _projection!.points = points;
      _projection!.updatedAt = DateTime.now();
      notifyListeners();
    }
  }

  void setImage(String? imagePath) {
    if (_projection != null) {
      _projection!.imagePath = imagePath;
      _projection!.updatedAt = DateTime.now();
      notifyListeners();
    }
  }

  String exportToJson() {
    return jsonEncode(_projection!.toJson());
  }

  String exportToCsv() {
    final buffer = StringBuffer();
    buffer.writeln('id,name,x,y,label');
    for (final point in _projection!.points) {
      buffer.writeln('${point.id},${point.name},${point.x},${point.y},${point.label}');
    }
    return buffer.toString();
  }

  MultiSurfaceProject createMultiSurfaceProject(String name) {
    _multiProject = MultiSurfaceProject.create(name: name);
    notifyListeners();
    return _multiProject!;
  }

  void addSurface(String name) {
    if (_multiProject == null) return;
    
    final newSurface = ProjectionSurface.create(name: name);
    _multiProject!.surfaces.add(newSurface);
    _multiProject!.selectedSurfaceId = newSurface.id;
    notifyListeners();
  }

  void selectSurface(String surfaceId) {
    if (_multiProject == null) return;
    
    _multiProject!.selectedSurfaceId = surfaceId;
    notifyListeners();
  }

  void removeSurface(String surfaceId) {
    if (_multiProject == null) return;
    
    if (_multiProject!.surfaces.length <= 1) return;
    
    _multiProject!.surfaces.removeWhere((s) => s.id == surfaceId);
    
    if (_multiProject!.selectedSurfaceId == surfaceId) {
      _multiProject!.selectedSurfaceId = _multiProject!.surfaces.first.id;
    }
    
    notifyListeners();
  }

  String exportMultiProjectToJson() {
    if (_multiProject == null) return '';
    return jsonEncode(_multiProject!.toJson());
  }

  void importMultiProjectFromJson(String jsonString) {
    try {
      final jsonData = jsonDecode(jsonString);
      _multiProject = MultiSurfaceProject.fromJson(jsonData);
      notifyListeners();
    } catch (e) {
      print('Error importing multi-project: $e');
    }
  }
}