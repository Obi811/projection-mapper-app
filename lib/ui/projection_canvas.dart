import 'dart:typed_data';  // DIESE ZEILE HINZUFÜGEN
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/projection_service.dart';
import '../models/control_point.dart';

class ProjectionCanvas extends StatefulWidget {
  const ProjectionCanvas({super.key});
  
  @override
  _ProjectionCanvasState createState() => _ProjectionCanvasState();
}

class _ProjectionCanvasState extends State<ProjectionCanvas> {
  Offset? _draggingPoint;
  int? _draggingIndex;

  @override
  Widget build(BuildContext context) {
    return Consumer<ProjectionService>(
      builder: (context, service, child) {
        final points = service.currentPoints;
        final imagePath = service.currentImagePath;
        final imageBytes = service.getImageBytes(imagePath);
        
        return GestureDetector(
          onPanDown: (details) => _handlePanDown(details, points, context),
          onPanUpdate: (details) => _handlePanUpdate(details, points, context),
          onPanEnd: (details) => _handlePanEnd(),
          child: CustomPaint(
            size: Size.infinite,
            painter: _ProjectionCanvasPainter(
              points: points,
              imageBytes: imageBytes,
            ),
          ),
        );
      },
    );
  }

  void _handlePanDown(DragDownDetails details, List<ControlPoint> points, BuildContext context) {
    final renderBox = context.findRenderObject() as RenderBox;
    final localPosition = renderBox.globalToLocal(details.globalPosition);
    final size = renderBox.size;
    
    for (var i = 0; i < points.length; i++) {
      final point = points[i];
      final pointCenter = Offset(point.x * size.width, point.y * size.height);
      final distance = (pointCenter - localPosition).distance;
      
      if (distance <= point.radius) {
        setState(() {
          _draggingIndex = i;
          _draggingPoint = localPosition;
        });
        return;
      }
    }
  }

  void _handlePanUpdate(DragUpdateDetails details, List<ControlPoint> points, BuildContext context) {
    if (_draggingIndex == null) return;
    
    final renderBox = context.findRenderObject() as RenderBox;
    final localPosition = renderBox.globalToLocal(details.globalPosition);
    final size = renderBox.size;
    
    final newX = (localPosition.dx / size.width).clamp(0.0, 1.0);
    final newY = (localPosition.dy / size.height).clamp(0.0, 1.0);
    
    final updatedPoints = List<ControlPoint>.from(points);
    updatedPoints[_draggingIndex!] = updatedPoints[_draggingIndex!].copyWith(
      x: newX,
      y: newY,
    );
    
    Provider.of<ProjectionService>(context, listen: false)
        .updatePoints(updatedPoints);
    
    _draggingPoint = localPosition;
  }

  void _handlePanEnd() {
    setState(() {
      _draggingIndex = null;
      _draggingPoint = null;
    });
  }
}

class _ProjectionCanvasPainter extends CustomPainter {
  final List<ControlPoint> points;
  final Uint8List? imageBytes;

  _ProjectionCanvasPainter({
    required this.points,
    this.imageBytes,
  });

  @override
  void paint(Canvas canvas, Size size) {
    _drawBackground(canvas, size);
    
    if (imageBytes != null && imageBytes!.isNotEmpty) {
      _drawImage(canvas, size);
    }
    
    _drawWireframe(canvas, size);
    _drawPoints(canvas, size);
  }

  void _drawBackground(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.grey[900]!
      ..style = PaintingStyle.fill;
    
    canvas.drawRect(Offset.zero & size, paint);
    
    // Grid für bessere Orientierung
    final gridPaint = Paint()
      ..color = Colors.grey[800]!
      ..style = PaintingStyle.stroke
      ..strokeWidth = 0.5;
    
    final gridSize = 50.0;
    for (var x = 0.0; x < size.width; x += gridSize) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), gridPaint);
    }
    for (var y = 0.0; y < size.height; y += gridSize) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), gridPaint);
    }
  }

  void _drawImage(Canvas canvas, Size size) {
    // Für jetzt: Einfaches Rechteck als Platzhalter
    // Später: Tatsächliches Bild rendern
    final imagePaint = Paint()
      ..color = Colors.blue.withOpacity(0.3)
      ..style = PaintingStyle.fill;
    
    canvas.drawRect(
      Rect.fromPoints(
        Offset(size.width * 0.1, size.height * 0.1),
        Offset(size.width * 0.9, size.height * 0.9),
      ),
      imagePaint,
    );
    
    final textStyle = TextStyle(
      color: Colors.white.withOpacity(0.7),
      fontSize: 16,
      fontWeight: FontWeight.bold,
    );
    
    final textSpan = TextSpan(
      text: 'Image Loaded\n${imageBytes!.length ~/ 1024} KB',
      style: textStyle,
    );
    
    final textPainter = TextPainter(
      text: textSpan,
      textAlign: TextAlign.center,
      textDirection: TextDirection.ltr,
    );
    
    textPainter.layout();
    textPainter.paint(
      canvas,
      Offset(
        (size.width - textPainter.width) / 2,
        (size.height - textPainter.height) / 2,
      ),
    );
  }

  void _drawWireframe(Canvas canvas, Size size) {
    if (points.length < 3) return;
    
    final paint = Paint()
      ..color = Colors.blue.withOpacity(0.5)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2;
    
    final path = Path();
    path.moveTo(points[0].x * size.width, points[0].y * size.height);
    
    for (var i = 1; i < points.length; i++) {
      path.lineTo(points[i].x * size.width, points[i].y * size.height);
    }
    
    if (points.length >= 3) {
      path.close();
    }
    
    canvas.drawPath(path, paint);
  }

  void _drawPoints(Canvas canvas, Size size) {
    for (var point in points) {
      final pointCenter = Offset(point.x * size.width, point.y * size.height);
      
      // Punkt füllen
      final pointPaint = Paint()
        ..color = point.isSelected ? Colors.blue : Colors.white
        ..style = PaintingStyle.fill;
      
      canvas.drawCircle(pointCenter, point.radius, pointPaint);
      
      // Punkt rand
      final borderPaint = Paint()
        ..color = Colors.black
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2;
      
      canvas.drawCircle(pointCenter, point.radius, borderPaint);
      
      // Punkt label
      final textStyle = TextStyle(
        color: Colors.black,
        fontSize: 12,
        fontWeight: FontWeight.bold,
      );
      
      final textSpan = TextSpan(
        text: point.label,
        style: textStyle,
      );
      
      final textPainter = TextPainter(
        text: textSpan,
        textDirection: TextDirection.ltr,
      );
      
      textPainter.layout();
      textPainter.paint(
        canvas,
        Offset(
          pointCenter.dx - textPainter.width / 2,
          pointCenter.dy - textPainter.height / 2,
        ),
      );
    }
  }

  @override
  bool shouldRepaint(_ProjectionCanvasPainter oldDelegate) {
    return points != oldDelegate.points || imageBytes != oldDelegate.imageBytes;
  }
}