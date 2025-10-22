package com.afinador.audioreference

import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioTrack
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import kotlin.concurrent.thread

//"ponte" entre o código Nativo (Kotlin) e o JavaScript (React Native)
class AudioEmitterModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private val SAMPLE_RATE = 44100

    //nome que o JavaScript usará para chamar este módulo
    override fun getName() = "AudioEmitter"

    //método que pode ser chamado pela nterface (parâmetros: frequencia e duração)
    @ReactMethod
    fun playSound(frequency: Double, durationInMillis: Int, promise: Promise) {
        // executa tudo em uma thread separada para não travar o app
        thread {
            try {
                // Calcula quantos samples de áudio são necessários (igual antes)
                val numSamples = durationInMillis * SAMPLE_RATE / 1000
                val buffer = ShortArray(numSamples)
                val bufferSizeBytes = buffer.size * 2 // Calcula o tamanho em bytes

                // Gera a onda sonora (igual antes)
                for (i in 0 until numSamples) {
                    val angle = 2.0 * Math.PI * i / (SAMPLE_RATE / frequency)
                    val sample = (Math.sin(angle) * 32767).toInt().toShort()
                    buffer[i] = sample
                }

                // --- MUDANÇA NA CONFIGURAÇÃO DO AUDIOTRACK ---
                val audioTrack = AudioTrack.Builder()
                    .setAudioAttributes(
                        AudioAttributes.Builder()
                            .setUsage(AudioAttributes.USAGE_MEDIA)
                            .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                            .build()
                    )
                    .setAudioFormat(
                        AudioFormat.Builder()
                            .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                            .setSampleRate(SAMPLE_RATE)
                            .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
                            .build()
                    )
                    // Define o tamanho EXATO do buffer e o MODO ESTÁTICO
                    .setBufferSizeInBytes(bufferSizeBytes)
                    .setTransferMode(AudioTrack.MODE_STATIC) // <-- MUDANÇA IMPORTANTE
                    .build()

                // --- MUDANÇA NA ORDEM E REMOÇÃO DO STOP ---
                // 1. Escreve TODO o buffer na memória estática do AudioTrack PRIMEIRO
                val bytesWritten = audioTrack.write(buffer, 0, numSamples)

                if (bytesWritten <= 0) {
                    audioTrack.release() // Libera recursos mesmo se falhar
                    promise.reject("E_AUDIO_WRITE", "Falha ao escrever no buffer estático (código: $bytesWritten)")
                } else {
                    // 2. Toca o som (ele vai parar sozinho quando o buffer acabar)
                    audioTrack.play()

                    // 3. NÃO precisamos mais chamar audioTrack.stop()

                    // 4. Libera os recursos APÓS iniciar a reprodução
                    // (O som continuará tocando em background mesmo após release em MODE_STATIC)
                    // Idealmente, você esperaria a duração, mas para simplificar:
                    audioTrack.play()

                    // Espera o tempo da nota antes de liberar o áudio
                    Thread.sleep(durationInMillis.toLong())

                    audioTrack.release()

                    promise.resolve("Som tocado com sucesso (espera síncrona).")
                }
                // --- FIM DAS MUDANÇAS ---

            } catch (e: Exception) {
                promise.reject("AUDIO_ERROR", "Falha ao gerar o som estático", e)
            }
        }
    }
}
