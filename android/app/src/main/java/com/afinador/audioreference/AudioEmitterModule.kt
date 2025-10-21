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
                //calcula quantos samples de áudio são necessários para a duração desejada
                val numSamples = durationInMillis * SAMPLE_RATE / 1000
                val buffer = ShortArray(numSamples)

                // calcula cada ponto da onda sonora para a frequência pedida e o converte para um formato de áudio digital
                for (i in 0 until numSamples) {
                    val angle = 2.0 * Math.PI * i / (SAMPLE_RATE / frequency)
                    val sample = (Math.sin(angle) * 32767).toInt().toShort()
                    buffer[i] = sample
                }

                // configura o player de áudio nativo para tocar áudio com todas as configurações
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
                    .setBufferSizeInBytes(buffer.size * 2) // 2 bytes por Short
                    .build()

                // toca o som e libera os recursos
                audioTrack.play()

                // --- CORREÇÃO: Vamos verificar o resultado do write() ---
                val bytesWritten = audioTrack.write(buffer, 0, numSamples)

                audioTrack.stop()
                audioTrack.release()

                if (bytesWritten <= 0) {
                    // Se o write() falhou, nós rejeitamos a promise!
                    promise.reject("E_AUDIO_WRITE", "Falha ao escrever no buffer de áudio (código de erro: $bytesWritten)")
                } else {
                    // Só retorne sucesso se os bytes foram escritos
                    promise.resolve("Som gerado e tocado com sucesso! (Bytes escritos: $bytesWritten)")
                }
                // --- FIM DA CORREÇÃO ---

            } catch (e: Exception) {
                promise.reject("AUDIO_ERROR", "Falha ao gerar o som", e)
            }
        }
    }
}
