import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart';
import 'package:flutter/foundation.dart';

class LocationService {
  Future<String> getCurrentAddress() async {
    try {
      bool serviceEnabled;
      LocationPermission permission;

      // Test if location services are enabled.
      serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        return 'Location services disabled';
      }

      permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          return 'Location permissions denied';
        }
      }

      if (permission == LocationPermission.deniedForever) {
        return 'Location permissions permanently denied';
      }

      // When we reach here, permissions are granted and we can
      // continue accessing the position of the device.
      Position position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );

      List<Placemark> placemarks = await placemarkFromCoordinates(
        position.latitude,
        position.longitude,
      );

      if (placemarks.isNotEmpty) {
        Placemark place = placemarks[0];
        // Combine parts of the address for a concise top-bar display
        String address = '${place.subLocality ?? place.locality}, ${place.administrativeArea}';
        if (address.startsWith(', ')) address = address.substring(2);
        return address.isEmpty ? 'Unknown Location' : address;
      }
    } catch (e) {
      debugPrint('Error getting location: $e');
      return 'Tap to set location';
    }
    return 'Location not found';
  }
}
