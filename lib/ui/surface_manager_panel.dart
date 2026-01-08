import 'package:flutter/material.dart';
import '../services/projection_service.dart';
import '../models/multi_surface.dart';  // WICHTIGER IMPORT HINZUFÜGEN
import '../models/control_point.dart';  // WICHTIGER IMPORT HINZUFÜGEN

class SurfaceManagerPanel extends StatefulWidget {
  final ProjectionService service;
  
  const SurfaceManagerPanel({super.key, required this.service});
  
  @override
  _SurfaceManagerPanelState createState() => _SurfaceManagerPanelState();
}

class _SurfaceManagerPanelState extends State<SurfaceManagerPanel> {
  @override
  Widget build(BuildContext context) {
    final project = widget.service.multiProject;
    
    if (project == null) {
      return _buildEmptyState();
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
                    widget.service.addSurface('Surface ${project.surfaces.length + 1}');
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
                        surface.isVisible = value ?? true;
                        widget.service.notifyListeners();
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
                            if (value == 'rename') _renameSurface(surface);
                            if (value == 'duplicate') _duplicateSurface(surface);
                            if (value == 'delete') widget.service.removeSurface(surface.id);
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
                    onTap: () => widget.service.selectSurface(surface.id),
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
  }
  
  Widget _buildEmptyState() {
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
              widget.service.createMultiSurfaceProject('Multi-Surface Project');
            },
          ),
        ],
      ),
    );
  }
  
  void _renameSurface(ProjectionSurface surface) {
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
                surface.name = controller.text;
                widget.service.notifyListeners();
                Navigator.pop(context);
              },
              child: const Text('Rename'),
            ),
          ],
        );
      },
    );
  }
  
  void _duplicateSurface(ProjectionSurface surface) {
    final newSurface = ProjectionSurface(
      id: '${surface.id}_copy_${DateTime.now().millisecondsSinceEpoch}',
      name: '${surface.name} (Copy)',
      points: surface.points.map((p) => p.copyWith()).toList(),
      imagePath: surface.imagePath,
      isVisible: surface.isVisible,
      opacity: surface.opacity,
      zIndex: surface.zIndex + 1,
    );
    
    widget.service.multiProject?.surfaces.add(newSurface);
    widget.service.notifyListeners();
  }
}