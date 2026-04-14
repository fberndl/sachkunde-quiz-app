# 🏛️ Wien Quiz – Komplette Ubuntu 24.04 Anleitung

## ══════════════════════════════════════
## SCHRITT 1: System-Updates & Java
## ══════════════════════════════════════

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git unzip wget openjdk-17-jdk
```

Java-Version prüfen:
```bash
java -version
# Ausgabe muss sein: openjdk 17...
```

JAVA_HOME setzen:
```bash
echo 'export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64' >> ~/.bashrc
echo 'export PATH=$PATH:$JAVA_HOME/bin' >> ~/.bashrc
source ~/.bashrc
```

## ══════════════════════════════════════
## SCHRITT 2: Android Studio installieren
## ══════════════════════════════════════

Android Studio herunterladen:
```bash
cd ~/Downloads
wget https://redirector.gvt1.com/edgedl/android/studio/ide-zips/2023.3.1.18/android-studio-2023.3.1.18-linux.tar.gz
```

Oder manuell von: https://developer.android.com/studio → Download for Linux

Entpacken und installieren:
```bash
sudo tar -xzf ~/Downloads/android-studio-*.tar.gz -C /opt/
sudo ln -s /opt/android-studio/bin/studio.sh /usr/local/bin/android-studio
```

Android Studio starten:
```bash
android-studio &
```

### In Android Studio beim Setup-Wizard:
1. "Standard" Installation wählen → Next
2. SDK-Komponenten werden automatisch installiert
3. Warten bis alles heruntergeladen ist (~3-5 GB)

### SDK-Pfad setzen:
```bash
echo 'export ANDROID_HOME=$HOME/Android/Sdk' >> ~/.bashrc
echo 'export PATH=$PATH:$ANDROID_HOME/emulator' >> ~/.bashrc
echo 'export PATH=$PATH:$ANDROID_HOME/platform-tools' >> ~/.bashrc
echo 'export PATH=$PATH:$ANDROID_HOME/tools' >> ~/.bashrc
source ~/.bashrc
```

### Prüfen ob adb funktioniert:
```bash
adb --version
# Ausgabe: Android Debug Bridge version...
```

## ══════════════════════════════════════
## SCHRITT 3: Node.js installieren
## ══════════════════════════════════════

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version   # muss v22.x zeigen
npm --version    # muss 10.x zeigen
```

## ══════════════════════════════════════
## SCHRITT 4: React Native CLI installieren
## ══════════════════════════════════════

```bash
sudo npm install -g react-native-cli
```

## ══════════════════════════════════════
## SCHRITT 5: Projekt einrichten
## ══════════════════════════════════════

ZIP in Home-Verzeichnis kopieren, dann:
```bash
cd ~
unzip wien-quiz-rn.zip
cd wien-quiz-rn
npm install
```

## ══════════════════════════════════════
## SCHRITT 6: Keystore erstellen (einmalig)
## ══════════════════════════════════════

Für Release-APK brauchst du einen Signierungsschlüssel:
```bash
cd ~/wien-quiz-rn/android/app
keytool -genkeypair \
  -v \
  -storetype PKCS12 \
  -keystore my-upload-key.keystore \
  -alias my-key-alias \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

Bei den Fragen:
- Passwort: `wienquiz123` (2x eingeben)
- Vorname/Nachname: z.B. `Wien Quiz`
- Organisation: Enter drücken (leer lassen)
- Ort, Bundesland, Land: Enter drücken
- Am Ende: `ja` eingeben

## ══════════════════════════════════════
## SCHRITT 7: APK bauen
## ══════════════════════════════════════

### Option A: Debug-APK (zum Testen, schneller)
```bash
cd ~/wien-quiz-rn/android
./gradlew assembleDebug
```

APK liegt dann unter:
```
~/wien-quiz-rn/android/app/build/outputs/apk/debug/app-debug.apk
```

### Option B: Release-APK (fertige App)
```bash
cd ~/wien-quiz-rn/android
./gradlew assembleRelease
```

APK liegt dann unter:
```
~/wien-quiz-rn/android/app/build/outputs/apk/release/app-release.apk
```

## ══════════════════════════════════════
## SCHRITT 8: APK auf Android installieren
## ══════════════════════════════════════

### Per USB-Kabel:
1. Handy per USB anschließen
2. Am Handy: USB-Debugging aktivieren (Entwickleroptionen)
3. Dann:
```bash
adb install ~/wien-quiz-rn/android/app/build/outputs/apk/debug/app-debug.apk
```

### Per Dateiübertragung:
1. APK-Datei auf das Handy kopieren (USB, Bluetooth, Google Drive...)
2. Am Handy unter Einstellungen → Apps → Unbekannte Quellen erlauben
3. APK-Datei auf dem Handy antippen → Installieren

## ══════════════════════════════════════
## BONUS: Emulator einrichten (optional)
## ══════════════════════════════════════

Falls du die App ohne echtes Handy testen willst:

In Android Studio:
1. Tools → Device Manager
2. "Create Device"
3. z.B. Pixel 6 auswählen → Next
4. Android 14 (API 34) Image downloaden → Next → Finish
5. Play-Button drücken → Emulator startet

Dann App auf Emulator installieren:
```bash
cd ~/wien-quiz-rn
npx react-native run-android
```

## ══════════════════════════════════════
## FEHLERBEHEBUNG
## ══════════════════════════════════════

### "SDK not found":
```bash
source ~/.bashrc
echo $ANDROID_HOME   # muss einen Pfad zeigen
```

### "Gradle build failed":
```bash
cd ~/wien-quiz-rn/android
./gradlew clean
./gradlew assembleDebug
```

### "JAVA_HOME not set":
```bash
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
```

### Node-Fehler beim Build:
```bash
cd ~/wien-quiz-rn
rm -rf node_modules
npm install
```

## ══════════════════════════════════════
## ALLES IN EINEM (Copy-Paste Block)
## ══════════════════════════════════════

```bash
# System + Java
sudo apt update && sudo apt upgrade -y && \
sudo apt install -y curl git unzip wget openjdk-17-jdk && \
echo 'export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64' >> ~/.bashrc && \
echo 'export PATH=$PATH:$JAVA_HOME/bin' >> ~/.bashrc && \
echo 'export ANDROID_HOME=$HOME/Android/Sdk' >> ~/.bashrc && \
echo 'export PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$ANDROID_HOME/tools' >> ~/.bashrc && \
source ~/.bashrc

# Node.js
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && \
sudo apt-get install -y nodejs && \
sudo npm install -g react-native-cli

# Projekt
cd ~ && unzip wien-quiz-rn.zip && cd wien-quiz-rn && npm install
```

Dann Android Studio manuell installieren (siehe Schritt 2),
danach Keystore erstellen (Schritt 6) und APK bauen (Schritt 7).
