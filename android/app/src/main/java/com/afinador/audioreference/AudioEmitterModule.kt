package com.afinador.audioreference

import android.media.AudioFormat
import android.media.AudioManager
import android.media.AudioTrack
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import kotlin.math.PI
import kotlin.math.sin

class AudioEmitterModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private var audioTrack: AudioTrack? = null
    private var isPlaying = false
    private var isStopping = false // Novo estado para controlar o Fade Out
    private var workerThread: Thread? = null

    // Configurações de Áudio
    private val sampleRate = 44100
    private val bufferSize = AudioTrack.getMinBufferSize(
        sampleRate,
        AudioFormat.CHANNEL_OUT_MONO,
        AudioFormat.ENCODING_PCM_16BIT
    )

    override fun getName(): String {
        return "AudioEmitter"
    }

    @ReactMethod
    fun play(frequency: Double) {
        // Se já estiver tocando, ignoramos ou reiniciamos (aqui optamos por não sobrepor)
        if (isPlaying) return

        isPlaying = true
        isStopping = false

        workerThread = Thread {
            playSound(frequency)
        }
        workerThread?.start()
    }

    @ReactMethod
    fun stop() {
        // Não paramos imediatamente. Sinalizamos o início do Fade Out.
        if (isPlaying) {
            isStopping = true
        }
    }

    private fun playSound(frequency: Double) {
        val minBuffer = 4096
        val actualBufferSize = if (bufferSize > minBuffer) bufferSize else minBuffer

        audioTrack = AudioTrack(
            AudioManager.STREAM_MUSIC,
            sampleRate,
            AudioFormat.CHANNEL_OUT_MONO,
            AudioFormat.ENCODING_PCM_16BIT,
            actualBufferSize,
            AudioTrack.MODE_STREAM
        )

        audioTrack?.play()

        val buffer = ShortArray(actualBufferSize)
        val angularFrequency = 2.0 * PI * frequency / sampleRate

        var phase = 0.0 // Mantém a continuidade da onda entre os buffers
        var amplitudeFactor = 0.0 // Começa em 0 para o Fade In

        // Define a velocidade do Fade (50ms = 0.05s)
        // Quantos passos para ir de 0 a 1 em 0.05s?
        val fadeDurationSamples = sampleRate * 0.5
        val fadeStep = 1.0 / fadeDurationSamples

        while (isPlaying) {
            for (i in 0 until actualBufferSize) {
                // Lógica do Envelope (Fade In e Fade Out)
                if (isStopping) {
                    // FADE OUT: Diminui o volume
                    amplitudeFactor -= fadeStep
                    if (amplitudeFactor <= 0.0) {
                        amplitudeFactor = 0.0
                        isPlaying = false // Agora sim podemos encerrar o loop
                    }
                } else {
                    // FADE IN: Aumenta o volume até 1.0
                    if (amplitudeFactor < 1.0) {
                        amplitudeFactor += fadeStep
                        if (amplitudeFactor > 1.0) amplitudeFactor = 1.0
                    }
                }

                // Gera a amostra: Seno * Amplitude Variável
                // Short.MAX_VALUE = 32767
                val sampleValue = (sin(phase) * 32767 * amplitudeFactor).toInt().toShort()
                buffer[i] = sampleValue

                // Avança a fase
                phase += angularFrequency
                if (phase > 2 * PI) {
                    phase -= 2 * PI
                }

                // Se o fade out terminou no meio do buffer, paramos de preencher
                if (!isPlaying) break
            }

            // Escreve o buffer no AudioTrack
            audioTrack?.write(buffer, 0, actualBufferSize)
        }

        // Limpeza segura
        try {
            audioTrack?.stop()
            audioTrack?.release()
        } catch (e: Exception) {
            e.printStackTrace()
        }
        audioTrack = null
    }
}