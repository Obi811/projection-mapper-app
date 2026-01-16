import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'services/projection_service.dart';
import 'ui/surface_manager_panel.dart';
import 'ui/projection_canvas.dart';
import 'ui/control_panel.dart';
import 'ui/image_loader.dart';

void main() {
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => ProjectionService()),
      ],
      child: const MyApp(),
    ),
  );
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Projection Mapper',
      theme: ThemeData.dark().copyWith(
        colorScheme: ColorScheme.fromSeed(
          seedColor: Colors.blue,
          brightness: Brightness.dark,
        ),
        useMaterial3: true,
      ),
      home: const MainScreen(),
      debugShowCheckedModeBanner: false,
    );
  }
}

class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  _MainScreenState createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  bool _showSurfaceManager = true;

  @override
  Widget build(BuildContext context) {
    final service = Provider.of<ProjectionService>(context);
    final isMultiSurface = service.multiProject != null;
    
    return Scaffold(
      appBar: AppBar(
        title: Consumer<ProjectionService>(
          builder: (context, service, child) {
            return Text(
              service.currentProjectName,
              style: const TextStyle(fontWeight: FontWeight.bold),
            );
          },
        ),
        actions: [
          // Multi/Single Toggle
          IconButton(
            icon: Icon(isMultiSurface ? Icons.layers : Icons.layers_outlined),
            onPressed: () {
              if (isMultiSurface) {
                service.newProject('New Single Project');
              } else {
                service.createMultiSurfaceProject('Multi-Surface Project');
              }
            },
            tooltip: isMultiSurface ? 'Switch to Single Surface' : 'Switch to Multi-Surface',
          ),
          
          // Add Surface (nur in Multi-Modus)
          if (isMultiSurface)
            IconButton(
              icon: const Icon(Icons.add),
              onPressed: () {
                final count = service.multiProject!.surfaces.length;
                service.addSurface('Surface ${count + 1}');
              },
              tooltip: 'Add Surface',
            ),
          
          // Image Loader für Single Surface
          if (!isMultiSurface && service.projection != null)
            IconButton(
              icon: const Icon(Icons.image),
              onPressed: () => _showImagePicker(context, null),
              tooltip: 'Load Image',
            ),
          
          // Image Loader für Multi-Surface (aktuelle Surface)
          if (isMultiSurface && service.multiProject?.selectedSurface != null)
            IconButton(
              icon: const Icon(Icons.image),
              onPressed: () {
                final surface = service.multiProject!.selectedSurface;
                if (surface != null) {
                  _showImagePicker(context, surface.id);
                }
              },
              tooltip: 'Load Image for Selected Surface',
            ),
          
          const SizedBox(width: 16),
        ],
      ),
      body: Row(
        children: [
          if (_showSurfaceManager && isMultiSurface)
            const SurfaceManagerPanel(),
          
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
                      
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: isMultiSurface ? Colors.blue.withOpacity(0.2) : Colors.green.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: isMultiSurface ? Colors.blue : Colors.green,
                            width: 1,
                          ),
                        ),
                        child: Row(
                          children: [
                            Icon(
                              isMultiSurface ? Icons.layers : Icons.crop_square,
                              size: 16,
                              color: isMultiSurface ? Colors.blue : Colors.green,
                            ),
                            const SizedBox(width: 6),
                            Text(
                              isMultiSurface ? 'Multi-Surface' : 'Single Surface',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                color: isMultiSurface ? Colors.blue : Colors.green,
                              ),
                            ),
                          ],
                        ),
                      ),
                      
                      const SizedBox(width: 16),
                    ],
                  ),
                ),
                
                Expanded(
                  child: Row(
                    children: [
                      Expanded(
                        child: Container(
                          color: Colors.grey[900],
                          child: const ProjectionCanvas(),
                        ),
                      ),
                      
                      Container(
                        width: 300,
                        decoration: BoxDecoration(
                          border: Border(left: BorderSide(color: Colors.grey[800]!)),
                        ),
                        child: const ControlPanel(),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      
      // Floating Action Button for Quick Actions
      floatingActionButton: Consumer<ProjectionService>(
        builder: (context, service, child) {
          if (!service.hasProject) {
            return FloatingActionButton.extended(
              icon: const Icon(Icons.add),
              label: const Text('New Project'),
              onPressed: () => service.newProject('New Project'),
            );
          }
          return const SizedBox.shrink();  // KORREKTUR HIER: Statt null
        },
      ),
    );
  }
  
  void _showImagePicker(BuildContext context, String? surfaceId) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) {
        return ImageLoader(
          onImageSelected: (imagePath) {
            if (imagePath != null) {
              final service = Provider.of<ProjectionService>(context, listen: false);
              
              if (surfaceId == null) {
                // Single Surface Mode
                service.setImage(imagePath);
              } else {
                // Multi Surface Mode
                service.setImageForSurface(surfaceId, imagePath);
              }
            }
            Navigator.pop(context);
          },
        );
      },
    );
  }
}