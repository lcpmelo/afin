// import React, { useState, useEffect } from 'react';
// import {
//   SafeAreaView,
//   StyleSheet,
//   Text,
//   View,
//   TouchableOpacity,
//   StatusBar,
//   NativeModules,
//   DeviceEventEmitter,
//   Alert
// } from 'react-native';
//
// // Importa os Módulos Nativos com os Nomes Corretos
// const { AudioCapture, AudioEmitter, Persistence } = NativeModules;
//
// // Lista de instrumentos (mantida)
// const INSTRUMENTOS = ['Guitarra', 'Violão', 'Flauta', 'Baixo'];
//
// // Função para converter frequência em nota (REMOVIDO O OFFSET de afinação)
// const frequencyToNote = (freq: number): string => {
//   if (freq < 10) return '--'; // Ignora ruído baixo
//
//   // Tabela de frequências (simplificada - precisa ser expandida!)
//   // Idealmente, use uma fórmula ou tabela completa
//   const notes: { [key: string]: number } = {
//     'E2': 82.41, 'F2': 87.31, 'F#2': 92.50, 'G2': 98.00, 'G#2': 103.83,
//     'A2': 110.00, 'A#2': 116.54, 'B2': 123.47,
//     'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'E3': 164.81,
//     'F3': 174.61, 'F#3': 185.00, 'G3': 196.00, 'G#3': 207.65,
//     'A3': 220.00, 'A#3': 233.08, 'B3': 246.94,
//     'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63,
//     'F4': 349.23, 'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30,
//     'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
//     'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'E5': 659.25,
//     // Adicionar mais notas conforme necessário
//   };
//
//   let closestNote = '--';
//   let minDiff = Infinity;
//
//   // Encontra a nota mais próxima
//   for (const note in notes) {
//     const diff = Math.abs(freq - notes[note]);
//     if (diff < minDiff) {
//       minDiff = diff;
//       closestNote = note;
//     }
//   }
//
//   // Define um limite de quão longe a frequência pode estar da nota alvo
//   // Se estiver muito longe, provavelmente é ruído ou entre notas.
//   const tolerance = notes[closestNote] * 0.05; // Tolerância de 5% (ajustar)
//   if (minDiff > tolerance) {
//       return '--'; // Muito desafinado ou ruído
//   }
//
//   return closestNote;
// };
//
// // Objeto com as notas de referência e suas frequências
// const NOTAS_REFERENCIA: { [key: string]: number } = {
//   'E2': 82.41,
//   'A2': 110.00,
//   'D3': 146.83,
//   'G3': 196.00,
//   'B3': 246.94,
//   'E4': 329.63,
//   'A4': 440.00, // Adicionando o Lá padrão
// };
//
//
// const App = () => {
//   const [instrumentoSelecionado, setInstrumentoSelecionado] = useState('Guitarra');
//   const [notaAtual, setNotaAtual] = useState('--');
//   // O estado 'afinacao' não é mais usado para o texto, mas ainda pode ser útil para o ponteiro
//   const [afinacaoOffset, setAfinacaoOffset] = useState(0);
//
//   useEffect(() => {
//     const frequencyListener = DeviceEventEmitter.addListener(
//       AudioCapture.ON_FREQUENCY_EVENT,
//       (event) => {
//         const detectedNote = frequencyToNote(event.frequency);
//         setNotaAtual(detectedNote);
//
//         // Opcional: Calcular o offset para o ponteiro visual (se ainda for usar)
//         // Esta lógica precisa ser mais robusta no futuro
//         if (detectedNote !== '--' && NOTAS_REFERENCIA[detectedNote]) {
//             const targetFreq = NOTAS_REFERENCIA[detectedNote];
//             const diffRatio = event.frequency / targetFreq;
//             if (diffRatio < 0.98) setAfinacaoOffset(-1);
//             else if (diffRatio > 1.02) setAfinacaoOffset(1);
//             else setAfinacaoOffset(0);
//         } else {
//             setAfinacaoOffset(0); // Reset offset if no clear note
//         }
//
//         // console.log(`[JS] Freq: ${event.frequency.toFixed(2)} -> Nota: ${detectedNote}`);
//       }
//     );
//
//     AudioCapture.start()
//       .then(() => console.log("[JS] Microfone ligado com sucesso!"))
//       .catch((error: any) => {
//         console.error("[JS] Falha ao ligar microfone: ", error.message);
//         if (error.code === 'E_NO_PERMISSION') {
//           Alert.alert("Permissão Necessária", "Precisamos de acesso ao microfone.");
//         } else {
//           Alert.alert("Erro", "Não foi possível iniciar a captura de áudio.");
//         }
//       });
//
//     return () => {
//       console.log("[JS] Desligando microfone...");
//       AudioCapture.stop();
//       frequencyListener.remove();
//     };
//   }, []);
//
//   // Função para Tocar Nota de Referência
//   const tocarNotaReferencia = (freq: number, nomeNota: string) => {
//     console.log(`[JS] Tentando tocar ${nomeNota} (${freq}Hz)...`);
//     AudioEmitter.playSound(freq, 1500) // Toca por 1.5 segundos
//       .then((resultado: string) => {
//         console.log(`[JS] Sucesso ${nomeNota}: ${resultado}`);
//       })
//       .catch((error: any) => {
//         console.error(`[JS] Falha ${nomeNota}: ${error.message}`);
//         Alert.alert("Erro", `Não foi possível tocar ${nomeNota}.`);
//       });
//   };
//
//   // Função Salvar Preset (Modificada)
//   const salvarPresetExemplo = () => {
//     // Exemplo PRONTO sendo salvo TODA VEZ que clicar
//     const presetExemplo = {
//       nome: "Meu Preset Teste",
//       instrumento: instrumentoSelecionado, // Pode usar o estado atual
//       notas: ["C4", "G4", "E4"],
//       timestamp: new Date().toISOString() // Adiciona data/hora para diferenciar
//     };
//     const presetJson = JSON.stringify(presetExemplo, null, 2); // null, 2 para formatar bonito
//
//     // Mostra no debugger o que será salvo
//     console.log("[JS] --- SALVANDO PRESET EXEMPLO ---");
//     console.log(presetJson); // <--- Mostra no console/debugger
//     console.log("[JS] -----------------------------");
//
//     Persistence.savePreset("PresetExemplo", presetJson) // Salva sempre com o mesmo nome (ou use timestamp)
//       .then(() => {
//         console.log("[JS] Sucesso: Preset EXEMPLO salvo!");
//         Alert.alert("Sucesso", `Preset Exemplo salvo (verifique o console)!`);
//       })
//       .catch((error: any) => {
//         console.error("[JS] Falha ao salvar preset exemplo: ", error.message);
//         Alert.alert("Erro", "Não foi possível salvar o preset exemplo.");
//       });
//   };
//
//
//   const renderizarBotoesInstrumento = () => {
//      return INSTRUMENTOS.map((instrumento) => (
//       <TouchableOpacity
//         key={instrumento}
//         style={[
//           styles.botaoInstrumento,
//           instrumentoSelecionado === instrumento && styles.botaoInstrumentoSelecionado,
//         ]}
//         onPress={() => setInstrumentoSelecionado(instrumento)}
//       >
//         <Text style={styles.textoBotaoInstrumento}>{instrumento}</Text>
//       </TouchableOpacity>
//     ));
//   };
//
//
//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar barStyle="light-content" />
//       <Text style={styles.tituloApp}>Afinador</Text>
//
//       <View style={styles.seletorInstrumentos}>
//         {renderizarBotoesInstrumento()}
//       </View>
//
//       {/* Visor Principal (REMOVIDO o texto de afinação) */}
//       <View style={styles.visorContainer}>
//          <Text style={styles.textoNota}>{notaAtual}</Text>
//          {/* <Text style={styles.textoAfinacao}> ... </Text>  <-- REMOVIDO */}
//
//          {/* Barra Indicadora de Afinação (Mantida, usa afinacaoOffset) */}
//          <View style={styles.indicadorBarraContainer}>
//            <View
//              style={[
//                styles.indicadorPonto,
//                { transform: [{ translateX: Math.max(-70, Math.min(70, afinacaoOffset * 60)) }] }
//              ]}
//            />
//            <View style={styles.indicadorCentro} />
//          </View>
//       </View>
//
//       {/* Botões para Tocar Notas */}
//       <Text style={styles.labelSecao}>Tocar Nota de Referência:</Text>
//       <View style={styles.notasReferenciaContainer}>
//         {Object.entries(NOTAS_REFERENCIA).map(([nomeNota, freq]) => (
//           <TouchableOpacity
//             key={nomeNota}
//             style={styles.botaoNota}
//             onPress={() => tocarNotaReferencia(freq, nomeNota)}
//           >
//             <Text style={styles.textoBotaoInstrumento}>{nomeNota}</Text>
//           </TouchableOpacity>
//         ))}
//       </View>
//
//       {/* --- Botão Salvar Preset (Chama a nova função) --- */}
//       <View style={styles.acoesContainer}>
//         <TouchableOpacity style={styles.botaoAcao} onPress={salvarPresetExemplo}>
//           <Text style={styles.textoBotaoInstrumento}>Salvar Preset Exemplo</Text>
//         </TouchableOpacity>
//       </View>
//
//     </SafeAreaView>
//   );
// };
//
// // --- ESTILOS (Adicionado estilos para os botões de nota) ---
// const styles = StyleSheet.create({
//   container: { /* ... (igual antes) ... */ flex: 1, backgroundColor: '#121212', alignItems: 'center', paddingTop: 40, paddingHorizontal: 10 },
//   tituloApp: { /* ... */ fontSize: 28, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 20 },
//   seletorInstrumentos: { /* ... */ flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginBottom: 30 },
//   botaoInstrumento: { /* ... */ paddingVertical: 10, paddingHorizontal: 15, borderRadius: 20, backgroundColor: '#333333' },
//   botaoInstrumentoSelecionado: { /* ... */ backgroundColor: '#1DB954' },
//   textoBotaoInstrumento: { /* ... */ color: '#FFFFFF', fontWeight: '600' },
//   visorContainer: { /* ... */ width: 250, height: 250, borderRadius: 125, backgroundColor: '#1E1E1E', justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: '#333333', marginBottom: 30, },
//   textoNota: { /* ... */ fontSize: 100, fontWeight: 'bold', color: '#FFFFFF' },
//   // textoAfinacao removido visualmente
//   indicadorBarraContainer: { /* ... */ width: 150, height: 4, backgroundColor: '#444', borderRadius: 2, marginTop: 15, justifyContent: 'center', alignItems: 'center' },
//   indicadorPonto: { /* ... */ width: 12, height: 12, borderRadius: 6, backgroundColor: '#FFFFFF', position: 'absolute' },
//   indicadorCentro: { /* ... */ width: 4, height: 20, backgroundColor: '#1DB954', position: 'absolute' },
//   acoesContainer: { /* ... */ flexDirection: 'row', marginTop: 30, width: '80%', justifyContent: 'space-around' },
//   botaoAcao: { /* ... */ backgroundColor: '#1DB954', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 25 },
//   // --- Novos Estilos ---
//   labelSecao: {
//     fontSize: 16,
//     color: '#CCCCCC',
//     marginTop: 20,
//     marginBottom: 10,
//     alignSelf: 'flex-start', // Alinha à esquerda
//     marginLeft: '10%',      // Adiciona margem
//   },
//   notasReferenciaContainer: {
//     flexDirection: 'row',
//     flexWrap: 'wrap', // Permite que os botões quebrem linha
//     justifyContent: 'center', // Centraliza os botões na linha
//     width: '90%', // Usa a largura disponível
//     marginBottom: 20,
//   },
//   botaoNota: {
//     backgroundColor: '#333333',
//     paddingVertical: 10,
//     paddingHorizontal: 15,
//     borderRadius: 20,
//     margin: 5, // Espaçamento entre os botões
//   },
// });
//
// export default App;
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
  Alert,
  ScrollView,
  Modal,
  TextInput,
} from 'react-native';

// --- MÓDULOS E FUNÇÕES GLOBAIS (RESTAURADOS) ---

// 1. Módulos Nativos Descomentados
const { AudioCapture, AudioEmitter, Persistence } = NativeModules;

// A lista de presets que vem com o app.
const AFINACOES_INICIAIS: { [instrumento: string]: { [preset: string]: string[] } } = {
  Guitarra: { 'Padrão': ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'], 'Drop D': ['E4', 'B3', 'G3', 'D3', 'A2', 'D2'], },
  Violão: { 'Padrão': ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'], },
  Baixo: { '4 Cordas': ['G2', 'D2', 'A1', 'E1'], },
  Flauta: { 'Cromático': [], },
};

// Lista fixa de nomes de presets que são padrão.
const NOMES_PRESETS_PADRAO = ['Padrão', 'Drop D', '4 Cordas', 'Cromático'];

const INSTRUMENTOS = Object.keys(AFINACOES_INICIAIS);

const ehNotaValida = (nota: string): boolean => {
  const notaRegex = /^[A-G](b|#)?[0-8]?$/i;
  return notaRegex.test(nota.trim());
};

// 2. Função frequencyToNote Adicionada
const frequencyToNote = (freq: number): string => {
  if (freq < 10) return '--';

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
  };

  let closestNote = '--';
  let minDiff = Infinity;

  for (const note in notes) {
    const diff = Math.abs(freq - notes[note]);
    if (diff < minDiff) {
      minDiff = diff;
      closestNote = note;
    }
  }

  const tolerance = notes[closestNote] * 0.05;
  if (minDiff > tolerance) {
      return '--';
  }

  return closestNote;
};


// --- COMPONENTE PRINCIPAL ---

const App = () => {
  // --- ESTADOS ---
  const [presetsUsuario, setPresetsUsuario] = useState(AFINACOES_INICIAIS);
  const [instrumentoSelecionado, setInstrumentoSelecionado] = useState('Guitarra');
  const [presetSelecionado, setPresetSelecionado] = useState('Padrão');
  const [notaAlvo, setNotaAlvo] = useState<string | null>(null);
  const [notaAtual, setNotaAtual] = useState('--');
  const [modalVisivel, setModalVisivel] = useState(false);
  const [novoPresetNome, setNovoPresetNome] = useState('');
  const [novoPresetNotas, setNovoPresetNotas] = useState<string[]>(['']);

  // --- EFEITOS ---

  // 3. useEffect de Captura de Áudio Restaurado
  useEffect(() => {
    const frequencyListener = DeviceEventEmitter.addListener(
      AudioCapture.ON_FREQUENCY_EVENT,
      (event) => {
        if (event.frequency) {
          const detectedNote = frequencyToNote(event.frequency);
          setNotaAtual(detectedNote);
        }
      }
    );

    AudioCapture.start()
      .then(() => console.log("[JS] Microfone ligado com sucesso!"))
      .catch((error: any) => {
        console.error("[JS] Falha ao ligar microfone: ", error);
        Alert.alert("Erro de Microfone", "Não foi possível iniciar a captura de áudio. Verifique as permissões.");
      });

    return () => {
      console.log("[JS] Desligando microfone...");
      AudioCapture.stop();
      frequencyListener.remove();
    };
  }, []);

  // Efeito que garante que sempre haja um preset válido selecionado
  useEffect(() => {
    const presetsDisponiveis = Object.keys(presetsUsuario[instrumentoSelecionado] || {});
    if (!presetsDisponiveis.includes(presetSelecionado)) {
      setPresetSelecionado(presetsDisponiveis[0] || '');
    }
    setNotaAlvo(null);
  }, [instrumentoSelecionado, presetsUsuario]);

  // --- FUNÇÕES DE MANIPULAÇÃO DE PRESETS ---

  const abrirModalParaCriar = () => {
    setNovoPresetNome('');
    setNovoPresetNotas(['']);
    setModalVisivel(true);
  };

  const handleSalvarNovoPreset = () => {
    const nomeLimpo = novoPresetNome.trim();
    if (!nomeLimpo) {
      return Alert.alert('Erro', 'Por favor, dê um nome para a sua afinação.');
    }

    if (NOMES_PRESETS_PADRAO.includes(nomeLimpo)) {
      return Alert.alert('Nome Inválido', `O nome "${nomeLimpo}" é reservado para um preset padrão e não pode ser usado.`);
    }

    const notasFormatadas = novoPresetNotas.map(nota => nota.trim().toUpperCase()).filter(nota => nota !== '');
    if (notasFormatadas.length === 0) {
      return Alert.alert('Erro', 'Adicione pelo menos uma nota para salvar a afinação.');
    }
    const notasInvalidas = notasFormatadas.filter(nota => !ehNotaValida(nota));
    if (notasInvalidas.length > 0) {
      return Alert.alert('Notas Inválidas', `As seguintes notas não são válidas: ${notasInvalidas.join(', ')}`);
    }

    setPresetsUsuario(prev => {
      const novosPresets = { ...prev };
      if (!novosPresets[instrumentoSelecionado]) {
        novosPresets[instrumentoSelecionado] = {};
      }
      novosPresets[instrumentoSelecionado][nomeLimpo] = notasFormatadas.reverse();
      return novosPresets;
    });

    setModalVisivel(false);
    setPresetSelecionado(nomeLimpo);
  };

  const handleExcluirPreset = () => {
    const nomePresetParaExcluir = presetSelecionado;

    if (NOMES_PRESETS_PADRAO.includes(nomePresetParaExcluir)) {
      return Alert.alert('Ação Bloqueada', 'Não é possível excluir um preset padrão.');
    }

    Alert.alert(
      'Confirmar Exclusão',
      `Você tem certeza que deseja excluir o preset "${nomePresetParaExcluir}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            setPresetsUsuario(prev => {
              const novosPresetsParaInstrumento = { ...prev[instrumentoSelecionado] };
              delete novosPresetsParaInstrumento[nomePresetParaExcluir];
              return {
                ...prev,
                [instrumentoSelecionado]: novosPresetsParaInstrumento,
              };
            });
          },
        },
      ]
    );
  };

  // --- LÓGICA DE RENDERIZAÇÃO ---
  const presetsDoInstrumentoAtual = Object.keys(presetsUsuario[instrumentoSelecionado] || {});
  const notasDoPresetAtual = presetsUsuario[instrumentoSelecionado]?.[presetSelecionado] || [];
  const isPresetSelecionadoPadrao = NOMES_PRESETS_PADRAO.includes(presetSelecionado);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Modal */}
      <Modal visible={modalVisivel} onRequestClose={() => setModalVisivel(false)} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <ScrollView style={styles.modalScrollView}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Criar/Editar Afinação</Text>
              <TextInput style={styles.modalInput} placeholder="Nome da Afinação" placeholderTextColor="#888" value={novoPresetNome} onChangeText={setNovoPresetNome} />
              <Text style={styles.modalLabel}>Notas (da mais fina para a mais grossa):</Text>
              {novoPresetNotas.map((nota, index) => (
                <View key={index} style={styles.notaInputContainer}>
                  <TextInput style={styles.notaInput} placeholder={`Nota ${index + 1}`} placeholderTextColor="#888" value={nota} onChangeText={texto => {
                    const novasNotas = [...novoPresetNotas];
                    novasNotas[index] = texto;
                    setNovoPresetNotas(novasNotas);
                  }} autoCapitalize="characters" />
                  {novoPresetNotas.length > 1 && (
                    <TouchableOpacity onPress={() => setNovoPresetNotas(novoPresetNotas.filter((_, i) => i !== index))} style={styles.removeNotaButton}>
                      <Text style={styles.removeNotaButtonText}>-</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              <TouchableOpacity onPress={() => setNovoPresetNotas([...novoPresetNotas, ''])} style={styles.addNotaButton}>
                <Text style={styles.addNotaButtonText}>+ Adicionar Nota</Text>
              </TouchableOpacity>
              <View style={styles.modalButtonContainer}>
                <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setModalVisivel(false)}>
                  <Text style={styles.textoBotao}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleSalvarNovoPreset}>
                  <Text style={styles.textoBotao}>Salvar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* --- INTERFACE PRINCIPAL --- */}
      <Text style={styles.tituloApp}>Afinador</Text>

      {/* Seletor de Instrumentos */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.seletorHorizontal}>
        {INSTRUMENTOS.map((instrumento) => (
          <TouchableOpacity key={instrumento} style={[styles.botaoInstrumento, instrumentoSelecionado === instrumento && styles.botaoSelecionado]} onPress={() => setInstrumentoSelecionado(instrumento)}>
            <Text style={styles.textoBotao}>{instrumento}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Seletor de Presets com Ações Agrupadas */}
      <View style={styles.presetHeader}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.seletorHorizontalPresets}>
          {presetsDoInstrumentoAtual.map((preset) => (
            <TouchableOpacity key={preset} style={[styles.botaoPreset, presetSelecionado === preset && styles.botaoSelecionado]} onPress={() => setPresetSelecionado(preset)}>
              <Text style={styles.textoBotao}>{preset}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={styles.actionsContainer}>
          {!isPresetSelecionadoPadrao && (
            <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={handleExcluirPreset}>
              <Text style={styles.actionButtonText}>-</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.actionButton} onPress={abrirModalParaCriar}>
            <Text style={styles.actionButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Visor e Lista de Notas */}
      <View style={styles.visorContainer}>
        <Text style={styles.textoNotaDisplay}>{notaAtual}</Text>
      </View>
      <View style={styles.notasPresetContainer}>
        {notasDoPresetAtual.length > 0 ? (
          notasDoPresetAtual.map((nota, index) => (
            <TouchableOpacity key={`${nota}-${index}`} style={[styles.botaoNotaAlvo, notaAlvo === nota && styles.botaoSelecionado]} onPress={() => setNotaAlvo(nota)}>
              <Text style={styles.textoBotaoNotaAlvo}>{nota}</Text>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.textoInfo}>Modo Cromático Ativo</Text>
        )}
      </View>
    </SafeAreaView>
  );
};


// Estilos (sem alterações)
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#121212', alignItems: 'center' },
    tituloApp: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF', marginVertical: 15 },
    seletorHorizontal: { flexGrow: 0, width: '100%', maxHeight: 50, marginBottom: 15, paddingHorizontal: 10 },
    botaoInstrumento: { paddingVertical: 10, paddingHorizontal: 20, marginHorizontal: 5, borderRadius: 20, backgroundColor: '#333', justifyContent: 'center', alignSelf: 'flex-start' },
    textoBotao: { color: '#FFFFFF', fontWeight: '600' },
    presetHeader: { flexDirection: 'row', alignItems: 'center', width: '100%', maxHeight: 50, marginBottom: 15, paddingHorizontal: 10 },
    seletorHorizontalPresets: { flexGrow: 1, marginRight: 10 },
    botaoPreset: { paddingVertical: 8, paddingHorizontal: 15, marginHorizontal: 5, borderRadius: 20, backgroundColor: '#333', justifyContent: 'center' },
    actionsContainer: { flexDirection: 'row' },
    actionButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
    deleteButton: { backgroundColor: '#D32F2F' },
    actionButtonText: { color: '#FFFFFF', fontSize: 24, fontWeight: 'bold' },
    botaoSelecionado: { backgroundColor: '#1DB954' },
    visorContainer: { width: 250, height: 250, borderRadius: 125, backgroundColor: '#1E1E1E', justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: '#333333', marginBottom: 20 },
    textoNotaDisplay: { fontSize: 100, fontWeight: 'bold', color: '#FFFFFF' },
    notasPresetContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 10, flexWrap: 'wrap', marginTop: 10, width: '95%' },
    botaoNotaAlvo: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#282828', justifyContent: 'center', alignItems: 'center', margin: 8, borderWidth: 2, borderColor: '#444' },
    textoBotaoNotaAlvo: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold' },
    textoInfo: { color: '#A0A0A0', fontSize: 16, marginTop: 20 },
    modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.8)' },
    modalScrollView: { width: '90%', maxHeight: '80%', backgroundColor: '#282828', borderRadius: 15 },
    modalContent: { padding: 20, alignItems: 'center' },
    modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 20 },
    modalLabel: { fontSize: 16, color: '#AAA', marginTop: 15, marginBottom: 5, alignSelf: 'flex-start' },
    modalInput: { width: '100%', backgroundColor: '#1E1E1E', color: '#FFFFFF', borderRadius: 8, paddingHorizontal: 15, paddingVertical: 10, fontSize: 16, marginBottom: 10 },
    notaInputContainer: { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 5 },
    notaInput: { flex: 1, backgroundColor: '#1E1E1E', color: '#FFFFFF', borderRadius: 8, paddingHorizontal: 15, paddingVertical: 8, fontSize: 14, textAlign: 'center' },
    removeNotaButton: { width: 35, height: 35, borderRadius: 17.5, backgroundColor: '#F44336', justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
    removeNotaButtonText: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold' },
    addNotaButton: { width: '100%', backgroundColor: '#333', padding: 10, borderRadius: 8, marginTop: 15, alignItems: 'center' },
    addNotaButtonText: { color: '#1DB954', fontSize: 16, fontWeight: 'bold' },
    modalButtonContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 30, marginBottom: 20 },
    modalButton: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center', marginHorizontal: 5 },
    cancelButton: { backgroundColor: '#555' },
    saveButton: { backgroundColor: '#1DB954' },
});

export default App;
