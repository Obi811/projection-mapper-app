import 'package:flutter/material.dart';
import '../services/projection_service.dart';
import '../models/control_point.dart';  // WICHTIGER IMPORT HINZUFÜGEN

class ControlPanel extends StatelessWidget {
  final ProjectionService service;
  
  const ControlPanel({super.key, required this.service});
  
  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.grey[900],
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              border: Border(bottom: BorderSide(color: Colors.grey[800]!)),
            ),
            child: const Text(
              'Controls',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
          ),
          
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                _buildModeInfo(),
                const SizedBox(height: 16),
                _buildSurfaceInfo(),
                const SizedBox(height: 16),
                _buildPointList(),
              ],
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildModeInfo() {
    final isMulti = service.multiProject != null;
    
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.grey[800],
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: [
          Icon(
            isMulti ? Icons.layers : Icons.crop_square,
            color: Colors.blue,
          ),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                isMulti ? 'Multi-Surface Mode' : 'Single Surface Mode',
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 4),
              Text(
                isMulti 
                  ? 'Managing ${service.multiProject?.surfaces.length ?? 0} surfaces'
                  : 'Single projection surface',
                style: const TextStyle(fontSize: 12, color: Colors.grey),
              ),
            ],
          ),
        ],
      ),
    );
  }
  
  Widget _buildSurfaceInfo() {
    if (service.multiProject == null) return Container();
    
    final surface = service.multiProject!.selectedSurface;
    if (surface == null) return Container();
    
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.grey[800],
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Selected Surface',
            style: TextStyle(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          Text('Name: ${surface.name}'),
          Text('Points: ${surface.points.length}'),
          Text('Visible: ${surface.isVisible ? "Yes" : "No"}'),
          Text('Opacity: ${(surface.opacity * 100).toInt()}%'),
        ],
      ),
    );
  }
  
  Widget _buildPointList() {
    final points = service.projection?.points ?? 
                  service.multiProject?.selectedSurface?.points ?? [];
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Control Points',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8),
        ...points.map((point) {
          return ListTile(
            title: Text(point.name),
            subtitle: Text('X: ${point.x.toStringAsFixed(2)}, Y: ${point.y.toStringAsFixed(2)}'),
            leading: CircleAvatar(
              backgroundColor: point.isSelected ? Colors.blue : Colors.grey,
              child: Text(point.label),
            ),
            dense: true,
          );
        }).toList(),
      ],
    );
  }
}