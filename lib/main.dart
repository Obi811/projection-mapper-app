import 'package:flutter/material.dart';
import 'services/projection_service.dart';
import 'ui/surface_manager_panel.dart';
import 'ui/projection_canvas.dart';
import 'ui/control_panel.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Projection Mapper',
      theme: ThemeData.dark(),
      home: const MainScreen(),
    );
  }
}

class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  _MainScreenState createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  final ProjectionService _service = ProjectionService();
  bool _showSurfaceManager = true;

  @override
  void initState() {
    super.initState();
    _service.newProject('New Project');
  }

  void _toggleMultiSurfaceMode() {
    if (_service.multiProject == null) {
      _service.createMultiSurfaceProject('Multi-Surface Project');
    } else {
      _service.newProject('Single Surface Project');
    }
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    final isMultiSurface = _service.multiProject != null;
    
    return Scaffold(
      appBar: AppBar(
        title: Text(_service.projection?.name ?? _service.multiProject?.name ?? 'Projection Mapper'),
        actions: [
          IconButton(
            icon: Icon(isMultiSurface ? Icons.layers : Icons.layers_outlined),
            onPressed: _toggleMultiSurfaceMode,
            tooltip: isMultiSurface ? 'Switch to Single Surface' : 'Switch to Multi-Surface',
          ),
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () {
              if (isMultiSurface) {
                _service.addSurface('New Surface');
              }
            },
            tooltip: 'Add Surface',
          ),
        ],
      ),
      body: Row(
        children: [
          if (_showSurfaceManager && isMultiSurface)
            SurfaceManagerPanel(service: _service),
          
          Expanded(
            child: Column(
              children: [
                Container(
                  height: 48,
                  decoration: BoxDecoration(
                    border: Border(bottom: BorderSide(color: Colors.grey[800]!)),
                  ),
                  child: Row(
                    children: [
                      if (isMultiSurface)
                        IconButton(
                          icon: Icon(_showSurfaceManager ? Icons.chevron_left : Icons.chevron_right),
                          onPressed: () {
                            setState(() {
                              _showSurfaceManager = !_showSurfaceManager;
                            });
                          },
                          tooltip: 'Toggle Surface Manager',
                        ),
                      const Spacer(),
                      Text(
                        isMultiSurface 
                          ? 'Multi-Surface Mode' 
                          : 'Single Surface Mode',
                        style: const TextStyle(fontSize: 12, color: Colors.grey),
                      ),
                      const SizedBox(width: 16),
                    ],
                  ),
                ),
                
                Expanded(
                  child: Row(
                    children: [
                      Expanded(
                        child: ProjectionCanvas(service: _service),
                      ),
                      
                      Container(
                        width: 300,
                        decoration: BoxDecoration(
                          border: Border(left: BorderSide(color: Colors.grey[800]!)),
                        ),
                        child: ControlPanel(service: _service),
                      ),
                    ],
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