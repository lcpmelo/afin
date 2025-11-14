package com.afinador.audiocapture;

// Imports de Permissão e Promise
import android.Manifest;
import android.content.pm.PackageManager;
import androidx.core.content.ContextCompat;
import com.facebook.react.bridge.Promise;

import androidx.annotation.NonNull;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

public class AudioCaptureModule extends ReactContextBaseJavaModule {
    private static final String MODULE_NAME = "AudioCapture";
    private AudioRecorderManager recorderManager;
    private final FrequencyDetector frequencyDetector;
    private final ReactApplicationContext reactContext;
    private static final double AMPLITUDE_THRESHOLD = 500.0;

    public AudioCaptureModule(@NonNull ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        this.frequencyDetector = new FrequencyDetector();
    }

    @NonNull
    @Override
    public String getName() {
        return MODULE_NAME;
    }

    @ReactMethod
    public void start(Promise promise) {

        // Verifica a permissão (RNF1)
        if (ContextCompat.checkSelfPermission(this.reactContext, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            promise.reject("E_NO_PERMISSION", "Permissão para RECORD_AUDIO negada.");
            return;
        }

        if (recorderManager != null && recorderManager.isRecording()) {
            promise.resolve(true);
            return;
        }

        AudioRecorderManager.AudioDataListener listener = (buffer, readSize) -> {
            if (!isSignalStrongEnough(buffer, readSize)) {
                sendFrequencyEvent(0.0); // Envia 0 (ou nem envia) se for só ruído
                return; // Para a execução aqui
            }

            double frequency = frequencyDetector.detectFrequency(buffer, readSize);
            android.util.Log.d("AudioCapture", "Frequência detectada: " + frequency);
            sendFrequencyEvent(frequency);
        };

        try {
            recorderManager = new AudioRecorderManager(listener);
            recorderManager.startRecording();
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("E_START_FAILED", "Não foi possível iniciar a gravação.", e);
        }
    }

    @ReactMethod
    public void stop() {
        if (recorderManager != null) {
            recorderManager.stopRecording();
            recorderManager = null;
        }
    }

    // ADICIONA O @SuppressWarnings ---
    @SuppressWarnings("deprecation")
    private void sendFrequencyEvent(double frequency) {
        // Usa o contexto salvo em vez de getReactApplicationContext()
        if (this.reactContext.hasActiveCatalystInstance()) {
            WritableMap params = Arguments.createMap();
            params.putDouble("frequency", frequency);
            this.reactContext
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit("onFrequency", params); // O nome do evento é "onFrequency"
        }
    }

    @ReactMethod
    public void setInstrumentMode(String mode) {
        if (frequencyDetector == null) return;

        if ("Guitarra".equals(mode) || "Baixo".equals(mode) || "Violão".equals(mode)) {
            frequencyDetector.setMode(FrequencyDetector.DetectionMode.HPS);
        } else {
            frequencyDetector.setMode(FrequencyDetector.DetectionMode.PEAK_PICKING);
        }
    }

    private boolean isSignalStrongEnough(short[] buffer, int readSize) {
        if (readSize == 0) return false;

        double sumOfSquares = 0.0;
        for (int i = 0; i < readSize; i++) {
            sumOfSquares += buffer[i] * buffer[i];
        }
        // Calcula a média dos quadrados e tira a raiz (RMS)
        double rms = Math.sqrt(sumOfSquares / readSize);

        return rms > AMPLITUDE_THRESHOLD;
    }

    // ADICIONA O getConstants() ---
    @Override
    public java.util.Map<String, Object> getConstants() {
        final java.util.Map<String, Object> constants = new java.util.HashMap<>();
        // O JS vai ler "AudioCapture.ON_FREQUENCY_EVENT" e receber a string "onFrequency"
        constants.put("ON_FREQUENCY_EVENT", "onFrequency");
        return constants;
    }
}