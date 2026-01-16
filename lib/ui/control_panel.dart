import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/projection_service.dart';
import '../models/control_point.dart';

class ControlPanel extends StatelessWidget {
  const ControlPanel({super.key});
  
  @override
  Widget build(BuildContext context) {
    final service = Provider.of<ProjectionService>(context);
    
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
                _buildModeInfo(service),
                const SizedBox(height: 16),
                _buildSurfaceInfo(service),
                const SizedBox(height: 16),
                _buildPointList(service),
              ],
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildModeInfo(ProjectionService service) {
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
  
  Widget _buildSurfaceInfo(ProjectionService service) {
    if (service.multiProject == null) return const SizedBox.shrink();
    
    final surface = service.multiProject!.selectedSurface;
    if (surface == null) return const SizedBox.shrink();
    
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
  
  Widget _buildPointList(ProjectionService service) {
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