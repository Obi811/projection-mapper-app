import 'package:flutter/material.dart';
import 'dart:io';
import '../models/control_point.dart';

class ProjectionCanvas extends StatefulWidget {
  final List<ControlPoint> points;
  final ValueChanged<ControlPoint> onPointUpdated;
  final ValueChanged<String> onPointSelected;
  final String? imagePath;

  const ProjectionCanvas({
    Key? key,
    required this.points,
    required this.onPointUpdated,
    required this.onPointSelected,
    this.imagePath,
  }) : super(key: key);

  @override
  State<ProjectionCanvas> createState() => _ProjectionCanvasState();
}

class _ProjectionCanvasState extends State<ProjectionCanvas> {
  ControlPoint? _draggingPoint;
  Offset _dragOffset = Offset.zero;

  void _handleDragStart(ControlPoint point, Offset localPosition) {
    setState(() {
      _draggingPoint = point;
      _dragOffset = Offset(
        localPosition.dx - point.x,
        localPosition.dy - point.y,
      );
      widget.onPointSelected(point.id);
    });
  }

  void _handleDragUpdate(Offset localPosition) {
    if (_draggingPoint == null) return;

    final newX = (localPosition.dx - _dragOffset.dx).clamp(0.0, 1.0);
    final newY = (localPosition.dy - _dragOffset.dy).clamp(0.0, 1.0);

    widget.onPointUpdated(
      _draggingPoint!.copyWith(x: newX, y: newY),
    );
  }

  void _handleDragEnd() {
    setState(() {
      _draggingPoint = null;
    });
  }

  void _handleTap(Offset localPosition) {
    for (var point in widget.points) {
      final pointCenter = _pointToOffset(point, context);
      final distance = (pointCenter - localPosition).distance;
      if (distance <= point.radius) {
        widget.onPointSelected(point.id);
        return;
      }
    }
    widget.onPointSelected('');
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        return GestureDetector(
          onPanStart: (details) {
            final localPosition = _globalToLocal(
              details.globalPosition,
              constraints,
            );
            for (final point in widget.points) {
              final pointCenter = _pointToOffset(point, context);
              final distance = (pointCenter - localPosition).distance;
              if (distance <= point.radius) {
                _handleDragStart(point, localPosition);
                break;
              }
            }
          },
          onPanUpdate: (details) {
            if (_draggingPoint != null) {
              final localPosition = _globalToLocal(
                details.globalPosition,
                constraints,
              );
              _handleDragUpdate(localPosition);
            }
          },
          onPanEnd: (_) => _handleDragEnd(),
          onTapDown: (details) {
            final localPosition = _globalToLocal(
              details.globalPosition,
              constraints,
            );
            _handleTap(localPosition);
          },
          child: Stack(
            children: [
              Container(
                color: Colors.black,
              ),
              if (widget.imagePath != null && File(widget.imagePath!).existsSync())
                Positioned.fill(
                  child: Opacity(
                    opacity: 0.7,
                    child: Image.file(
                      File(widget.imagePath!),
                      fit: BoxFit.contain,
                    ),
                  ),
                ),
              CustomPaint(
                size: Size(constraints.maxWidth, constraints.maxHeight),
                painter: _CanvasPainter(
                  points: widget.points,
                  draggingPointId: _draggingPoint?.id,
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Offset _globalToLocal(Offset global, BoxConstraints constraints) {
    final renderBox = context.findRenderObject() as RenderBox;
    final local = renderBox.globalToLocal(global);
    return Offset(
      local.dx / constraints.maxWidth,
      local.dy / constraints.maxHeight,
    );
  }

  Offset _pointToOffset(ControlPoint point, BuildContext context) {
    final renderBox = context.findRenderObject() as RenderBox;
    final size = renderBox.size;
    return Offset(
      point.x * size.width,
      point.y * size.height,
    );
  }
}

class _CanvasPainter extends CustomPainter {
  final List<ControlPoint> points;
  final String? draggingPointId;

  _CanvasPainter({
    required this.points,
    this.draggingPointId,
  });

  @override
  void paint(Canvas canvas, Size size) {
    if (points.length >= 3) {
      final borderPaint = Paint()
        ..color = Colors.blue.withOpacity(0.5)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2.0;

      final path = Path();
      if (points.isNotEmpty) {
        path.moveTo(points[0].x * size.width, points[0].y * size.height);
        for (var i = 1; i < points.length; i++) {
          path.lineTo(points[i].x * size.width, points[i].y * size.height);
        }
        path.close();
        canvas.drawPath(path, borderPaint);
      }
    }

    for (final point in points) {
      final isDragging = point.id == draggingPointId;
      final isSelected = point.isSelected;
      
      final pointPaint = Paint()
        ..color = isDragging
            ? Colors.red
            : isSelected
                ? Colors.amber
                : Colors.white
        ..style = PaintingStyle.fill;

      final pointCenter = Offset(
        point.x * size.width,
        point.y * size.height,
      );

      canvas.drawCircle(pointCenter, point.radius, pointPaint);

      final borderPaint = Paint()
        ..color = Colors.black
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2.0;

      canvas.drawCircle(pointCenter, point.radius, borderPaint);

      if (point.label.isNotEmpty) {
        final textPainter = TextPainter(
          text: TextSpan(
            text: point.label,
            style: TextStyle(
              color: Colors.black,
              fontSize: 14,
              fontWeight: FontWeight.bold,
            ),
          ),
          textDirection: TextDirection.ltr,
        );
        textPainter.layout();
        textPainter.paint(
          canvas,
          pointCenter.translate(
            -textPainter.width / 2,
            -textPainter.height / 2,
          ),
        );
      }
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}