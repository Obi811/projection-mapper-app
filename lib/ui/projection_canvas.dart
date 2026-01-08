import 'package:flutter/material.dart';
import '../services/projection_service.dart';
import '../models/control_point.dart';  // WICHTIGER IMPORT HINZUFÜGEN

class ProjectionCanvas extends StatefulWidget {
  final ProjectionService service;
  
  const ProjectionCanvas({super.key, required this.service});
  
  @override
  _ProjectionCanvasState createState() => _ProjectionCanvasState();
}

class _ProjectionCanvasState extends State<ProjectionCanvas> {
  Offset? _draggingPoint;
  int? _draggingIndex;

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: widget.service,
      builder: (context, child) {
        final points = _getCurrentPoints();
        final imagePath = _getCurrentImagePath();
        
        return GestureDetector(
          onPanDown: (details) => _handlePanDown(details, points),
          onPanUpdate: (details) => _handlePanUpdate(details, points),
          onPanEnd: (details) => _handlePanEnd(),
          child: CustomPaint(
            size: Size.infinite,
            painter: _ProjectionCanvasPainter(
              points: points,
              imagePath: imagePath,
            ),
          ),
        );
      },
    );
  }

  List<ControlPoint> _getCurrentPoints() {
    if (widget.service.multiProject != null) {
      return widget.service.multiProject!.selectedSurface?.points ?? [];
    } else {
      return widget.service.projection?.points ?? [];
    }
  }

  String? _getCurrentImagePath() {
    if (widget.service.multiProject != null) {
      return widget.service.multiProject!.selectedSurface?.imagePath;
    } else {
      return widget.service.projection?.imagePath;
    }
  }

  void _handlePanDown(DragDownDetails details, List<ControlPoint> points) {
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

  void _handlePanUpdate(DragUpdateDetails details, List<ControlPoint> points) {
    if (_draggingIndex == null) return;
    
    final renderBox = context.findRenderObject() as RenderBox;
    final localPosition = renderBox.globalToLocal(details.globalPosition);
    final size = renderBox.size;
    
    setState(() {
      final newX = (localPosition.dx / size.width).clamp(0.0, 1.0);
      final newY = (localPosition.dy / size.height).clamp(0.0, 1.0);
      
      points[_draggingIndex!] = points[_draggingIndex!].copyWith(
        x: newX,
        y: newY,
      );
      
      _updatePoints(points);
      _draggingPoint = localPosition;
    });
  }

  void _handlePanEnd() {
    setState(() {
      _draggingIndex = null;
      _draggingPoint = null;
    });
  }

  void _updatePoints(List<ControlPoint> points) {
    widget.service.updatePoints(points);
  }
}

class _ProjectionCanvasPainter extends CustomPainter {
  final List<ControlPoint> points;
  final String? imagePath;

  _ProjectionCanvasPainter({
    required this.points,
    this.imagePath,
  });

  @override
  void paint(Canvas canvas, Size size) {
    _drawBackground(canvas, size);
    if (imagePath != null) {
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
  }

  void _drawImage(Canvas canvas, Size size) {
    // Hier würde die Bild-Logik kommen
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
    }
  }

  @override
  bool shouldRepaint(_ProjectionCanvasPainter oldDelegate) {
    return points != oldDelegate.points || imagePath != oldDelegate.imagePath;
  }
}