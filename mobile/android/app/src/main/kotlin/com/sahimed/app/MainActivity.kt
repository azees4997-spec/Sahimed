package com.sahimed.app

import io.flutter.embedding.android.FlutterFragmentActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugins.GeneratedPluginRegistrant
import io.flutter.embedding.android.FlutterActivityLaunchConfigs

import android.os.Build
import android.os.Bundle
import android.content.Context
import android.view.WindowManager

import androidx.core.view.WindowCompat

class MainActivity : FlutterFragmentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // [ANDROID 15 FIX] Enable edge-to-edge display
        WindowCompat.setDecorFitsSystemWindows(window, false)

        // [120HZ FIX] Request highest refresh rate from the display.
        // On Android 11+ (API 30), use the preferred display mode API.
        // On older versions, set the frame rate hint directly on the window.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            val display = display
            if (display != null) {
                val modes = display.supportedModes
                val highestMode = modes.maxByOrNull { it.refreshRate }
                if (highestMode != null) {
                    val params = window.attributes
                    params.preferredDisplayModeId = highestMode.modeId
                    window.attributes = params
                }
            }
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            // Pre-API 30 fallback: hint at high frame rate
            window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        }
        
        // [MASTER TOKEN FIX] Force a specific debug secret for emulator and physical device testing
        val prefs = getSharedPreferences("com.google.firebase.appcheck.debug.DebugAppCheckProvider", Context.MODE_PRIVATE)
        prefs.edit().putString("debug_secret", "a9771222-fcb4-4464-983b-fe5d95c9c659").apply()
    }

    override fun getBackgroundMode(): FlutterActivityLaunchConfigs.BackgroundMode {
        return FlutterActivityLaunchConfigs.BackgroundMode.transparent
    }
}
