import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

class LocationService {
  static const String _addressKey = 'user_saved_address';

  Future<Position?> getCurrentPosition() async {
    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) return null;

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) return null;
      }
      return await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
        ),
      );
    } catch (e) {
      return null;
    }
  }

  Future<void> saveAddress(String address) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_addressKey, address);
  }

  Future<String?> getSavedAddress() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_addressKey);
  }

  Future<bool> hasSavedAddress() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.containsKey(_addressKey);
  }

  Future<String> getCurrentAddress() async {
    try {
      // 1. Check if we have a saved address first
      final saved = await getSavedAddress();
      if (saved != null) return saved;

      // 2. Otherwise, fetch via GPS
      bool serviceEnabled;
      LocationPermission permission;

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

      Position position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
        ),
      );

      List<Placemark> placemarks = await placemarkFromCoordinates(
        position.latitude,
        position.longitude,
      );

      if (placemarks.isNotEmpty) {
        Placemark place = placemarks[0];
        
        // Prefer more specific names to avoid "Unknown City"
        String? city = place.locality ?? 
                      place.subLocality ?? 
                      place.subAdministrativeArea ?? 
                      place.name;
        String? state = place.administrativeArea;
        
        String address = '';
        if (city != null && city.isNotEmpty) {
          address = city;
        }
        if (state != null && state.isNotEmpty) {
          if (address.isNotEmpty) address += ', ';
          address += state;
        }

        return address.isEmpty ? 'Tap to set location' : address;
      }
    } catch (e) {
      debugPrint('Error getting location: $e');
      return 'Tap to set location';
    }
    return 'Location not found';
  }
}
