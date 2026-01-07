import 'dart:io';
import 'package:flutter/material.dart';

class FileDialog {
  static Future<String?> showSaveDialog(BuildContext context) async {
    final controller = TextEditingController(text: 'projection.json');
    
    return showDialog<String>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: Text('Save Project'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: controller,
                decoration: InputDecoration(
                  labelText: 'File name',
                  hintText: 'projection.json',
                ),
              ),
              SizedBox(height: 16),
              Text(
                'File will be saved in Documents folder',
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey[600],
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () {
                final fileName = controller.text.trim();
                if (fileName.isNotEmpty) {
                  final docsDir = Directory.current.path;
                  final path = '$docsDir/$fileName';
                  Navigator.pop(context, path);
                }
              },
              child: Text('Save'),
            ),
          ],
        );
      },
    );
  }

  static Future<String?> showOpenDialog(BuildContext context) async {
    final files = await _listJsonFiles();
    
    return showDialog<String>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: Text('Open Project'),
          content: Container(
            width: 400,
            height: 300,
            child: files.isEmpty
                ? Center(
                    child: Text(
                      'No .json files found in current directory',
                      style: TextStyle(color: Colors.grey[600]),
                    ),
                  )
                : ListView.builder(
                    itemCount: files.length,
                    itemBuilder: (context, index) {
                      final file = files[index];
                      return ListTile(
                        leading: Icon(Icons.insert_drive_file),
                        title: Text(_getFileName(file)),
                        subtitle: Text(
                          'Modified: ${_formatDate(file.lastModifiedSync())}',
                          style: TextStyle(fontSize: 12),
                        ),
                        onTap: () => Navigator.pop(context, file.path),
                      );
                    },
                  ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text('Cancel'),
            ),
          ],
        );
      },
    );
  }

  static Future<String?> showImagePicker(BuildContext context) async {
    final images = await _listImageFiles();
    
    return showDialog<String>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: Text('Select Image'),
          content: Container(
            width: 500,
            height: 400,
            child: images.isEmpty
                ? Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.image_not_supported, size: 64, color: Colors.grey[400]),
                        SizedBox(height: 16),
                        Text(
                          'No image files found\n(JPG, PNG, GIF, BMP)',
                          textAlign: TextAlign.center,
                          style: TextStyle(color: Colors.grey[600]),
                        ),
                      ],
                    ),
                  )
                : GridView.builder(
                    gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      crossAxisSpacing: 8,
                      mainAxisSpacing: 8,
                      childAspectRatio: 1.5,
                    ),
                    itemCount: images.length,
                    itemBuilder: (context, index) {
                      final file = images[index];
                      return GestureDetector(
                        onTap: () => Navigator.pop(context, file.path),
                        child: Card(
                          elevation: 2,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              Expanded(
                                child: Image.file(
                                  file,
                                  fit: BoxFit.cover,
                                  errorBuilder: (context, error, stackTrace) {
                                    return Center(
                                      child: Icon(Icons.broken_image, color: Colors.grey[400]),
                                    );
                                  },
                                ),
                              ),
                              Padding(
                                padding: EdgeInsets.all(8),
                                child: Text(
                                  _getFileName(file),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: TextStyle(fontSize: 12),
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text('Cancel'),
            ),
          ],
        );
      },
    );
  }

  static Future<List<File>> _listJsonFiles() async {
    try {
      final dir = Directory.current;
      final files = await dir.list().toList();
      
      return files
          .where((entity) =>
              entity is File &&
              entity.path.toLowerCase().endsWith('.json'))
          .map((entity) => entity as File)
          .toList();
    } catch (e) {
      return [];
    }
  }

  static Future<List<File>> _listImageFiles() async {
    try {
      final dir = Directory.current;
      final files = await dir.list().toList();
      
      return files
          .where((entity) {
            if (entity is File) {
              final path = entity.path.toLowerCase();
              return path.endsWith('.jpg') ||
                  path.endsWith('.jpeg') ||
                  path.endsWith('.png') ||
                  path.endsWith('.gif') ||
                  path.endsWith('.bmp');
            }
            return false;
          })
          .map((entity) => entity as File)
          .toList();
    } catch (e) {
      return [];
    }
  }

  static String _formatDate(DateTime date) {
    return '${date.day}.${date.month}.${date.year} ${date.hour}:${date.minute.toString().padLeft(2, '0')}';
  }

  static String _getFileName(File file) {
    final path = file.path;
    final separator = Platform.pathSeparator;
    return path.split(separator).last;
  }
}