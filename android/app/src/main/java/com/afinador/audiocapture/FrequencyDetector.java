package com.afinador.audiocapture;

public class FrequencyDetector {
    private static final int SAMPLE_RATE = 44100;

    public FrequencyDetector() {
        // O construtor pode ser usado para pré-calcular tabelas ou inicializar bibliotecas
    }

    /**
     * Analisa um buffer de áudio e retorna a frequência dominante.
     * @param buffer O buffer de áudio com amostras PCM de 16 bits.
     * @param readSize O número de amostras válidas no buffer.
     * @return A frequência dominante detectada em Hz.
     */
    public double detectFrequency(short[] buffer, int readSize) {
        // TODO: Substituir esta implementação ineficiente pela biblioteca JTransforms.

        int n = readSize; // Ou um tamanho fixo de potência de 2, como 4096
        if (n == 0) return 0.0;

        double[] real = new double[n];
        double[] imag = new double[n];

        // Aplica uma janela (ex: Hanning) para reduzir vazamento espectral (melhora precisão)
        for (int i = 0; i < n; i++) {
            // A janela de Hanning é opcional, mas recomendada para precisão
            double hanningWindow = 0.5 * (1 - Math.cos(2 * Math.PI * i / (n - 1)));
            real[i] = buffer[i] * hanningWindow;
            imag[i] = 0.0;
        }

        // 1. Chamar a biblioteca JTransforms aqui. Exemplo:
        // DoubleFFT_1D fft = new DoubleFFT_1D(n);
        // fft.realForward(real); // JTransforms opera no array 'real' diretamente

        // 2. Se for manter a FFT manual (não recomendado):
        fft(real, imag);

        // Encontra o pico de magnitude
        double maxMag = -1;
        int maxIndex = -1;
        // Itera apenas até a metade do array (Teorema de Nyquist)
        for (int i = 0; i < n / 2; i++) {
            // Para JTransforms, o resultado é diferente. O valor imaginário estaria em real[2*i+1]
            // Para a FFT manual, o cálculo é o abaixo:
            double mag = Math.sqrt(real[i] * real[i] + imag[i] * imag[i]);

            if (mag > maxMag) {
                maxMag = mag;
                maxIndex = i;
            }
        }

        // Converte o índice do pico em frequência (Hz)
        return maxIndex * SAMPLE_RATE / (double) n;
    }

    // Implementação recursiva de FFT (ineficiente, manter apenas para referência)
    private void fft(double[] real, double[] imag) {
        int n = real.length;
        if (n <= 1) return;

        double[] evenReal = new double[n / 2];
        double[] evenImag = new double[n / 2];
        double[] oddReal = new double[n / 2];
        double[] oddImag = new double[n / 2];

        for (int i = 0; i < n / 2; i++) {
            evenReal[i] = real[2 * i];
            evenImag[i] = imag[2 * i];
            oddReal[i] = real[2 * i + 1];
            oddImag[i] = imag[2 * i + 1];
        }

        fft(evenReal, evenImag);
        fft(oddReal, oddImag);

        for (int k = 0; k < n / 2; k++) {
            double angle = -2 * Math.PI * k / n;
            double cos = Math.cos(angle);
            double sin = Math.sin(angle);

            double tReal = cos * oddReal[k] - sin * oddImag[k];
            double tImag = sin * oddReal[k] + cos * oddImag[k];

            real[k] = evenReal[k] + tReal;
            imag[k] = evenImag[k] + tImag;
            real[k + n / 2] = evenReal[k] - tReal;
            imag[k + n / 2] = evenImag[k] - tImag;
        }
    }
}
