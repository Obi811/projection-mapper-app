import 'dart:convert';
import 'dart:io';
import '../models/control_point.dart';
import '../models/projection.dart';

class ProjectionService {
  Future<void> saveProject(Projection projection, String filePath) async {
    final json = {
      'id': projection.id,
      'name': projection.name,
      'points': projection.points.map((p) => p.toJson()).toList(),
      'imagePath': projection.imagePath,
      'lastModified': projection.lastModified.toIso8601String(),
    };
    final file = File(filePath);
    await file.writeAsString(jsonEncode(json));
  }

  Future<Projection> loadProject(String filePath) async {
    final file = File(filePath);
    final content = await file.readAsString();
    final json = jsonDecode(content) as Map<String, dynamic>;
    
    final points = (json['points'] as List).map((p) {
      return ControlPoint.fromJson(p);
    }).toList();

    return Projection(
      id: json['id'] as String,
      name: json['name'] as String,
      points: points,
      imagePath: json['imagePath'] as String?,
      lastModified: DateTime.parse(json['lastModified'] as String),
    );
  }
}