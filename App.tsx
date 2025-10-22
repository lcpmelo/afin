import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  StatusBar,
  NativeModules,
  DeviceEventEmitter,
  Alert
} from 'react-native';

// Importa os Módulos Nativos com os Nomes Corretos
const { AudioCapture, AudioEmitter, Persistence } = NativeModules;

// Lista de instrumentos (mantida)
const INSTRUMENTOS = ['Guitarra', 'Violão', 'Flauta', 'Baixo'];

// Função para converter frequência em nota (REMOVIDO O OFFSET de afinação)
const frequencyToNote = (freq: number): string => {
  if (freq < 10) return '--'; // Ignora ruído baixo

  // Tabela de frequências (simplificada - precisa ser expandida!)
  // Idealmente, use uma fórmula ou tabela completa
  const notes: { [key: string]: number } = {
    'E2': 82.41, 'F2': 87.31, 'F#2': 92.50, 'G2': 98.00, 'G#2': 103.83,
    'A2': 110.00, 'A#2': 116.54, 'B2': 123.47,
    'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'E3': 164.81,
    'F3': 174.61, 'F#3': 185.00, 'G3': 196.00, 'G#3': 207.65,
    'A3': 220.00, 'A#3': 233.08, 'B3': 246.94,
    'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63,
    'F4': 349.23, 'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30,
    'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
    'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'E5': 659.25,
    // Adicionar mais notas conforme necessário
  };

  let closestNote = '--';
  let minDiff = Infinity;

  // Encontra a nota mais próxima
  for (const note in notes) {
    const diff = Math.abs(freq - notes[note]);
    if (diff < minDiff) {
      minDiff = diff;
      closestNote = note;
    }
  }

  // Define um limite de quão longe a frequência pode estar da nota alvo
  // Se estiver muito longe, provavelmente é ruído ou entre notas.
  const tolerance = notes[closestNote] * 0.05; // Tolerância de 5% (ajustar)
  if (minDiff > tolerance) {
      return '--'; // Muito desafinado ou ruído
  }

  return closestNote;
};

// Objeto com as notas de referência e suas frequências
const NOTAS_REFERENCIA: { [key: string]: number } = {
  'E2': 82.41,
  'A2': 110.00,
  'D3': 146.83,
  'G3': 196.00,
  'B3': 246.94,
  'E4': 329.63,
  'A4': 440.00, // Adicionando o Lá padrão
};


const App = () => {
  const [instrumentoSelecionado, setInstrumentoSelecionado] = useState('Guitarra');
  const [notaAtual, setNotaAtual] = useState('--');
  // O estado 'afinacao' não é mais usado para o texto, mas ainda pode ser útil para o ponteiro
  const [afinacaoOffset, setAfinacaoOffset] = useState(0);

  useEffect(() => {
    const frequencyListener = DeviceEventEmitter.addListener(
      AudioCapture.ON_FREQUENCY_EVENT,
      (event) => {
        const detectedNote = frequencyToNote(event.frequency);
        setNotaAtual(detectedNote);

        // Opcional: Calcular o offset para o ponteiro visual (se ainda for usar)
        // Esta lógica precisa ser mais robusta no futuro
        if (detectedNote !== '--' && NOTAS_REFERENCIA[detectedNote]) {
            const targetFreq = NOTAS_REFERENCIA[detectedNote];
            const diffRatio = event.frequency / targetFreq;
            if (diffRatio < 0.98) setAfinacaoOffset(-1);
            else if (diffRatio > 1.02) setAfinacaoOffset(1);
            else setAfinacaoOffset(0);
        } else {
            setAfinacaoOffset(0); // Reset offset if no clear note
        }

        // console.log(`[JS] Freq: ${event.frequency.toFixed(2)} -> Nota: ${detectedNote}`);
      }
    );

    AudioCapture.start()
      .then(() => console.log("[JS] Microfone ligado com sucesso!"))
      .catch((error: any) => {
        console.error("[JS] Falha ao ligar microfone: ", error.message);
        if (error.code === 'E_NO_PERMISSION') {
          Alert.alert("Permissão Necessária", "Precisamos de acesso ao microfone.");
        } else {
          Alert.alert("Erro", "Não foi possível iniciar a captura de áudio.");
        }
      });

    return () => {
      console.log("[JS] Desligando microfone...");
      AudioCapture.stop();
      frequencyListener.remove();
    };
  }, []);

  // --- Função para Tocar Nota de Referência (Modificada) ---
  const tocarNotaReferencia = (freq: number, nomeNota: string) => {
    console.log(`[JS] Tentando tocar ${nomeNota} (${freq}Hz)...`);
    AudioEmitter.playSound(freq, 1500) // Toca por 1.5 segundos
      .then((resultado: string) => {
        console.log(`[JS] Sucesso ${nomeNota}: ${resultado}`);
      })
      .catch((error: any) => {
        console.error(`[JS] Falha ${nomeNota}: ${error.message}`);
        Alert.alert("Erro", `Não foi possível tocar ${nomeNota}.`);
      });
  };

  // --- Função Salvar Preset (Modificada para Exemplo) ---
  const salvarPresetExemplo = () => {
    // Exemplo PRONTO sendo salvo TODA VEZ que clicar
    const presetExemplo = {
      nome: "Meu Preset Teste",
      instrumento: instrumentoSelecionado, // Pode usar o estado atual
      notas: ["C4", "G4", "E4"],
      timestamp: new Date().toISOString() // Adiciona data/hora para diferenciar
    };
    const presetJson = JSON.stringify(presetExemplo, null, 2); // null, 2 para formatar bonito

    // Mostra no debugger o que será salvo
    console.log("[JS] --- SALVANDO PRESET EXEMPLO ---");
    console.log(presetJson); // <--- Mostra no console/debugger
    console.log("[JS] -----------------------------");

    Persistence.savePreset("PresetExemplo", presetJson) // Salva sempre com o mesmo nome (ou use timestamp)
      .then(() => {
        console.log("[JS] Sucesso: Preset EXEMPLO salvo!");
        Alert.alert("Sucesso", `Preset Exemplo salvo (verifique o console)!`);
      })
      .catch((error: any) => {
        console.error("[JS] Falha ao salvar preset exemplo: ", error.message);
        Alert.alert("Erro", "Não foi possível salvar o preset exemplo.");
      });
  };


  const renderizarBotoesInstrumento = () => {
     return INSTRUMENTOS.map((instrumento) => (
      <TouchableOpacity
        key={instrumento}
        style={[
          styles.botaoInstrumento,
          instrumentoSelecionado === instrumento && styles.botaoInstrumentoSelecionado,
        ]}
        onPress={() => setInstrumentoSelecionado(instrumento)}
      >
        <Text style={styles.textoBotaoInstrumento}>{instrumento}</Text>
      </TouchableOpacity>
    ));
  };


  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Text style={styles.tituloApp}>Afinador</Text>

      <View style={styles.seletorInstrumentos}>
        {renderizarBotoesInstrumento()}
      </View>

      {/* Visor Principal (REMOVIDO o texto de afinação) */}
      <View style={styles.visorContainer}>
         <Text style={styles.textoNota}>{notaAtual}</Text>
         {/* <Text style={styles.textoAfinacao}> ... </Text>  <-- REMOVIDO */}

         {/* Barra Indicadora de Afinação (Mantida, usa afinacaoOffset) */}
         <View style={styles.indicadorBarraContainer}>
           <View
             style={[
               styles.indicadorPonto,
               { transform: [{ translateX: Math.max(-70, Math.min(70, afinacaoOffset * 60)) }] }
             ]}
           />
           <View style={styles.indicadorCentro} />
         </View>
      </View>

      {/* --- NOVA Seção: Botões para Tocar Notas --- */}
      <Text style={styles.labelSecao}>Tocar Nota de Referência:</Text>
      <View style={styles.notasReferenciaContainer}>
        {Object.entries(NOTAS_REFERENCIA).map(([nomeNota, freq]) => (
          <TouchableOpacity
            key={nomeNota}
            style={styles.botaoNota}
            onPress={() => tocarNotaReferencia(freq, nomeNota)}
          >
            <Text style={styles.textoBotaoInstrumento}>{nomeNota}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* --- Botão Salvar Preset (Chama a nova função) --- */}
      <View style={styles.acoesContainer}>
        <TouchableOpacity style={styles.botaoAcao} onPress={salvarPresetExemplo}>
          <Text style={styles.textoBotaoInstrumento}>Salvar Preset Exemplo</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
};

// --- ESTILOS (Adicionado estilos para os botões de nota) ---
const styles = StyleSheet.create({
  container: { /* ... (igual antes) ... */ flex: 1, backgroundColor: '#121212', alignItems: 'center', paddingTop: 40, paddingHorizontal: 10 },
  tituloApp: { /* ... */ fontSize: 28, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 20 },
  seletorInstrumentos: { /* ... */ flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginBottom: 30 },
  botaoInstrumento: { /* ... */ paddingVertical: 10, paddingHorizontal: 15, borderRadius: 20, backgroundColor: '#333333' },
  botaoInstrumentoSelecionado: { /* ... */ backgroundColor: '#1DB954' },
  textoBotaoInstrumento: { /* ... */ color: '#FFFFFF', fontWeight: '600' },
  visorContainer: { /* ... */ width: 250, height: 250, borderRadius: 125, backgroundColor: '#1E1E1E', justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: '#333333', marginBottom: 30, },
  textoNota: { /* ... */ fontSize: 100, fontWeight: 'bold', color: '#FFFFFF' },
  // textoAfinacao removido visualmente
  indicadorBarraContainer: { /* ... */ width: 150, height: 4, backgroundColor: '#444', borderRadius: 2, marginTop: 15, justifyContent: 'center', alignItems: 'center' },
  indicadorPonto: { /* ... */ width: 12, height: 12, borderRadius: 6, backgroundColor: '#FFFFFF', position: 'absolute' },
  indicadorCentro: { /* ... */ width: 4, height: 20, backgroundColor: '#1DB954', position: 'absolute' },
  acoesContainer: { /* ... */ flexDirection: 'row', marginTop: 30, width: '80%', justifyContent: 'space-around' },
  botaoAcao: { /* ... */ backgroundColor: '#1DB954', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 25 },
  // --- Novos Estilos ---
  labelSecao: {
    fontSize: 16,
    color: '#CCCCCC',
    marginTop: 20,
    marginBottom: 10,
    alignSelf: 'flex-start', // Alinha à esquerda
    marginLeft: '10%',      // Adiciona margem
  },
  notasReferenciaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap', // Permite que os botões quebrem linha
    justifyContent: 'center', // Centraliza os botões na linha
    width: '90%', // Usa a largura disponível
    marginBottom: 20,
  },
  botaoNota: {
    backgroundColor: '#333333',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    margin: 5, // Espaçamento entre os botões
  },
});

export default App;