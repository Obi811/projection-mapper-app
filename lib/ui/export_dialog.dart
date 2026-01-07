import 'package:flutter/material.dart';
import 'dart:io';

class ExportDialog {
  static Future<void> showExportDialog(
    BuildContext context,
    String content,
    String fileName,
    String fileExtension,
  ) async {
    final controller = TextEditingController(text: '$fileName.$fileExtension');
    
    await showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: Text('Export $fileExtension'.toUpperCase()),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: controller,
                decoration: InputDecoration(
                  labelText: 'File name',
                  hintText: 'projection.$fileExtension',
                ),
              ),
              SizedBox(height: 16),
              Container(
                height: 200,
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.grey),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: SingleChildScrollView(
                  child: Padding(
                    padding: EdgeInsets.all(8),
                    child: SelectableText(
                      content,
                      style: TextStyle(fontFamily: 'Monospace', fontSize: 12),
                    ),
                  ),
                ),
              ),
              SizedBox(height: 8),
              Text(
                'Content will be saved in current directory',
                style: TextStyle(fontSize: 12, color: Colors.grey[600]),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () async {
                final fileName = controller.text.trim();
                if (fileName.isNotEmpty) {
                  try {
                    final file = File('${Directory.current.path}/$fileName');
                    await file.writeAsString(content);
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('Exported to ${file.path}'),
                        backgroundColor: Colors.green,
                      ),
                    );
                    Navigator.pop(context);
                  } catch (e) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('Export failed: $e'),
                        backgroundColor: Colors.red,
                      ),
                    );
                  }
                }
              },
              child: Text('Export'),
            ),
          ],
        );
      },
    );
  }
}