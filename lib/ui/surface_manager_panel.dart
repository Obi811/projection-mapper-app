import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/projection_service.dart';
import '../models/multi_surface.dart';
import '../models/control_point.dart';

class SurfaceManagerPanel extends StatefulWidget {
  const SurfaceManagerPanel({super.key});
  
  @override
  _SurfaceManagerPanelState createState() => _SurfaceManagerPanelState();
}

class _SurfaceManagerPanelState extends State<SurfaceManagerPanel> {
  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: Provider.of<ProjectionService>(context),
      builder: (context, child) {
        final service = Provider.of<ProjectionService>(context);
        final project = service.multiProject;
        
        if (project == null) {
          return _buildEmptyState(context);
        }
        
        return Container(
          width: 250,
          decoration: BoxDecoration(
            color: Theme.of(context).cardColor,
            border: Border(right: BorderSide(color: Colors.grey[800]!)),
          ),
          child: Column(
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  border: Border(bottom: BorderSide(color: Colors.grey[800]!)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.layers, size: 20),
                    const SizedBox(width: 8),
                    const Text('Surfaces', style: TextStyle(fontWeight: FontWeight.bold)),
                    const Spacer(),
                    IconButton(
                      icon: const Icon(Icons.add, size: 20),
                      onPressed: () {
                        service.addSurface('Surface ${project.surfaces.length + 1}');
                      },
                      tooltip: 'Add Surface',
                    ),
                  ],
                ),
              ),
              
              Expanded(
                child: ListView.builder(
                  padding: const EdgeInsets.all(8),
                  itemCount: project.surfaces.length,
                  itemBuilder: (context, index) {
                    final surface = project.surfaces[index];
                    final isSelected = surface.id == project.selectedSurfaceId;
                    
                    return Container(
                      key: ValueKey(surface.id),
                      margin: const EdgeInsets.only(bottom: 4),
                      decoration: BoxDecoration(
                        color: isSelected 
                          ? Theme.of(context).primaryColor.withOpacity(0.2)
                          : Colors.transparent,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: isSelected 
                            ? Theme.of(context).primaryColor 
                            : Colors.transparent,
                        ),
                      ),
                      child: ListTile(
                        leading: Checkbox(
                          value: surface.isVisible,
                          onChanged: (value) {
                            setState(() {
                              surface.isVisible = value ?? true;
                            });
                            service.notifyListeners();
                          },
                        ),
                        title: Row(
                          children: [
                            Expanded(
                              child: Text(
                                surface.name,
                                style: TextStyle(
                                  fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                                ),
                              ),
                            ),
                            PopupMenuButton<String>(
                              icon: const Icon(Icons.more_vert, size: 18),
                              onSelected: (value) {
                                if (value == 'rename') {
                                  _renameSurface(context, surface);
                                } else if (value == 'duplicate') {
                                  service.duplicateSurface(surface.id);
                                } else if (value == 'delete') {
                                  service.removeSurface(surface.id);
                                }
                              },
                              itemBuilder: (context) => [
                                const PopupMenuItem(
                                  value: 'rename',
                                  child: Row(
                                    children: [
                                      Icon(Icons.edit, size: 18),
                                      SizedBox(width: 8),
                                      Text('Rename'),
                                    ],
                                  ),
                                ),
                                const PopupMenuItem(
                                  value: 'duplicate',
                                  child: Row(
                                    children: [
                                      Icon(Icons.copy, size: 18),
                                      SizedBox(width: 8),
                                      Text('Duplicate'),
                                    ],
                                  ),
                                ),
                                const PopupMenuItem(
                                  value: 'delete',
                                  child: Row(
                                    children: [
                                      Icon(Icons.delete, size: 18, color: Colors.red),
                                      SizedBox(width: 8),
                                      Text('Delete', style: TextStyle(color: Colors.red)),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                        onTap: () {
                          service.selectSurface(surface.id);
                        },
                        dense: true,
                      ),
                    );
                  },
                ),
              ),
              
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  border: Border(top: BorderSide(color: Colors.grey[800]!)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      '${project.surfaces.length} Surface${project.surfaces.length != 1 ? 's' : ''}',
                      style: const TextStyle(fontSize: 12, color: Colors.grey),
                    ),
                    Text(
                      '${project.surfaces.where((s) => s.isVisible).length} visible',
                      style: const TextStyle(fontSize: 12, color: Colors.grey),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
  
  Widget _buildEmptyState(BuildContext context) {
    final service = Provider.of<ProjectionService>(context);
    
    return Container(
      width: 250,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        border: Border(right: BorderSide(color: Colors.grey[800]!)),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.layers_outlined, size: 48, color: Colors.grey),
          const SizedBox(height: 16),
          const Text(
            'No Multi-Surface Project',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          const Text(
            'Create a new multi-surface project to manage multiple projection areas',
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.grey),
          ),
          const SizedBox(height: 20),
          ElevatedButton.icon(
            icon: const Icon(Icons.add),
            label: const Text('Create Multi-Surface Project'),
            onPressed: () {
              service.createMultiSurfaceProject('Multi-Surface Project');
            },
          ),
        ],
      ),
    );
  }
  
  void _renameSurface(BuildContext context, ProjectionSurface surface) {
    final service = Provider.of<ProjectionService>(context, listen: false);
    final controller = TextEditingController(text: surface.name);
    
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Rename Surface'),
          content: TextField(
            controller: controller,
            autofocus: true,
            decoration: const InputDecoration(
              labelText: 'Surface Name',
              border: OutlineInputBorder(),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () {
                service.renameSurface(surface.id, controller.text);
                Navigator.pop(context);
              },
              child: const Text('Rename'),
            ),
          ],
        );
      },
    );
  }
}