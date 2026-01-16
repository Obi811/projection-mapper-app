import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';

class ImageLoader extends StatefulWidget {
  final Function(String?) onImageSelected;
  
  const ImageLoader({super.key, required this.onImageSelected});
  
  @override
  _ImageLoaderState createState() => _ImageLoaderState();
}

class _ImageLoaderState extends State<ImageLoader> {
  bool _isLoading = false;
  String? _selectedPath;

  Future<void> _pickImage() async {
    setState(() => _isLoading = true);
    
    try {
      final FilePickerResult? result = await FilePicker.platform.pickFiles(
        type: FileType.custom,  // GEÄNDERT: von 'image' zu 'custom'
        allowedExtensions: ['jpg', 'jpeg', 'png', 'bmp', 'gif'],
        allowMultiple: false,
      );
      
      if (result != null && result.files.isNotEmpty) {
        final file = result.files.first;
        setState(() => _selectedPath = file.path);
        widget.onImageSelected(file.path);
      }
    } catch (e) {
      print('Error picking image: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Error loading image')),
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            'Load Image',
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: 16),
          
          if (_selectedPath != null)
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.grey[800],
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  const Icon(Icons.image, size: 24),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _selectedPath!.split('/').last,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          _selectedPath!,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontSize: 12, color: Colors.grey),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          
          const SizedBox(height: 20),
          
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  icon: _isLoading
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.folder_open),
                  label: Text(_isLoading ? 'Loading...' : 'Select Image'),
                  onPressed: _isLoading ? null : _pickImage,
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 12),
          
          TextButton(
            onPressed: () {
              widget.onImageSelected(null);
              Navigator.pop(context);
            },
            child: const Text('Clear Image'),
          ),
        ],
      ),
    );
  }
}