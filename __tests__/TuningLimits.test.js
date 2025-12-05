import { getCentsDiff, NOTES_TO_HZ } from '../App'; // Ajuste o caminho se necessário

describe('Tuning Logic - Boundary Value Analysis', () => {
  const TARGET_A4 = 440.0; // Frequência exata de A4

  test('Deve retornar 0 cents para a frequência exata (Centro)', () => {
    const cents = getCentsDiff(TARGET_A4, TARGET_A4);
    expect(cents).toBeCloseTo(0, 2);
    // Validação Lógica: Isso deve acionar a cor VERDE na UI
  });

  test('Deve estar dentro do limite de "Afinada" (+5 cents)', () => {
    // Cálculo reverso: Frequência que gera +5 cents
    // Freq = 440 * 2^(5/1200) ≈ 441.27 Hz
    const borderFreq = 440 * Math.pow(2, 5 / 1200);

    const cents = getCentsDiff(borderFreq, TARGET_A4);

    expect(cents).toBeCloseTo(5, 2);
    // Validação Lógica: Este é o limite EXATO onde o texto ainda deve ser "Afinada"
  });

  test('Deve identificar como "Mais aguda" logo após o limite (+5.1 cents)', () => {
    // Freq = 440 * 2^(5.1/1200) ≈ 441.30 Hz
    const outFreq = 440 * Math.pow(2, 5.1 / 1200);

    const cents = getCentsDiff(outFreq, TARGET_A4);

    expect(cents).toBeGreaterThan(5);
    // Validação Lógica: Isso deve acionar a cor AMARELA/LARANJA e texto "Mais aguda"
  });
});