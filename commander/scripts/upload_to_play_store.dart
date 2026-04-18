import 'dart:io';
import 'package:googleapis/androidpublisher/v3.dart';
import 'package:googleapis_auth/auth_io.dart';
import 'package:path/path.dart' as p;

void main() async {
  final serviceAccountPath = 'c:/Sahimed/commander/google_play_service_account.json';
  final packageName = 'com.sahimed.app';
  final aabPath = 'c:/Sahimed/mobile/build/app/outputs/bundle/release/app-release.aab';

  print('🛸 Antigravity: Starting Play Store Push...');

  if (!File(serviceAccountPath).existsSync()) {
    print('❌ Service Account File not found at $serviceAccountPath');
    exit(1);
  }

  if (!File(aabPath).existsSync()) {
    print('❌ AAB File not found at $aabPath. Please run build first.');
    exit(1);
  }

  final accountJson = File(serviceAccountPath).readAsStringSync();
  final credentials = ServiceAccountCredentials.fromJson(accountJson);
  final client = await clientViaServiceAccount(credentials, [AndroidPublisherApi.androidpublisherScope]);

  try {
    final api = AndroidPublisherApi(client);
    
    print('📂 Starting a new edit session...');
    final edit = await api.edits.insert(AppEdit(), packageName);
    final editId = edit.id!;

    print('📦 Uploading App Bundle ($aabPath)...');
    final bundleFile = File(aabPath);
    final bundle = await api.edits.bundles.upload(
      packageName,
      editId,
      uploadMedia: Media(bundleFile.openRead(), bundleFile.lengthSync()),
    );
    print('✅ Uploaded Version Code: ${bundle.versionCode}');

    print('🛤️ Assigning to Internal Track...');
    await api.edits.tracks.update(
      Track(
        track: 'internal',
        releases: [
          TrackRelease(
            versionCodes: [bundle.versionCode.toString()],
            status: 'completed',
          ),
        ],
      ),
      packageName,
      editId,
      'internal',
    );

    print('🚀 Committing changes to Play Console...');
    await api.edits.commit(packageName, editId);
    print('✨ Deployment Complete! Your app is now in the Internal Testing track.');

  } catch (e) {
    print('❌ Error during deployment: $e');
    exit(1);
  } finally {
    client.close();
  }
}
