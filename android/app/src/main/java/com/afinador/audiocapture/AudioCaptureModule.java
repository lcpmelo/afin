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
    private final ReactApplicationContext reactContext; // --- CORREÇÃO: Salva o contexto

    public AudioCaptureModule(@NonNull ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext; // --- CORREÇÃO: Salva o contexto
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
            promise.resolve(true); // Já está gravando
            return;
        }

        AudioRecorderManager.AudioDataListener listener = (buffer, readSize) -> {
            double frequency = frequencyDetector.detectFrequency(buffer, readSize);
            //android.util.Log.d("AudioCapture", "Frequência detectada: " + frequency);
            sendFrequencyEvent(frequency);
        };

        try {
            recorderManager = new AudioRecorderManager(listener);
            recorderManager.startRecording();
            promise.resolve(true); // Sucesso!
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

    // ADICIONA O getConstants() ---
    @Override
    public java.util.Map<String, Object> getConstants() {
        final java.util.Map<String, Object> constants = new java.util.HashMap<>();
        // O JS vai ler "AudioCapture.ON_FREQUENCY_EVENT" e receber a string "onFrequency"
        constants.put("ON_FREQUENCY_EVENT", "onFrequency");
        return constants;
    }
}