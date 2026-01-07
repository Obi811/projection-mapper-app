import 'dart:io';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import '../models/control_point.dart';
import './preview_painter.dart';

class PreviewPanel extends StatefulWidget {
  final List<ControlPoint> points;
  final String? imagePath;
  final bool showWireframe;

  const PreviewPanel({
    Key? key,
    required this.points,
    this.imagePath,
    this.showWireframe = true,
  }) : super(key: key);

  @override
  State<PreviewPanel> createState() => _PreviewPanelState();
}

class _PreviewPanelState extends State<PreviewPanel> {
  ui.Image? _previewImage;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _loadPreviewImage();
  }

  @override
  void didUpdateWidget(PreviewPanel oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.imagePath != oldWidget.imagePath) {
      _loadPreviewImage();
    }
  }

  Future<void> _loadPreviewImage() async {
    if (widget.imagePath == null) {
      setState(() {
        _previewImage = null;
        _isLoading = false;
      });
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      final data = await File(widget.imagePath!).readAsBytes();
      final codec = await ui.instantiateImageCodec(data);
      final frame = await codec.getNextFrame();
      
      setState(() {
        _previewImage = frame.image;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _previewImage = null;
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        border: Border.all(color: Colors.grey[800]!, width: 1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            padding: EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.grey[900],
              borderRadius: BorderRadius.vertical(top: Radius.circular(8)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Preview',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                Row(
                  children: [
                    Icon(
                      Icons.check_circle,
                      size: 14,
                      color: widget.points.length >= 4 
                          ? Colors.green 
                          : Colors.grey[600],
                    ),
                    SizedBox(width: 4),
                    Text(
                      '${widget.points.length}/4 points',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey[400],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          Expanded(
            child: Container(
              color: Colors.black,
              child: _isLoading
                  ? Center(
                      child: CircularProgressIndicator(),
                    )
                  : _previewImage == null
                      ? Center(
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                Icons.image_not_supported,
                                size: 48,
                                color: Colors.grey[700],
                              ),
                              SizedBox(height: 12),
                              Text(
                                'No image loaded',
                                style: TextStyle(
                                  color: Colors.grey[600],
                                ),
                              ),
                              SizedBox(height: 8),
                              Text(
                                'Load an image to see preview',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.grey[500],
                                ),
                              ),
                            ],
                          ),
                        )
                      : CustomPaint(
                          painter: PreviewPainter(
                            points: widget.points,
                            sourceImage: _previewImage,
                            showWireframe: widget.showWireframe,
                          ),
                        ),
            ),
          ),
          Container(
            padding: EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.grey[900],
              borderRadius: BorderRadius.vertical(bottom: Radius.circular(8)),
            ),
            child: Row(
              children: [
                Icon(
                  Icons.info,
                  size: 14,
                  color: Colors.grey[500],
                ),
                SizedBox(width: 8),
                Expanded(
                  child: Text(
                    widget.points.length >= 4
                        ? 'Ready for projection'
                        : 'Need ${4 - widget.points.length} more points',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey[400],
                    ),
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