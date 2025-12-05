package com.afinador.audiocapture;

import org.junit.Test;
import static org.junit.Assert.*;
import java.util.Arrays;

public class FrequencyDetectorTest {

    @Test
    public void testHPSLoopStability() {
        // 1. Instancia a classe
        FrequencyDetector detector = new FrequencyDetector();

        // 2. Configura para modo HPS (que contém o loop crítico)
        detector.setMode(FrequencyDetector.DetectionMode.HPS);

        // 3. Prepara um buffer de áudio simulado (silêncio ou ruído)
        // Tamanho 16384 conforme definido na sua classe constante FFT_SIZE
        int bufferSize = 16384;
        short[] buffer = new short[bufferSize];

        // Preenche com dados simulados (ex: uma onda senoidal simples)
        for (int i = 0; i < bufferSize; i++) {
            buffer[i] = (short) (Math.sin(i * 0.1) * 1000);
        }

        // 4. Executa o método.
        // O teste passa se não lançar "ArrayIndexOutOfBoundsException" durante os loops.
        try {
            double frequency = detector.detectFrequency(buffer, bufferSize);

            // Validações básicas
            assertTrue("A frequência deve ser positiva", frequency >= 0);
            System.out.println("Teste HPS concluído. Frequência calculada: " + frequency);

        } catch (Exception e) {
            fail("O algoritmo HPS falhou com exceção: " + e.getMessage());
        }
    }
}