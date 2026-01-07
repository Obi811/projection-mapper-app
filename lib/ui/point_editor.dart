import 'package:flutter/material.dart';
import '../models/control_point.dart';

class PointEditor extends StatefulWidget {
  final ControlPoint? point;
  final ValueChanged<ControlPoint> onPointUpdated;

  const PointEditor({
    Key? key,
    required this.point,
    required this.onPointUpdated,
  }) : super(key: key);

  @override
  State<PointEditor> createState() => _PointEditorState();
}

class _PointEditorState extends State<PointEditor> {
  late TextEditingController _xController;
  late TextEditingController _yController;
  late TextEditingController _labelController;

  @override
  void initState() {
    super.initState();
    _xController = TextEditingController();
    _yController = TextEditingController();
    _labelController = TextEditingController();
    _updateControllers();
  }

  @override
  void didUpdateWidget(PointEditor oldWidget) {
    super.didUpdateWidget(oldWidget);
    _updateControllers();
  }

  void _updateControllers() {
    if (widget.point != null) {
      _xController.text = widget.point!.x.toStringAsFixed(3);
      _yController.text = widget.point!.y.toStringAsFixed(3);
      _labelController.text = widget.point!.label;
    }
  }

  void _updatePoint() {
    if (widget.point != null) {
      final x = double.tryParse(_xController.text) ?? widget.point!.x;
      final y = double.tryParse(_yController.text) ?? widget.point!.y;
      
      widget.onPointUpdated(
        widget.point!.copyWith(
          x: x.clamp(0.0, 1.0),
          y: y.clamp(0.0, 1.0),
          label: _labelController.text,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    if (widget.point == null) {
      return Container(
        padding: EdgeInsets.all(16),
        child: Center(
          child: Text(
            'No point selected',
            style: TextStyle(color: Colors.grey[600]),
          ),
        ),
      );
    }

    return Container(
      padding: EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Point Editor',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          SizedBox(height: 16),
          Text(
            'ID: ${widget.point!.id}',
            style: TextStyle(color: Colors.grey[400]),
          ),
          SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _xController,
                  decoration: InputDecoration(
                    labelText: 'X Position',
                    labelStyle: TextStyle(color: Colors.grey[400]),
                    border: OutlineInputBorder(),
                    suffixText: ' (0-1)',
                  ),
                  style: TextStyle(color: Colors.white),
                  onChanged: (_) => _updatePoint(),
                ),
              ),
              SizedBox(width: 12),
              Expanded(
                child: TextField(
                  controller: _yController,
                  decoration: InputDecoration(
                    labelText: 'Y Position',
                    labelStyle: TextStyle(color: Colors.grey[400]),
                    border: OutlineInputBorder(),
                    suffixText: ' (0-1)',
                  ),
                  style: TextStyle(color: Colors.white),
                  onChanged: (_) => _updatePoint(),
                ),
              ),
            ],
          ),
          SizedBox(height: 12),
          TextField(
            controller: _labelController,
            decoration: InputDecoration(
              labelText: 'Label',
              labelStyle: TextStyle(color: Colors.grey[400]),
              border: OutlineInputBorder(),
            ),
            style: TextStyle(color: Colors.white),
            onChanged: (_) => _updatePoint(),
          ),
          SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Position: (${widget.point!.x.toStringAsFixed(3)}, ${widget.point!.y.toStringAsFixed(3)})',
                style: TextStyle(color: Colors.grey[400]),
              ),
              ElevatedButton(
                onPressed: () {
                  widget.onPointUpdated(
                    widget.point!.copyWith(
                      x: 0.5,
                      y: 0.5,
                    ),
                  );
                },
                child: Text('Center'),
              ),
            ],
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _xController.dispose();
    _yController.dispose();
    _labelController.dispose();
    super.dispose();
  }
}