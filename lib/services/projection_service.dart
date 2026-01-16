import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/foundation.dart';
import 'package:image/image.dart' as img;
import '../models/projection.dart';
import '../models/multi_surface.dart';
import '../models/control_point.dart';

class ProjectionService extends ChangeNotifier {
  Projection? _projection;
  MultiSurfaceProject? _multiProject;
  
  // Bild-Cache für Performance
  final Map<String, Uint8List> _imageCache = {};
  final Map<String, img.Image?> _decodedImageCache = {};

  Projection? get projection => _projection;
  MultiSurfaceProject? get multiProject => _multiProject;
  
  // Performance: Nur notifizieren wenn nötig
  bool _isNotifying = false;
  
  @override
  void notifyListeners() {
    if (!_isNotifying) {
      _isNotifying = true;
      super.notifyListeners();
      _isNotifying = false;
    }
  }

  // === SINGLE SURFACE OPERATIONS ===
  
  void newProject(String name) {
    _projection = Projection.create(name: name);
    _multiProject = null;
    _clearUnusedImages();
    notifyListeners();
  }

  Future<void> loadProject(Map<String, dynamic> json) async {
    _projection = Projection.fromJson(json);
    _multiProject = null;
    await _preloadImage(_projection!.imagePath);
    notifyListeners();
  }

  Future<void> saveProject(Projection projection, String path) async {
    final file = File(path);
    await file.writeAsString(jsonEncode(projection.toJson()));
  }

  void updatePoints(List<ControlPoint> points) {
    if (_projection != null) {
      _projection!.points = List<ControlPoint>.from(points);
      _projection!.updatedAt = DateTime.now();
      notifyListeners();
    }
  }

  Future<void> setImage(String? imagePath) async {
    if (_projection != null) {
      // Prüfe ob Datei existiert, bevor wir den Pfad setzen
      if (imagePath != null) {
        final file = File(imagePath);
        if (!await file.exists()) {
          print('Image file does not exist: $imagePath');
          return; // Frühzeitig zurück, wenn Datei nicht existiert
        }
      }
      
      _projection!.imagePath = imagePath;
      _projection!.updatedAt = DateTime.now();
      await _preloadImage(imagePath);
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

  // === MULTI SURFACE OPERATIONS ===
  
  MultiSurfaceProject createMultiSurfaceProject(String name) {
    _multiProject = MultiSurfaceProject.create(name: name);
    _projection = null;
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
    
    final surface = _multiProject!.surfaces.firstWhere(
      (s) => s.id == surfaceId,
      orElse: () => throw Exception('Surface not found'),
    );
    
    // Bild aus Cache entfernen wenn nicht mehr verwendet
    _removeUnusedImage(surface.imagePath);
    
    _multiProject!.surfaces.removeWhere((s) => s.id == surfaceId);
    
    if (_multiProject!.selectedSurfaceId == surfaceId) {
      _multiProject!.selectedSurfaceId = _multiProject!.surfaces.first.id;
    }
    
    notifyListeners();
  }

  void renameSurface(String surfaceId, String newName) {
    if (_multiProject == null) return;
    
    final surface = _multiProject!.surfaces.firstWhere(
      (s) => s.id == surfaceId,
      orElse: () => throw Exception('Surface not found'),
    );
    
    surface.name = newName;
    notifyListeners();
  }

  void duplicateSurface(String surfaceId) {
    if (_multiProject == null) return;
    
    final originalSurface = _multiProject!.surfaces.firstWhere(
      (s) => s.id == surfaceId,
      orElse: () => throw Exception('Surface not found'),
    );
    
    final newSurface = ProjectionSurface(
      id: '${originalSurface.id}_copy_${DateTime.now().millisecondsSinceEpoch}',
      name: '${originalSurface.name} (Copy)',
      points: originalSurface.points.map((p) => p.copyWith()).toList(),
      imagePath: originalSurface.imagePath,
      isVisible: originalSurface.isVisible,
      opacity: originalSurface.opacity,
      zIndex: originalSurface.zIndex + 1,
    );
    
    _multiProject!.surfaces.add(newSurface);
    _multiProject!.selectedSurfaceId = newSurface.id;
    notifyListeners();
  }

  Future<void> setImageForSurface(String surfaceId, String? imagePath) async {
    if (_multiProject == null) return;
    
    // Prüfe ob Datei existiert
    if (imagePath != null) {
      final file = File(imagePath);
      if (!await file.exists()) {
        print('Image file does not exist: $imagePath');
        return;
      }
    }
    
    final surface = _multiProject!.surfaces.firstWhere(
      (s) => s.id == surfaceId,
      orElse: () => throw Exception('Surface not found'),
    );
    
    // Altes Bild aus Cache entfernen
    _removeUnusedImage(surface.imagePath);
    
    surface.imagePath = imagePath;
    await _preloadImage(imagePath);
    notifyListeners();
  }

  void updateSurfaceVisibility(String surfaceId, bool isVisible) {
    if (_multiProject == null) return;
    
    final surface = _multiProject!.surfaces.firstWhere(
      (s) => s.id == surfaceId,
      orElse: () => throw Exception('Surface not found'),
    );
    
    surface.isVisible = isVisible;
    notifyListeners();
  }

  void updateSurfaceOpacity(String surfaceId, double opacity) {
    if (_multiProject == null) return;
    
    final surface = _multiProject!.surfaces.firstWhere(
      (s) => s.id == surfaceId,
      orElse: () => throw Exception('Surface not found'),
    );
    
    surface.opacity = opacity.clamp(0.0, 1.0);
    notifyListeners();
  }

  void updateSurfaceZIndex(String surfaceId, int zIndex) {
    if (_multiProject == null) return;
    
    final surface = _multiProject!.surfaces.firstWhere(
      (s) => s.id == surfaceId,
      orElse: () => throw Exception('Surface not found'),
    );
    
    surface.zIndex = zIndex;
    
    // Sortieren nach Z-Index
    _multiProject!.surfaces.sort((a, b) => a.zIndex.compareTo(b.zIndex));
    notifyListeners();
  }

  String exportMultiProjectToJson() {
    if (_multiProject == null) return '';
    return jsonEncode(_multiProject!.toJson());
  }

  Future<void> importMultiProjectFromJson(String jsonString) async {
    try {
      final jsonData = jsonDecode(jsonString);
      _multiProject = MultiSurfaceProject.fromJson(jsonData);
      
      // Alle Bilder vorladen
      for (final surface in _multiProject!.surfaces) {
        await _preloadImage(surface.imagePath);
      }
      
      notifyListeners();
    } catch (e) {
      print('Error importing multi-project: $e');
      rethrow;
    }
  }

  // === IMAGE HANDLING ===
  
  Future<void> _preloadImage(String? imagePath) async {
    if (imagePath == null || imagePath.isEmpty) return;
    if (_imageCache.containsKey(imagePath)) return;
    
    try {
      final file = File(imagePath);
      if (await file.exists()) {
        final bytes = await file.readAsBytes();
        _imageCache[imagePath] = bytes;
        
        // Optional: Dekodiertes Bild für schnellen Zugriff
        if (bytes.isNotEmpty) {
          _decodedImageCache[imagePath] = await compute(_decodeImage, bytes);
        }
      }
    } catch (e) {
      print('Error preloading image $imagePath: $e');
    }
  }

  static img.Image? _decodeImage(Uint8List bytes) {
    try {
      return img.decodeImage(bytes);
    } catch (e) {
      return null;
    }
  }

  Uint8List? getImageBytes(String? imagePath) {
    if (imagePath == null) return null;
    return _imageCache[imagePath];
  }

  img.Image? getDecodedImage(String? imagePath) {
    if (imagePath == null) return null;
    return _decodedImageCache[imagePath];
  }

  void _removeUnusedImage(String? imagePath) {
    if (imagePath == null) return;
    
    // Prüfen ob das Bild noch verwendet wird
    bool isUsed = false;
    
    if (_projection != null && _projection!.imagePath == imagePath) {
      isUsed = true;
    }
    
    if (_multiProject != null) {
      for (final surface in _multiProject!.surfaces) {
        if (surface.imagePath == imagePath) {
          isUsed = true;
          break;
        }
      }
    }
    
    if (!isUsed) {
      _imageCache.remove(imagePath);
      _decodedImageCache.remove(imagePath);
    }
  }

  void _clearUnusedImages() {
    final usedPaths = <String>{};
    
    if (_projection?.imagePath != null) {
      usedPaths.add(_projection!.imagePath!);
    }
    
    if (_multiProject != null) {
      for (final surface in _multiProject!.surfaces) {
        if (surface.imagePath != null) {
          usedPaths.add(surface.imagePath!);
        }
      }
    }
    
    final cachedPaths = _imageCache.keys.toList();
    for (final path in cachedPaths) {
      if (!usedPaths.contains(path)) {
        _imageCache.remove(path);
        _decodedImageCache.remove(path);
      }
    }
  }

  // === MEMORY MANAGEMENT ===
  
  void clearCache() {
    _imageCache.clear();
    _decodedImageCache.clear();
  }

  // === UTILITIES ===
  
  bool get hasProject => _projection != null || _multiProject != null;
  
  String get currentProjectName {
    if (_multiProject != null) return _multiProject!.name;
    if (_projection != null) return _projection!.name;
    return 'Untitled Project';
  }

  List<ControlPoint> get currentPoints {
    if (_multiProject != null) {
      return _multiProject!.selectedSurface?.points ?? [];
    }
    return _projection?.points ?? [];
  }

  String? get currentImagePath {
    if (_multiProject != null) {
      return _multiProject!.selectedSurface?.imagePath;
    }
    return _projection?.imagePath;
  }
}