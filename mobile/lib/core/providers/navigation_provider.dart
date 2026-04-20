import 'package:flutter/foundation.dart';

/// Simple provider so any pushed route can signal MainLayout to switch tabs.
class NavigationProvider with ChangeNotifier {
  int _currentIndex = 0;

  int get currentIndex => _currentIndex;

  void switchTab(int index) {
    _currentIndex = index;
    notifyListeners();
  }
}
