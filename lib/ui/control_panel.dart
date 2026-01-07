import 'dart:io';
import 'package:flutter/material.dart';

class ControlPanel extends StatelessWidget {
  final VoidCallback onNewProject;
  final VoidCallback onLoadProject;
  final VoidCallback onSaveProject;
  final VoidCallback onLoadImage;
  final VoidCallback onExportJson;
  final VoidCallback onExportCsv;
  final VoidCallback onAddPoint;
  final VoidCallback onRemovePoint;
  final VoidCallback onTogglePreview;
  final String projectName;
  final int pointCount;
  final bool hasSelectedPoint;
  final bool showPreview;
  final ValueChanged<String> onProjectNameChanged;

  const ControlPanel({
    Key? key,
    required this.onNewProject,
    required this.onLoadProject,
    required this.onSaveProject,
    required this.onLoadImage,
    required this.onExportJson,
    required this.onExportCsv,
    required this.onAddPoint,
    required this.onRemovePoint,
    required this.onTogglePreview,
    required this.projectName,
    required this.pointCount,
    required this.hasSelectedPoint,
    required this.showPreview,
    required this.onProjectNameChanged,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 300,
      color: Colors.grey[900],
      padding: const EdgeInsets.all(20),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Project Settings',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            SizedBox(height: 20),
            TextField(
              decoration: InputDecoration(
                labelText: 'Project Name',
                labelStyle: TextStyle(color: Colors.grey[400]),
                border: OutlineInputBorder(),
                enabledBorder: OutlineInputBorder(
                  borderSide: BorderSide(color: Colors.grey[700]!),
                ),
              ),
              style: TextStyle(color: Colors.white),
              controller: TextEditingController(text: projectName),
              onChanged: onProjectNameChanged,
            ),
            SizedBox(height: 30),
            Text(
              'File Operations',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: Colors.grey[400],
              ),
            ),
            SizedBox(height: 10),
            _buildButton(
              icon: Icons.add,
              label: 'New Project',
              onPressed: onNewProject,
            ),
            _buildButton(
              icon: Icons.folder_open,
              label: 'Load Project (.json)',
              onPressed: onLoadProject,
            ),
            _buildButton(
              icon: Icons.save,
              label: 'Save Project',
              onPressed: onSaveProject,
            ),
            SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: _buildSmallButton(
                    icon: Icons.code,
                    label: 'JSON',
                    onPressed: onExportJson,
                  ),
                ),
                SizedBox(width: 8),
                Expanded(
                  child: _buildSmallButton(
                    icon: Icons.table_chart,
                    label: 'CSV',
                    onPressed: onExportCsv,
                  ),
                ),
              ],
            ),
            SizedBox(height: 30),
            Text(
              'Media',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: Colors.grey[400],
              ),
            ),
            SizedBox(height: 10),
            _buildButton(
              icon: Icons.image,
              label: 'Load Image (JPG/PNG)',
              onPressed: onLoadImage,
            ),
            SizedBox(height: 30),
            Text(
              'Points Management',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: Colors.grey[400],
              ),
            ),
            SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: _buildSmallButton(
                    icon: Icons.add_circle,
                    label: 'Add Point',
                    onPressed: onAddPoint,
                  ),
                ),
                SizedBox(width: 8),
                Expanded(
                  child: _buildSmallButton(
                    icon: Icons.remove_circle,
                    label: 'Remove Point',
                    onPressed: hasSelectedPoint ? onRemovePoint : null,
                    isDisabled: !hasSelectedPoint,
                  ),
                ),
              ],
            ),
            SizedBox(height: 30),
            Text(
              'Preview',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: Colors.grey[400],
              ),
            ),
            SizedBox(height: 10),
            _buildToggleButton(
              icon: showPreview ? Icons.visibility_off : Icons.visibility,
              label: showPreview ? 'Hide Preview' : 'Show Preview',
              isActive: showPreview,
              onPressed: onTogglePreview,
            ),
            SizedBox(height: 20),
            Divider(color: Colors.grey[700]),
            SizedBox(height: 10),
            _buildInfoRow('Points:', '$pointCount'),
            _buildInfoRow('Canvas:', '16:9'),
            _buildInfoRow('Status:', hasSelectedPoint ? 'Point selected' : 'No selection'),
            _buildInfoRow('Preview:', showPreview ? 'Visible' : 'Hidden'),
            SizedBox(height: 20),
            Divider(color: Colors.grey[700]),
            SizedBox(height: 10),
            Text(
              'Current Directory:',
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey[500],
              ),
            ),
            SizedBox(height: 5),
            Text(
              _getCurrentDirectory(),
              style: TextStyle(
                fontSize: 11,
                color: Colors.grey[600],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildButton({
    required IconData icon,
    required String label,
    required VoidCallback onPressed,
  }) {
    return Container(
      width: double.infinity,
      margin: EdgeInsets.only(bottom: 8),
      child: ElevatedButton.icon(
        icon: Icon(icon, size: 18),
        label: Text(label),
        onPressed: onPressed,
        style: ElevatedButton.styleFrom(
          padding: EdgeInsets.symmetric(vertical: 12),
          alignment: Alignment.centerLeft,
        ),
      ),
    );
  }

  Widget _buildSmallButton({
    required IconData icon,
    required String label,
    required VoidCallback? onPressed,
    bool isDisabled = false,
  }) {
    return Opacity(
      opacity: isDisabled ? 0.5 : 1.0,
      child: ElevatedButton.icon(
        icon: Icon(icon, size: 16),
        label: Text(label),
        onPressed: isDisabled ? null : onPressed,
        style: ElevatedButton.styleFrom(
          padding: EdgeInsets.symmetric(vertical: 10, horizontal: 8),
        ),
      ),
    );
  }

  Widget _buildToggleButton({
    required IconData icon,
    required String label,
    required bool isActive,
    required VoidCallback onPressed,
  }) {
    return Container(
      width: double.infinity,
      margin: EdgeInsets.only(bottom: 8),
      child: ElevatedButton.icon(
        icon: Icon(icon, size: 18),
        label: Text(label),
        onPressed: onPressed,
        style: ElevatedButton.styleFrom(
          padding: EdgeInsets.symmetric(vertical: 12),
          alignment: Alignment.centerLeft,
          backgroundColor: isActive ? Colors.blue[800] : null,
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: EdgeInsets.only(bottom: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey[400],
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontSize: 14,
              color: Colors.white,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  String _getCurrentDirectory() {
    try {
      final path = Directory.current.path;
      if (path.length > 40) {
        return '...${path.substring(path.length - 40)}';
      }
      return path;
    } catch (e) {
      return 'Unable to determine directory';
    }
  }
}