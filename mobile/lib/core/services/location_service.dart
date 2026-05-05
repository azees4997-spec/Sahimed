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
          timeLimit: Duration(seconds: 10),
        ),
      );
    } catch (e) {
      debugPrint('Error getting position: $e');
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

  Future<String> getCurrentAddress({bool forceRefresh = false}) async {
    try {
      // 1. Check if we have a saved address first (if not forcing refresh)
      if (!forceRefresh) {
        final saved = await getSavedAddress();
        if (saved != null) return saved;
      }

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
        return 'Permissions permanently denied';
      }

      Position position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 10),
        ),
      );

      List<Placemark> placemarks = await placemarkFromCoordinates(
        position.latitude,
        position.longitude,
      ).timeout(const Duration(seconds: 5));

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

        final finalAddr = address.isEmpty ? 'Tap to set location' : address;
        if (finalAddr != 'Tap to set location') {
          await saveAddress(finalAddr);
        }
        return finalAddr;
      }
    } catch (e) {
      debugPrint('Error getting location: $e');
      return 'Tap to set location';
    }
    return 'Location not found';
  }

  Future<Map<String, String>> getAddressFromLatLng(double lat, double lng) async {
    try {
      List<Placemark> placemarks = await placemarkFromCoordinates(lat, lng);
      if (placemarks.isNotEmpty) {
        Placemark place = placemarks[0];
        return {
          'suburb': place.subLocality ?? place.name ?? '',
          'street': place.street ?? '',
          'city': place.locality ?? '',
          'pincode': place.postalCode ?? '',
        };
      }
    } catch (e) {
      debugPrint('Error reverse geocoding: $e');
    }
    return {};
  }
}
