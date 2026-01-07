import 'package:flutter/material.dart';

class ImageOverlay extends StatelessWidget {
  final String? imagePath;

  const ImageOverlay({
    Key? key,
    this.imagePath,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    if (imagePath == null) {
      return Container();
    }

    return Positioned.fill(
      child: Opacity(
        opacity: 0.7,
        child: Image.file(
          File(imagePath!),
          fit: BoxFit.contain,
          errorBuilder: (context, error, stackTrace) {
            return Center(
              child: Text(
                'Failed to load image',
                style: TextStyle(color: Colors.red),
              ),
            );
          },
        ),
      ),
    );
  }
}