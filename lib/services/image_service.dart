import 'dart:ui' as ui;
import 'dart:io';
import 'package:flutter/services.dart';

class ImageService {
  static Future<ui.Image?> loadImage(String? path) async {
    if (path == null || !File(path).existsSync()) {
      return null;
    }

    try {
      final data = await File(path).readAsBytes();
      final codec = await ui.instantiateImageCodec(data);
      final frame = await codec.getNextFrame();
      return frame.image;
    } catch (e) {
      print('Failed to load image: $e');
      return null;
    }
  }

  static Future<ui.Image?> loadImageFromAssets(String path) async {
    try {
      final byteData = await rootBundle.load(path);
      final bytes = byteData.buffer.asUint8List();
      final codec = await ui.instantiateImageCodec(bytes);
      final frame = await codec.getNextFrame();
      return frame.image;
    } catch (e) {
      print('Failed to load image from assets: $e');
      return null;
    }
  }
}