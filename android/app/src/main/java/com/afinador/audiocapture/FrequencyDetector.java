// File: com/alltune/audiocapture/FrequencyDetector.java
package com.afinador.audiocapture;

import org.jtransforms.fft.DoubleFFT_1D;
import java.util.Arrays; // Importar Arrays

public class FrequencyDetector {
    private static final int SAMPLE_RATE = 44100;
    private static final int FFT_SIZE = 16384;
    private final int FFT_HALF_SIZE = FFT_SIZE / 2;

    // 1. Enum para definir o modo de análise
    public enum DetectionMode {
        /**
         * Encontra o pico de maior magnitude.
         * Bom para: Flauta, sons puros, voz.
         */
        PEAK_PICKING,
        /**
         * Usa o Harmonic Product Spectrum para encontrar a frequência fundamental.
         * Bom para: Guitarra, Baixo, instrumentos com muitos harmónicos.
         */
        HPS
    }

    // 2. Variáveis de membro para o HPS
    private final DoubleFFT_1D fft;
    private final double[] fftBuffer;
    private final double[] magnitudes; // Para guardar as magnitudes da FFT
    private final double[] hpsSpectrum; // Para calcular o HPS
    private DetectionMode currentMode = DetectionMode.PEAK_PICKING; // Modo padrão

    // 3. Definir quantos harmónicos o HPS vai verificar
    private static final int HPS_HARMONICS_COUNT = 4;


    public FrequencyDetector() {
        this.fft = new DoubleFFT_1D(FFT_SIZE);
        this.fftBuffer = new double[FFT_SIZE];

        // 4. Pré-alocar os arrays para HPS
        this.magnitudes = new double[FFT_HALF_SIZE];
        this.hpsSpectrum = new double[FFT_HALF_SIZE];
    }

    /**
     * Define o modo de análise de frequência (Pico ou HPS).
     * Isso deve ser chamado pelo AudioCaptureModule quando o usuário
     * mudar o instrumento na UI.
     */
    public void setMode(DetectionMode mode) {
        this.currentMode = mode;
    }

    /**
     * Analisa um buffer de áudio e retorna a frequência dominante.
     * O algoritmo usado (Pico ou HPS) depende do modo definido.
     */
    public double detectFrequency(short[] buffer, int readSize) {
        if (readSize == 0) return 0.0;

        // --- PASSO 1: Calcular a FFT (comum a ambos os modos) ---
        Arrays.fill(fftBuffer, 0.0);
        int n = FFT_SIZE;

        for (int i = 0; i < readSize && i < n; i++) {
            double hanningWindow = 0.5 * (1 - Math.cos(2 * Math.PI * i / (readSize - 1)));
            fftBuffer[i] = (double) buffer[i] * hanningWindow;
        }

        fft.realForward(fftBuffer);

        // --- PASSO 2: Chamar o algoritmo de deteção específico ---
        if (currentMode == DetectionMode.HPS) {
            return detectFrequencyHPS(n);
        } else {
            return detectFrequencyPeakPicking(n);
        }
    }

    /**
     * ALGORITMO 1: Encontra o pico de maior magnitude (o seu código anterior).
     */
    private double detectFrequencyPeakPicking(int n) {
        System.out.println("FFT Mode: Peak Picking");
        double maxMag = -1;
        int maxIndex = -1;

        for (int i = 1; i < FFT_HALF_SIZE; i++) {
            double re = fftBuffer[2 * i];
            double im = fftBuffer[2 * i + 1];
            double mag = Math.sqrt(re * re + im * im);

            if (mag > maxMag) {
                maxMag = mag;
                maxIndex = i;
            }
        }
        return maxIndex * SAMPLE_RATE / (double) n;
    }

    /**
     * ALGORITMO 2: Encontra a frequência fundamental usando HPS.
     */
    private double detectFrequencyHPS(int n) {
        System.out.println("FFT Mode: Harmonic Product Spectrum");

        // 5. Calcular as magnitudes de cada bin da FFT
        for (int i = 1; i < FFT_HALF_SIZE; i++) {
            double re = fftBuffer[2 * i];
            double im = fftBuffer[2 * i + 1];
            magnitudes[i] = re * re + im * im; // (Podemos usar magnitude ao quadrado, é mais rápido)
        }
        // Limpar o resto do array
        Arrays.fill(magnitudes, FFT_HALF_SIZE, magnitudes.length, 0.0);

        // 6. Calcular o HPS
        // Começamos o HPS com o espectro original
        System.arraycopy(magnitudes, 0, hpsSpectrum, 0, FFT_HALF_SIZE);

        // Iterar e multiplicar pelos harmônicos "espremidos"
        // O limite da pesquisa é n/2 / HPS_HARMONICS_COUNT
        int searchLimit = FFT_HALF_SIZE / HPS_HARMONICS_COUNT;

        for (int h = 2; h <= HPS_HARMONICS_COUNT; h++) {
            for (int i = 1; i < searchLimit; i++) {
                hpsSpectrum[i] *= magnitudes[i * h];
            }
        }

        // 7. Encontrar o pico no espectro HPS resultante
        double maxHpsValue = -1;
        int maxHpsIndex = -1;

        // Procuramos apenas na faixa onde calculamos (até searchLimit)
        for (int i = 1; i < searchLimit; i++) {
            if (hpsSpectrum[i] > maxHpsValue) {
                maxHpsValue = hpsSpectrum[i];
                maxHpsIndex = i;
            }
        }

        // 8. Converter o índice HPS em frequência
        return maxHpsIndex * SAMPLE_RATE / (double) n;
    }
}