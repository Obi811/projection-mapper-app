import 'package:flutter/material.dart';
import 'dart:io';
import 'models/control_point.dart';
import 'models/projection.dart';
import 'ui/projection_canvas.dart';
import 'ui/control_panel.dart';
import 'ui/point_editor.dart';
import 'ui/preview_panel.dart';
import 'ui/file_dialog.dart';
import 'ui/export_dialog.dart';
import 'services/projection_service.dart';
import 'extensions/list_extension.dart';

void main() {
  runApp(const ProjectionMapperApp());
}

class ProjectionMapperApp extends StatelessWidget {
  const ProjectionMapperApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Projection Mapper',
      theme: ThemeData.dark(),
      home: const ProjectionMapperScreen(),
    );
  }
}

class ProjectionMapperScreen extends StatefulWidget {
  const ProjectionMapperScreen({Key? key}) : super(key: key);

  @override
  State<ProjectionMapperScreen> createState() => _ProjectionMapperScreenState();
}

class _ProjectionMapperScreenState extends State<ProjectionMapperScreen> {
  late Projection _projection;
  final ProjectionService _service = ProjectionService();
  String _selectedPointId = '';
  bool _showPreview = true;

  @override
  void initState() {
    super.initState();
    _projection = Projection.initial();
  }

  void _updatePoint(ControlPoint updatedPoint) {
    setState(() {
      final index = _projection.points.indexWhere((p) => p.id == updatedPoint.id);
      if (index != -1) {
        _projection.points[index] = updatedPoint;
      }
    });
  }

  void _selectPoint(String pointId) {
    setState(() {
      _selectedPointId = pointId;
      _projection.clearSelection();
      if (pointId.isNotEmpty) {
        final index = _projection.points.indexWhere((p) => p.id == pointId);
        if (index != -1) {
          _projection.points[index] = _projection.points[index].copyWith(isSelected: true);
        }
      }
    });
  }

  void _updateProjectName(String name) {
    setState(() {
      _projection = Projection(
        id: _projection.id,
        name: name,
        points: _projection.points,
        imagePath: _projection.imagePath,
        lastModified: _projection.lastModified,
      );
    });
  }

  void _newProject() {
    setState(() {
      _projection = Projection.initial();
      _selectedPointId = '';
    });
  }

  Future<void> _loadProject() async {
    final path = await FileDialog.showOpenDialog(context);
    if (path != null && File(path).existsSync()) {
      try {
        final loaded = await _service.loadProject(path);
        setState(() {
          _projection = loaded;
          _selectedPointId = '';
        });
      } catch (e) {
        _showError('Failed to load project: $e');
      }
    }
  }

  Future<void> _saveProject() async {
    final path = await FileDialog.showSaveDialog(context);
    if (path != null) {
      try {
        await _service.saveProject(_projection, path);
        _showSuccess('Project saved successfully');
      } catch (e) {
        _showError('Failed to save project: $e');
      }
    }
  }

  Future<void> _loadImage() async {
    final path = await FileDialog.showImagePicker(context);
    if (path != null) {
      setState(() {
        _projection = Projection(
          id: _projection.id,
          name: _projection.name,
          points: _projection.points,
          imagePath: path,
          lastModified: _projection.lastModified,
        );
      });
    }
  }

  void _addPoint() {
    setState(() {
      final newId = DateTime.now().millisecondsSinceEpoch.toString();
      _projection.addPoint(
        ControlPoint(
          id: newId,
          x: 0.5,
          y: 0.5,
          label: 'P${_projection.points.length + 1}',
        ),
      );
      _selectPoint(newId);
    });
  }

  void _removePoint() {
    if (_selectedPointId.isNotEmpty) {
      setState(() {
        _projection.removePoint(_selectedPointId);
        _selectedPointId = '';
      });
    }
  }

  void _togglePreview() {
    setState(() {
      _showPreview = !_showPreview;
    });
  }

  Future<void> _exportJson() async {
    final content = _projection.toJsonString();
    await ExportDialog.showExportDialog(
      context,
      content,
      _projection.name.toLowerCase().replaceAll(' ', '_'),
      'json',
    );
  }

  Future<void> _exportCsv() async {
    final content = _projection.toCsvString();
    await ExportDialog.showExportDialog(
      context,
      content,
      _projection.name.toLowerCase().replaceAll(' ', '_'),
      'csv',
    );
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
      ),
    );
  }

  void _showSuccess(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.green,
      ),
    );
  }

  ControlPoint? get _selectedPoint {
    return _projection.points.firstWhereOrNull((p) => p.id == _selectedPointId);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_projection.name),
        actions: [
          IconButton(
            icon: Icon(Icons.info_outline),
            onPressed: () {
              showDialog(
                context: context,
                builder: (context) => AlertDialog(
                  title: Text('Projection Mapper'),
                  content: Text(
                    'Points: ${_projection.points.length}\n'
                    'Last modified: ${_projection.lastModified.toString().substring(0, 16)}\n'
                    'Image: ${_projection.imagePath != null ? "Loaded" : "None"}\n'
                    'Preview: ${_showPreview ? "Visible" : "Hidden"}',
                  ),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.pop(context),
                      child: Text('OK'),
                    ),
                  ],
                ),
              );
            },
          ),
        ],
      ),
      body: Row(
        children: [
          ControlPanel(
            onNewProject: _newProject,
            onLoadProject: _loadProject,
            onSaveProject: _saveProject,
            onLoadImage: _loadImage,
            onExportJson: _exportJson,
            onExportCsv: _exportCsv,
            onAddPoint: _addPoint,
            onRemovePoint: _removePoint,
            onTogglePreview: _togglePreview,
            projectName: _projection.name,
            pointCount: _projection.points.length,
            hasSelectedPoint: _selectedPointId.isNotEmpty,
            showPreview: _showPreview,
            onProjectNameChanged: _updateProjectName,
          ),
          Expanded(
            child: _showPreview
                ? Row(
                    children: [
                      Expanded(
                        flex: 2,
                        child: Column(
                          children: [
                            Expanded(
                              child: Center(
                                child: AspectRatio(
                                  aspectRatio: 16 / 9,
                                  child: Container(
                                    margin: EdgeInsets.all(20),
                                    decoration: BoxDecoration(
                                      border: Border.all(color: Colors.grey, width: 1),
                                    ),
                                    child: ProjectionCanvas(
                                      points: _projection.points,
                                      onPointUpdated: _updatePoint,
                                      onPointSelected: _selectPoint,
                                      imagePath: _projection.imagePath,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                            if (_selectedPoint != null)
                              Container(
                                height: 200,
                                color: Colors.grey[850],
                                child: PointEditor(
                                  point: _selectedPoint,
                                  onPointUpdated: _updatePoint,
                                ),
                              ),
                          ],
                        ),
                      ),
                      VerticalDivider(width: 1, color: Colors.grey[800]),
                      Expanded(
                        flex: 2,
                        child: Padding(
                          padding: EdgeInsets.all(20),
                          child: PreviewPanel(
                            points: _projection.points,
                            imagePath: _projection.imagePath,
                            showWireframe: true,
                          ),
                        ),
                      ),
                    ],
                  )
                : Column(
                    children: [
                      Expanded(
                        child: Center(
                          child: AspectRatio(
                            aspectRatio: 16 / 9,
                            child: Container(
                              margin: EdgeInsets.all(20),
                              decoration: BoxDecoration(
                                border: Border.all(color: Colors.grey, width: 1),
                              ),
                              child: ProjectionCanvas(
                                points: _projection.points,
                                onPointUpdated: _updatePoint,
                                onPointSelected: _selectPoint,
                                imagePath: _projection.imagePath,
                              ),
                            ),
                          ),
                        ),
                      ),
                      if (_selectedPoint != null)
                        Container(
                          height: 200,
                          color: Colors.grey[850],
                          child: PointEditor(
                            point: _selectedPoint,
                            onPointUpdated: _updatePoint,
                          ),
                        ),
                    ],
                  ),
          ),
        ],
      ),
    );
  }
}