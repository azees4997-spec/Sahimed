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
    databaseURL:
        'https://studio-9756314138-8403b-default-rtdb.asia-southeast1.firebasedatabase.app',
    storageBucket: 'studio-9756314138-8403b.firebasestorage.app',
    measurementId: 'G-WQPC12CLH3',
  );

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyDmytFXM4JPh0BwF7vWZzRZ5i5C6tqa8hA',
    appId: '1:503492891847:android:cde38602bb8fcf615c9ae2',
    messagingSenderId: '503492891847',
    projectId: 'studio-9756314138-8403b',
    databaseURL:
        'https://studio-9756314138-8403b-default-rtdb.asia-southeast1.firebasedatabase.app',
    storageBucket: 'studio-9756314138-8403b.firebasestorage.app',
  );

  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'AIzaSyADVmlVYeriFgPerxD5VcuXTHwiCMd9vRk',
    appId: '1:503492891847:ios:ecc273d8d3a460265c9ae2',
    messagingSenderId: '503492891847',
    projectId: 'studio-9756314138-8403b',
    databaseURL:
        'https://studio-9756314138-8403b-default-rtdb.asia-southeast1.firebasedatabase.app',
    storageBucket: 'studio-9756314138-8403b.firebasestorage.app',
    androidClientId:
        '503492891847-dmbkgn77veikue59unahhmkbni2ojp9d.apps.googleusercontent.com',
    iosClientId:
        '503492891847-fr2nvva5cdkuijn9nvdllvbb3e8tl1kj.apps.googleusercontent.com',
    iosBundleId: 'com.sahimed.sahimedMobile',
  );
}
