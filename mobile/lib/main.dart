import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'core/theme/theme.dart';
import 'package:provider/provider.dart';
import 'core/providers/cart_provider.dart';
import 'features/auth/screens/splash_screen.dart';
import 'features/auth/screens/login_screen.dart';
import 'firebase_options.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  try {
    // Check if Firebase is already initialized by the native side
    if (Firebase.apps.isEmpty) {
      await Firebase.initializeApp(
        options: DefaultFirebaseOptions.currentPlatform,
      );
    }
  } catch (e) {
    debugPrint("Firebase initialization error: $e");
    // Fallback: Continue running the app even if Firebase init fails 
    // (though most features might need it).
  }
  
  runApp(const SahimedApp());
}

class SahimedApp extends StatelessWidget {
  const SahimedApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => CartProvider()),
      ],
      child: MaterialApp(
        title: 'Sahimed',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          useMaterial3: true,
          colorScheme: ColorScheme.fromSeed(
            seedColor: const Color(0xFF2E5BFF),
            brightness: Brightness.light,
          ),
          textTheme: GoogleFonts.outfitTextTheme(),
        ),
        home: const SplashScreen(),
      ),
    );
  }
}
