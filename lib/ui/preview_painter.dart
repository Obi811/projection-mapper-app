import 'dart:ui' as ui;
import 'dart:typed_data';
import 'package:flutter/material.dart';
import '../models/control_point.dart';

class PreviewPainter extends CustomPainter {
  final List<ControlPoint> points;
  final ui.Image? sourceImage;
  final bool showWireframe;

  PreviewPainter({
    required this.points,
    this.sourceImage,
    this.showWireframe = true,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.black
      ..style = PaintingStyle.fill;

    canvas.drawRect(Rect.fromLTWH(0, 0, size.width, size.height), paint);

    if (sourceImage != null && points.length >= 4) {
      _drawProjectedImage(canvas, size);
    }

    if (showWireframe) {
      _drawWireframe(canvas, size);
    }
  }

  void _drawProjectedImage(Canvas canvas, Size size) {
    final srcPoints = [
      Offset(0, 0),
      Offset(sourceImage!.width.toDouble(), 0),
      Offset(sourceImage!.width.toDouble(), sourceImage!.height.toDouble()),
      Offset(0, sourceImage!.height.toDouble()),
    ];

    final dstPoints = points
        .take(4)
        .map((p) => Offset(p.x * size.width, p.y * size.height))
        .toList();

    final vertices = ui.Vertices(
      ui.VertexMode.triangleFan,
      dstPoints,
      textureCoordinates: srcPoints,
      colors: List.filled(4, ui.Color.fromARGB(255, 255, 255, 255)),
    );

    final matrix = Float64List.fromList([
      1.0, 0.0, 0.0, 0.0,
      0.0, 1.0, 0.0, 0.0,
      0.0, 0.0, 1.0, 0.0,
      0.0, 0.0, 0.0, 1.0,
    ]);

    canvas.drawVertices(
      vertices,
      BlendMode.srcOver,
      Paint()
        ..shader = ui.ImageShader(
          sourceImage!,
          TileMode.clamp,
          TileMode.clamp,
          matrix,
        ),
    );
  }

  void _drawWireframe(Canvas canvas, Size size) {
    if (points.length < 3) return;

    final borderPaint = Paint()
      ..color = Colors.green.withOpacity(0.7)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.0;

    final path = Path();
    path.moveTo(points[0].x * size.width, points[0].y * size.height);
    
    for (var i = 1; i < points.length; i++) {
      path.lineTo(points[i].x * size.width, points[i].y * size.height);
    }
    
    if (points.length >= 3) {
      path.close();
    }
    
    canvas.drawPath(path, borderPaint);

    for (var point in points) {
      final pointPaint = Paint()
        ..color = Colors.cyan.withOpacity(0.8)
        ..style = PaintingStyle.fill;

      final pointCenter = Offset(
        point.x * size.width,
        point.y * size.height,
      );

      canvas.drawCircle(pointCenter, 8.0, pointPaint);

      final borderPaint = Paint()
        ..color = Colors.black
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2.0;

      canvas.drawCircle(pointCenter, 8.0, borderPaint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}