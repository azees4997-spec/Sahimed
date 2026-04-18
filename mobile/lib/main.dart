import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_app_check/firebase_app_check.dart';
import 'package:flutter/foundation.dart';
import 'core/providers/cart_provider.dart';
import 'features/auth/screens/splash_screen.dart';
import 'firebase_options.dart';
import 'core/layout/main_layout.dart';
import 'core/widgets/global_error_handler.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  try {
    if (Firebase.apps.isEmpty) {
      await Firebase.initializeApp(
        options: DefaultFirebaseOptions.currentPlatform,
      );
    }

    // [SECURITY REFACTOR] Initialize App Check with Play Integrity for Production
    await FirebaseAppCheck.instance.activate(
      androidProvider: kDebugMode ? AndroidProvider.debug : AndroidProvider.playIntegrity,
      appleProvider: AppleProvider.deviceCheck,
    );

    // Initializing reCAPTCHA config for Phone Auth fallback
    await FirebaseAuth.instance.initializeRecaptchaConfig();
    
    debugPrint("Firebase Security: App Check & Auth Config initialized.");
  } catch (e) {
    debugPrint("Firebase initialization error: $e");
  }
  
  runApp(const SahimedApp());
}

class SahimedApp extends StatelessWidget {
  const SahimedApp({super.key});

  @override
  Widget build(BuildContext context) {
    return GlobalErrorHandler(
      child: MultiProvider(
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
          home: StreamBuilder<User?>(
            stream: FirebaseAuth.instance.authStateChanges(),
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting) {
                return const SplashScreen();
              }
              if (snapshot.hasData) {
                return MainLayout();
              }
              return const SplashScreen();
            },
          ),
        ),
      ),
    );
  }
}
