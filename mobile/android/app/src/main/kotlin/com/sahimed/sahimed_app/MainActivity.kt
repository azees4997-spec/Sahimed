package com.sahimed.sahimed_app

import io.flutter.embedding.android.FlutterFragmentActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugins.GeneratedPluginRegistrant
import io.flutter.embedding.android.FlutterActivityLaunchConfigs

class MainActivity : FlutterFragmentActivity() {
    // Modern Flutter automatically handles plugin registration. 
    // Manual registration here can cause a deadlock/hang.

    override fun getBackgroundMode(): FlutterActivityLaunchConfigs.BackgroundMode {
        return FlutterActivityLaunchConfigs.BackgroundMode.transparent
    }
}
