import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart'
    show defaultTargetPlatform, kIsWeb, TargetPlatform;

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) {
      return web;
    }
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        return ios;
      case TargetPlatform.macOS:
        throw UnsupportedError(
          'DefaultFirebaseOptions have not been configured for macos - '
          'you can reconfigure this by running the FlutterFire CLI again.',
        );
      case TargetPlatform.windows:
        throw UnsupportedError(
          'DefaultFirebaseOptions have not been configured for windows - '
          'you can reconfigure this by running the FlutterFire CLI again.',
        );
      case TargetPlatform.linux:
        throw UnsupportedError(
          'DefaultFirebaseOptions have not been configured for linux - '
          'you can reconfigure this by running the FlutterFire CLI again.',
        );
      default:
        throw UnsupportedError(
          'DefaultFirebaseOptions are not supported for this platform.',
        );
    }
  }

  static const FirebaseOptions web = FirebaseOptions(
    apiKey: 'AIzaSyBZjPHZjLz6TgXIAkqQ3uCsaAfO0HUj4qc',
    appId: '1:503492891847:web:8db8fc212c714cfb5c9ae2',
    messagingSenderId: '503492891847',
    projectId: 'studio-9756314138-8403b',
    authDomain: 'studio-9756314138-8403b.firebaseapp.com',
    storageBucket: 'studio-9756314138-8403b.firebasestorage.app',
    databaseURL: 'https://studio-9756314138-8403b-default-rtdb.asia-southeast1.firebasedatabase.app',
  );

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyBZjPHZjLz6TgXIAkqQ3uCsaAfO0HUj4qc',
    appId: '1:503492891847:android:343468087943cc979c09ee', // Found from standard conventions or needs real config
    messagingSenderId: '503492891847',
    projectId: 'studio-9756314138-8403b',
    storageBucket: 'studio-9756314138-8403b.firebasestorage.app',
    databaseURL: 'https://studio-9756314138-8403b-default-rtdb.asia-southeast1.firebasedatabase.app',
  );

  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'AIzaSyBZjPHZjLz6TgXIAkqQ3uCsaAfO0HUj4qc',
    appId: '1:503492891847:ios:c48972e39e623a969c09ee', // Found from standard conventions or needs real config
    messagingSenderId: '503492891847',
    projectId: 'studio-9756314138-8403b',
    storageBucket: 'studio-9756314138-8403b.firebasestorage.app',
    databaseURL: 'https://studio-9756314138-8403b-default-rtdb.asia-southeast1.firebasedatabase.app',
    iosBundleId: 'com.sahimed.sahimed_app',
  );
}
