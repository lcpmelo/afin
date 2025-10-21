package com.afinador.audiocapture;

import android.media.AudioFormat;
import android.media.AudioRecord;
import android.media.MediaRecorder;
import android.util.Log;

public class AudioRecorderManager {
    private static final String TAG = "AudioRecorderManager";
    private static final int SAMPLE_RATE = 44100;
    private static final int CHANNEL_CONFIG = AudioFormat.CHANNEL_IN_MONO;
    private static final int AUDIO_FORMAT = AudioFormat.ENCODING_PCM_16BIT;

    private AudioRecord audioRecord;
    private Thread recordingThread;
    private volatile boolean isRecording = false; // volatile para garantir visibilidade entre threads
    private final AudioDataListener dataListener;

    // Interface para enviar dados de áudio brutos de volta para o Module
    public interface AudioDataListener {
        void onAudioDataReceived(short[] buffer, int readSize);
    }

    public AudioRecorderManager(AudioDataListener listener) {
        this.dataListener = listener;
    }

    public void startRecording() {
        if (isRecording) {
            Log.w(TAG, "Recording is already in progress.");
            return;
        }

        int bufferSize = AudioRecord.getMinBufferSize(SAMPLE_RATE, CHANNEL_CONFIG, AUDIO_FORMAT);
        // Garante que o bufferSize seja adequado para FFT, se necessário (potência de 2)
        // Por simplicidade aqui, usamos o mínimo, mas um buffer maior como 4096 é comum.
        int recordingBufferSize = Math.max(bufferSize, 4096);

        try {
            audioRecord = new AudioRecord(MediaRecorder.AudioSource.MIC,
                    SAMPLE_RATE, CHANNEL_CONFIG, AUDIO_FORMAT, recordingBufferSize);
        } catch (SecurityException e) {
            Log.e(TAG, "Permission to record audio not granted.", e);
            // TODO: Enviar um evento de erro para o JavaScript
            return;
        }


        isRecording = true;
        audioRecord.startRecording();

        recordingThread = new Thread(() -> {
            short[] buffer = new short[recordingBufferSize];
            while (isRecording) {
                int readSize = audioRecord.read(buffer, 0, buffer.length);
                if (readSize > 0 && dataListener != null) {
                    // Envia os dados brutos para o listener (que é o AudioCaptureModule)
                    dataListener.onAudioDataReceived(buffer, readSize);
                }
            }
        }, "AudioRecordingThread");

        recordingThread.start();
        Log.d(TAG, "Started recording.");
    }

    public void stopRecording() {
        if (!isRecording) {
            return;
        }

        isRecording = false; // Sinaliza para a thread parar o loop

        if (recordingThread != null) {
            try {
                recordingThread.join(); // Espera a thread terminar sua execução de forma limpa
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                Log.e(TAG, "Thread was interrupted.", e);
            }
            recordingThread = null;
        }

        if (audioRecord != null) {
            if (audioRecord.getState() == AudioRecord.STATE_INITIALIZED) {
                audioRecord.stop();
            }
            audioRecord.release();
            audioRecord = null;
        }
        Log.d(TAG, "Stopped recording.");
    }

    public boolean isRecording() {
        return isRecording;
    }
}