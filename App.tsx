import React, { useState, useEffect } from 'react'; // Importamos useEffect
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  StatusBar,
  NativeModules,      // <-- IMPORTANTE: Para acessar os módulos nativos
  DeviceEventEmitter, // <-- IMPORTANTE: Para ouvir os eventos de frequência
  Alert                // <-- Para mostrar erros (como permissão negada)
} from 'react-native';

// --- PASSO 1: Importar os Módulos Nativos com os Nomes Corretos ---
const { AudioCapture, AudioEmitter, Persistence } = NativeModules;

// Lista de instrumentos que vamos suportar
const INSTRUMENTOS = ['Guitarra', 'Violão', 'Flauta', 'Baixo'];

// Função básica para converter frequência em nota e afinação (MELHORAR DEPOIS!)
// Retorna um objeto: { nota: 'A', afinacao: -1 | 0 | 1 }
const frequencyToNoteAndOffset = (freq: number): { nota: string; afinacao: number } => {
  if (freq < 10) return { nota: '--', afinacao: 0 }; // Ignora ruído baixo

  // Tabela de frequências (simplificada - LA = A4 = 440Hz)
  const notes = {
    'A': 440.0,
    'A#': 466.16,
    'B': 493.88,
    'C': 523.25,
    // ... (adicionar mais notas é essencial para um afinador real)
    'E': 329.63,
    'G': 392.00,
  };

  let closestNote = '--';
  let minDiff = Infinity;

  // Encontra a nota mais próxima na tabela
  for (const note in notes) {
    const diff = Math.abs(freq - notes[note]);
    if (diff < minDiff) {
      minDiff = diff;
      closestNote = note;
    }
  }

  // Define a afinação baseada na diferença (muito simplificado!)
  let offset = 0;
  if (closestNote !== '--') {
    const targetFreq = notes[closestNote];
    const diffRatio = freq / targetFreq;
    if (diffRatio < 0.98) offset = -1; // Mais de 2% baixo
    else if (diffRatio > 1.02) offset = 1; // Mais de 2% alto
  }

  return { nota: closestNote, afinacao: offset };
};


const App = () => {
  const [instrumentoSelecionado, setInstrumentoSelecionado] = useState('Guitarra');

  // --- PASSO 2: Estados agora são controlados pelo AudioCapture ---
  const [notaAtual, setNotaAtual] = useState('--'); // Começa sem nota
  const [afinacao, setAfinacao] = useState(0);     // Começa como "afinado"

  // --- PASSO 3: Ligar/Desligar o Microfone e Ouvir Eventos ---
  useEffect(() => {
    // Liga o listener para o evento que o AudioCaptureModule emite
    const frequencyListener = DeviceEventEmitter.addListener(
      AudioCapture.ON_FREQUENCY_EVENT, // A constante que exportamos!
      (event) => {
        // Quando uma frequência chegar, atualizamos a interface
        const { nota, afinacao: offset } = frequencyToNoteAndOffset(event.frequency);
        setNotaAtual(nota);
        setAfinacao(offset);
        // Log para debug (ver no Logcat [JS])
        // console.log(`[JS] Freq: ${event.frequency.toFixed(2)} -> Nota: ${nota}, Afin.: ${offset}`);
      }
    );

    // Tenta ligar o microfone quando o app abre
    AudioCapture.start()
      .then(() => {
        console.log("[JS] Microfone ligado com sucesso!");
        // (Poderíamos atualizar a UI para indicar que está ouvindo)
      })
      .catch((error: any) => {
        console.error("[JS] Falha ao ligar microfone: ", error.message);
        // Mostra um alerta para o usuário se a permissão foi negada
        if (error.code === 'E_NO_PERMISSION') {
          Alert.alert("Permissão Necessária", "Precisamos de acesso ao microfone para afinar seu instrumento.");
        } else {
          Alert.alert("Erro", "Não foi possível iniciar a captura de áudio.");
        }
      });

    // Função de "limpeza": desliga o microfone quando o app fecha
    return () => {
      console.log("[JS] Desligando microfone...");
      AudioCapture.stop();
      frequencyListener.remove(); // Remove o listener para não vazar memória
    };
  }, []); // O [] vazio garante que isso rode só UMA VEZ (ao montar/desmontar)


  // --- PASSO 4: Função para Tocar o Tom de Referência (RF10) ---
  const tocarTomReferencia = () => {
    // Toca um Lá (A4 = 440Hz) por 1 segundo (1000ms)
    console.log("[JS] Tentando tocar Tom de Referência (440Hz)...");
    AudioEmitter.playSound(440.0, 1000) // Usando o nome correto do módulo e função
      .then((resultado: string) => {
        console.log("[JS] Sucesso Som: " + resultado);
      })
      .catch((error: any) => {
        console.error("[JS] Falha Som: " + error.message);
        Alert.alert("Erro", "Não foi possível tocar o som de referência.");
      });
  };

  // --- PASSO 5: Função para Salvar um Preset (RF11) ---
  const salvarPresetAtual = () => {
    // Exemplo: Salva a afinação padrão da guitarra selecionada
    // (Precisa definir as notas/frequências corretas para cada instrumento)
    const presetData = {
      notes: ["E", "A", "D", "G", "B", "e"],
      frequencies: [82.41, 110.0, 146.83, 196.00, 246.94, 329.63]
    };
    const presetJson = JSON.stringify(presetData);

    console.log(`[JS] Tentando salvar preset: ${instrumentoSelecionado}`);
    Persistence.savePreset(instrumentoSelecionado, presetJson)
      .then(() => {
        console.log("[JS] Sucesso: Preset salvo!");
        Alert.alert("Sucesso", `Preset '${instrumentoSelecionado}' salvo!`);
      })
      .catch((error: any) => {
        console.error("[JS] Falha ao salvar preset: ", error.message);
        Alert.alert("Erro", "Não foi possível salvar o preset.");
      });
  };


  // Função para renderizar os botões de instrumento (SEU CÓDIGO - sem mudanças)
  const renderizarBotoesInstrumento = () => {
    // ... (seu código original aqui - está perfeito)
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
      <Text style={styles.tituloApp}>Afinador</Text> {/* Mudei o nome */}

      <View style={styles.seletorInstrumentos}>
        {renderizarBotoesInstrumento()}
      </View>

      {/* Visor Principal (SEU CÓDIGO - sem mudanças, agora usa o estado real) */}
      <View style={styles.visorContainer}>
          {/* ... (seu código do visor aqui - está perfeito) ... */}
         <Text style={styles.textoNota}>{notaAtual}</Text>
         <Text
           style={[
             styles.textoAfinacao,
             afinacao < 0 && styles.textoBaixo,
             afinacao > 0 && styles.textoAlto,
           ]}
         >
           {afinacao < 0 ? 'Muito Baixo' : afinacao > 0 ? 'Muito Alto' : 'Afinado!'}
         </Text>

         {/* Barra Indicadora de Afinação */}
         <View style={styles.indicadorBarraContainer}>
           <View
             style={[
               styles.indicadorPonto,
               // Ajuste o multiplicador (60) para sensibilidade desejada
               { transform: [{ translateX: Math.max(-70, Math.min(70, afinacao * 60)) }] }
             ]}
           />
           <View style={styles.indicadorCentro} />
         </View>
      </View>

      {/* --- PASSO 6: Adicionar Botões de Ação --- */}
      <View style={styles.acoesContainer}>
        <TouchableOpacity style={styles.botaoAcao} onPress={tocarTomReferencia}>
          <Text style={styles.textoBotaoInstrumento}>Tocar Tom (A4)</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.botaoAcao} onPress={salvarPresetAtual}>
          <Text style={styles.textoBotaoInstrumento}>Salvar Preset</Text>
        </TouchableOpacity>
      </View>

      {/* --- PASSO 7: Remover os Botões de Simulação --- */}
      {/* <View style={styles.simulacaoContainer}> ... </View> */}

    </SafeAreaView>
  );
};

// --- ESTILOS (SEU CÓDIGO + Estilos para os novos botões) ---
const styles = StyleSheet.create({
  // ... (SEUS estilos originais aqui - estão perfeitos) ...
  container: {
    flex: 1,
    backgroundColor: '#121212',
    alignItems: 'center',
    paddingTop: 40,
  },
  tituloApp: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  seletorInstrumentos: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 10,
    marginBottom: 40,
  },
  botaoInstrumento: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: '#333333',
  },
  botaoInstrumentoSelecionado: {
    backgroundColor: '#1DB954', // Verde Spotify para destaque
  },
  textoBotaoInstrumento: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  visorContainer: {
    width: 280,
    height: 280,
    borderRadius: 140, // Círculo perfeito
    backgroundColor: '#1E1E1E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#333333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 20,
  },
  textoNota: {
    fontSize: 120,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  textoAfinacao: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1DB954', // Verde quando afinado
  },
  textoBaixo: {
    color: '#F44336', // Vermelho para baixo
  },
  textoAlto: {
    color: '#FFC107', // Amarelo para alto
  },
  indicadorBarraContainer: {
    width: 150,
    height: 4,
    backgroundColor: '#444',
    borderRadius: 2,
    marginTop: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicadorPonto: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    position: 'absolute',
  },
  indicadorCentro: {
    width: 4,
    height: 20,
    backgroundColor: '#1DB954',
    position: 'absolute',
  },
  // simulacaoContainer: { // Comentado para remover
  //   flexDirection: 'row',
  //   marginTop: 60,
  //   width: '100%',
  //   justifyContent: 'space-around',
  // },
  // botaoSimulacao: { // Comentado para remover
  //   backgroundColor: '#555',
  //   padding: 10,
  //   borderRadius: 5,
  // },

  // --- Novos Estilos ---
  acoesContainer: {
    flexDirection: 'row',
    marginTop: 60,
    width: '80%',
    justifyContent: 'space-around',
  },
  botaoAcao: {
    backgroundColor: '#1DB954',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
});

export default App;