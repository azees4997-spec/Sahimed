package com.sahimed.app

import io.flutter.embedding.android.FlutterFragmentActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugins.GeneratedPluginRegistrant
import io.flutter.embedding.android.FlutterActivityLaunchConfigs

import android.os.Bundle
import android.content.Context

import androidx.core.view.WindowCompat

class MainActivity : FlutterFragmentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // [ANDROID 15 FIX] Enable edge-to-edge display
        WindowCompat.setDecorFitsSystemWindows(window, false)
        
        // [MASTER TOKEN FIX] Force a specific debug secret for emulator and physical device testing
        val prefs = getSharedPreferences("com.google.firebase.appcheck.debug.DebugAppCheckProvider", Context.MODE_PRIVATE)
        prefs.edit().putString("debug_secret", "a9771222-fcb4-4464-983b-fe5d95c9c659").apply()
    }

    override fun getBackgroundMode(): FlutterActivityLaunchConfigs.BackgroundMode {
        return FlutterActivityLaunchConfigs.BackgroundMode.transparent
    }
}
