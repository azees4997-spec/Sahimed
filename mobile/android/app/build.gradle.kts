import java.util.Properties
import java.io.FileInputStream
import java.io.File

plugins {
    id("com.android.application")
    id("kotlin-android")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
    id("com.google.gms.google-services")
    id("com.google.firebase.appdistribution")
}

android {
    namespace = "com.sahimed.app"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    val keystorePropertiesFile = rootProject.file("key.properties")
    val keystoreProperties = Properties()
    if (keystorePropertiesFile.exists()) {
        keystoreProperties.load(FileInputStream(keystorePropertiesFile))
    }

    signingConfigs {
        create("release") {
            keyAlias = keystoreProperties.getProperty("keyAlias")
            keyPassword = keystoreProperties.getProperty("keyPassword")
            storeFile = file(keystoreProperties.getProperty("storeFile"))
            storePassword = keystoreProperties.getProperty("storePassword")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
        isCoreLibraryDesugaringEnabled = true
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    lint {
        checkReleaseBuilds = false
        abortOnError = false
    }

    defaultConfig {
        applicationId = "com.sahimed.app"
        minSdk = flutter.minSdkVersion
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    buildTypes {
        getByName("debug") {
            firebaseAppDistribution {
                appId = "1:503492891847:android:cde38602bb8fcf615c9ae2"
                groups = "testers"
            }
        }
        release {
            signingConfig = signingConfigs.getByName("release")
            firebaseAppDistribution {
                appId = "1:503492891847:android:cde38602bb8fcf615c9ae2"
                groups = "testers"
            }
        }
    }
}

flutter {
    source = "../.."
}

dependencies {
    coreLibraryDesugaring("com.android.tools:desugar_jdk_libs:2.0.3")
    // [SECURITY FIX] Native dependencies for App Check providers
    implementation("com.google.firebase:firebase-appcheck-playintegrity")
    implementation("com.google.firebase:firebase-appcheck-debug")
}

project.afterEvaluate {
    tasks.forEach { task ->
        if (task.name.startsWith("process") && task.name.endsWith("Manifest")) {
            task.doLast {
                val buildDir = layout.buildDirectory.get().asFile
                val mergedManifestsDir = File(buildDir, "intermediates/merged_manifest")
                if (mergedManifestsDir.exists()) {
                    mergedManifestsDir.walkTopDown().forEach { file: File ->
                        if (file.name == "AndroidManifest.xml") {
                            var content = file.readText()
                            val regexes = listOf(
                                Regex("""<uses-permission[^>]*android:name="android\.permission\.READ_MEDIA_IMAGES"[^>]*/>"""),
                                Regex("""<uses-permission[^>]*android:name="android\.permission\.READ_MEDIA_VIDEO"[^>]*/>"""),
                                Regex("""<uses-permission[^>]*android:name="android\.permission\.READ_MEDIA_VISUAL_USER_SELECTED"[^>]*/>"""),
                                Regex("""<uses-permission[^>]*android:name="android\.permission\.READ_EXTERNAL_STORAGE"[^>]*/>"""),
                                Regex("""<uses-permission[^>]*android:name="android\.permission\.WRITE_EXTERNAL_STORAGE"[^>]*/>""")
                            )
                            var modified = false
                            regexes.forEach { regex ->
                                if (regex.containsMatchIn(content)) {
                                    content = content.replace(regex, "")
                                    modified = true
                                }
                            }
                            if (modified) {
                                file.writeText(content)
                                logger.lifecycle("[PlayStoreManifestFix] Stripped permissions from: ${file.absolutePath}")
                            }
                        }
                    }
                }
            }
        }
    }
}
