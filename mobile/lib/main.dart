import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_app_check/firebase_app_check.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_displaymode/flutter_displaymode.dart';
import 'core/providers/cart_provider.dart';
import 'core/providers/navigation_provider.dart';
import 'features/auth/screens/splash_screen.dart';
import 'features/auth/screens/login_screen.dart';
import 'firebase_options.dart';
import 'core/layout/main_layout.dart';
import 'core/widgets/global_error_handler.dart';
import 'core/services/reminder_service.dart';
import 'core/services/notification_service.dart';
import 'core/services/deep_link_service.dart';
import 'package:in_app_update/in_app_update.dart';

final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // [120HZ] Request the highest supported refresh rate before the first frame.
  // Uses flutter_displaymode package — gracefully handles devices that don't support high refresh.
  try {
    await FlutterDisplayMode.setHighRefreshRate();
  } catch (_) {
    // Non-critical — safe to ignore on unsupported devices
  }

  await ReminderService.init();
  DeepLinkService().init();

  try {
    if (Firebase.apps.isEmpty) {
      await Firebase.initializeApp(
        options: DefaultFirebaseOptions.currentPlatform,
      );
    }

    // [SECURITY REFACTOR] Initialize App Check with Play Integrity for Production
    // [SECURITY REFACTOR] Initialize App Check - Non-blocking to speed up launch
    FirebaseAppCheck.instance.activate(
      providerAndroid: kDebugMode
          ? const AndroidDebugProvider()
          : const AndroidPlayIntegrityProvider(),
      providerApple: const AppleDeviceCheckProvider(),
    ).catchError((e) => debugPrint("App Check error: $e"));

    // Initializing reCAPTCHA config for Phone Auth fallback (Web Only)
    if (kIsWeb) {
      await FirebaseAuth.instance.initializeRecaptchaConfig();
    }

    // Optimization: Expand Image Cache for smoother scrolling & better performance
    // Performance & Memory Tuning
    const double maxCacheSize = 50 * 1024 * 1024; // 50MB
    PaintingBinding.instance.imageCache.maximumSizeBytes = maxCacheSize.toInt();
    PaintingBinding.instance.imageCache.maximumSize = 100; // Max 100 images

    // 4. Initialize Order Notifications (FCM + Local)
    await NotificationService.init();

    debugPrint("Firebase Security: App Check & Auth Config initialized.");
  } catch (e) {
    debugPrint("Firebase initialization error: $e");
  }

  // Global Error Handling: Prevent Red Screen of Death in Production
  ErrorWidget.builder = (FlutterErrorDetails details) {
    if (kDebugMode) return ErrorWidget(details.exception);
    return const SizedBox.shrink(); // Will be handled by GlobalErrorHandler
  };

  runApp(const SahimedApp());
}


class SahimedApp extends StatefulWidget {
  const SahimedApp({super.key});

  @override
  State<SahimedApp> createState() => _SahimedAppState();
}

class _SahimedAppState extends State<SahimedApp> {
  late Future<List<dynamic>> _initFuture;

  @override
  void initState() {
    super.initState();
    _initFuture = _initialize();
    
    // Check for updates in production
    if (!kDebugMode) {
      _checkForUpdate();
    }
  }

  Future<void> _checkForUpdate() async {
    try {
      final info = await InAppUpdate.checkForUpdate();
      if (info.updateAvailability == UpdateAvailability.updateAvailable) {
        // [UPDATE REFACTOR] Enforce In-App Update flow to prevent redirecting to Play Store
        // We use immediate update for critical medicine safety and version parity.
        // This keeps the user INSIDE the app during the update process.
        await InAppUpdate.performImmediateUpdate().catchError((e) {
          debugPrint("Immediate Update Error: $e");
          return AppUpdateResult.inAppUpdateFailed;
        });
      }
    } catch (e) {
      debugPrint("In-App Update Check Failed: $e");
    }
  }

  Future<List<dynamic>> _initialize() async {
    return Future.wait([
      // Minimum splash time for premium feel at start
      Future.delayed(const Duration(milliseconds: 2800)),
      // Actual auth check
      FirebaseAuth.instance.authStateChanges().first.timeout(
            const Duration(seconds: 5),
            onTimeout: () => null,
          ),
    ]);
  }

  @override
  Widget build(BuildContext context) {
    return GlobalErrorHandler(
      child: MultiProvider(
        providers: [
          ChangeNotifierProvider(create: (_) => CartProvider()),
          ChangeNotifierProvider(create: (_) => NavigationProvider()),
        ],
        child: MaterialApp(
          navigatorKey: navigatorKey,
          title: 'Sahimed',
          debugShowCheckedModeBanner: false,
          // [120HZ] Apply bouncing physics & suppress Android overscroll glow app-wide
          scrollBehavior: _SahimedScrollBehavior(),
          theme: ThemeData(
            useMaterial3: true,
            colorScheme: ColorScheme.fromSeed(
              seedColor: const Color(0xFF2E5BFF),
              brightness: Brightness.light,
            ),
            textTheme: GoogleFonts.outfitTextTheme(),
          ),
          home: FutureBuilder<List<dynamic>>(
            future: _initFuture,
            builder: (context, snapshot) {
              // Always show splash while waiting
              if (snapshot.connectionState == ConnectionState.waiting) {
                return const SplashScreen();
              }
              
              // Handle potential errors by defaulting to login
              if (snapshot.hasError) {
                debugPrint("App Startup Error: ${snapshot.error}");
                return const LoginScreen();
              }

              final user = snapshot.data?[1] as User?;
              if (user != null) {
                return const MainLayout();
              }
              return const LoginScreen();
            },
          ),
        ),
      ),
    );
  }
}

/// [120HZ] Global scroll behavior: smooth bouncing physics, no Android glow overscroll.
class _SahimedScrollBehavior extends MaterialScrollBehavior {
  @override
  ScrollPhysics getScrollPhysics(BuildContext context) =>
      const BouncingScrollPhysics(parent: AlwaysScrollableScrollPhysics());

  @override
  Widget buildOverscrollIndicator(
    BuildContext context,
    Widget child,
    ScrollableDetails details,
  ) =>
      child; // Suppress Android glow — feels cleaner at high refresh rates
}
