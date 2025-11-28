// App.tsx
import React, { useState, useEffect, useRef } from 'react';
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

// 2. Função frequencyToNote Adicionada (busca nota próxima dentro de tolerância)
const frequencyToNote = (freq: number): string => {
  if (freq < 10) return '--';

const notesFrequencies: { [key: string]: number } = {
  'C0': 16.35, 'C#0': 17.32, 'D0': 18.35, 'D#0': 19.45, 'E0': 20.60,
  'F0': 21.83, 'F#0': 23.12, 'G0': 24.50, 'G#0': 25.96, 'A0': 27.50,
  'A#0': 29.14, 'B0': 30.87,

  'C1': 32.70, 'C#1': 34.65, 'D1': 36.71, 'D#1': 38.89, 'E1': 41.20,
  'F1': 43.65, 'F#1': 46.25, 'G1': 49.00, 'G#1': 51.91, 'A1': 55.00,
  'A#1': 58.27, 'B1': 61.74,

  'C2': 65.41, 'C#2': 69.30, 'D2': 73.42, 'D#2': 77.78, 'E2': 82.41,
  'F2': 87.31, 'F#2': 92.50, 'G2': 98.00, 'G#2': 103.83, 'A2': 110.00,
  'A#2': 116.54, 'B2': 123.47,

  'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'E3': 164.81,
  'F3': 174.61, 'F#3': 185.00, 'G3': 196.00, 'G#3': 207.65, 'A3': 220.00,
  'A#3': 233.08, 'B3': 246.94,

  'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63,
  'F4': 349.23, 'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00,
  'A#4': 466.16, 'B4': 493.88,

  'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'E5': 659.25,
  'F5': 698.46, 'F#5': 739.99, 'G5': 783.99, 'G#5': 830.61, 'A5': 880.00,
  'A#5': 932.33, 'B5': 987.77,

  'C6': 1046.50, 'C#6': 1108.73, 'D6': 1174.66, 'D#6': 1244.51, 'E6': 1318.51,
  'F6': 1396.91, 'F#6': 1479.98, 'G6': 1567.98, 'G#6': 1661.22, 'A6': 1760.00,
  'A#6': 1864.66, 'B6': 1975.53,
};

  let closestNote = '--';
  let minDiff = Infinity;

  for (const note in notesFrequencies) {
    const diff = Math.abs(freq - notesFrequencies[note]);
    if (diff < minDiff) {
      minDiff = diff;
      closestNote = note;
    }
  }

  const tolerance = notesFrequencies[closestNote] * 0.75;
  if (minDiff > tolerance) {
      return '--';
  }

  return closestNote;
};

// -----------------------------
// Mapa auxiliar de frequências (usado para cálculo de cents)
// -----------------------------
const notesFrequencies: { [key: string]: number } = {
  'C0': 16.35, 'C#0': 17.32, 'D0': 18.35, 'D#0': 19.45, 'E0': 20.60,
  'F0': 21.83, 'F#0': 23.12, 'G0': 24.50, 'G#0': 25.96, 'A0': 27.50,
  'A#0': 29.14, 'B0': 30.87,

  'C1': 32.70, 'C#1': 34.65, 'D1': 36.71, 'D#1': 38.89, 'E1': 41.20,
  'F1': 43.65, 'F#1': 46.25, 'G1': 49.00, 'G#1': 51.91, 'A1': 55.00,
  'A#1': 58.27, 'B1': 61.74,

  'C2': 65.41, 'C#2': 69.30, 'D2': 73.42, 'D#2': 77.78, 'E2': 82.41,
  'F2': 87.31, 'F#2': 92.50, 'G2': 98.00, 'G#2': 103.83, 'A2': 110.00,
  'A#2': 116.54, 'B2': 123.47,

  'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'E3': 164.81,
  'F3': 174.61, 'F#3': 185.00, 'G3': 196.00, 'G#3': 207.65, 'A3': 220.00,
  'A#3': 233.08, 'B3': 246.94,

  'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63,
  'F4': 349.23, 'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00,
  'A#4': 466.16, 'B4': 493.88,

  'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'E5': 659.25,
  'F5': 698.46, 'F#5': 739.99, 'G5': 783.99, 'G#5': 830.61, 'A5': 880.00,
  'A#5': 932.33, 'B5': 987.77,

  'C6': 1046.50, 'C#6': 1108.73, 'D6': 1174.66, 'D#6': 1244.51, 'E6': 1318.51,
  'F6': 1396.91, 'F#6': 1479.98, 'G6': 1567.98, 'G#6': 1661.22, 'A6': 1760.00,
  'A#6': 1864.66, 'B6': 1975.53,
};

// Função para calcular diferença em cents entre duas frequências
const getCentsDiff = (freq: number, targetFreq: number): number => {
  if (!freq || !targetFreq) return 0;
  return 1200 * Math.log2(freq / targetFreq);
};

// --- NOVAS FUNÇÕES: conversão MIDI / nome de nota (usadas no modo livre) ---
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/** Retorna número MIDI (float) para uma frequência */
const freqToMidiFloat = (freq: number): number => {
  return 69 + 12 * Math.log2(freq / 440);
};

/** Retorna nome de nota (ex: "A4") a partir de um número MIDI inteiro */
const midiToNoteName = (midi: number): string => {
  const note = NOTE_NAMES[(midi % 12 + 12) % 12];
  const octave = Math.floor(midi / 12) - 1;
  return `${note}${octave}`;
};

// --- COMPONENTE PRINCIPAL ---

const App = () => {
  // --- ESTADOS ---
  const [presetsUsuario, setPresetsUsuario] = useState(AFINACOES_INICIAIS);
  const [instrumentoSelecionado, setInstrumentoSelecionado] = useState('Guitarra');

  // chama modo do instrumento apenas quando muda (evita chamada em todo render)
  useEffect(() => {
    if (AudioCapture && typeof AudioCapture.setInstrumentMode === 'function') {
      AudioCapture.setInstrumentMode(instrumentoSelecionado);
    }
  }, [instrumentoSelecionado]);

  const [presetSelecionado, setPresetSelecionado] = useState('Padrão');
  const [notaAlvo, setNotaAlvo] = useState<string | null>(null);
  const [notaAtual, setNotaAtual] = useState('--');
  const [modalVisivel, setModalVisivel] = useState(false);
  const [novoPresetNome, setNovoPresetNome] = useState('');
  const [novoPresetNotas, setNovoPresetNotas] = useState<string[]>(['']);

  // estado para cents (desvio) usado na barra
  const [cents, setCents] = useState<number>(0);

  // mostra se a nota detectada está afinada, aguda ou grave (modo livre)
  const [statusTexto, setStatusTexto] = useState<string>('');

  // ref para manter notaAlvo atual dentro do listener sem recriar o listener
  const notaAlvoRef = useRef<string | null>(notaAlvo);
  useEffect(() => { notaAlvoRef.current = notaAlvo; }, [notaAlvo]);

  // --- EFEITOS ---

  // Listener de frequência: calcula nota atual e cents dependendo do modo (alvo selecionada ou livre)
  useEffect(() => {
    const frequencyListener = DeviceEventEmitter.addListener(
      AudioCapture.ON_FREQUENCY_EVENT,
      (event) => {
        if (!event || !event.frequency) return;
        const freq: number = event.frequency;

        // --- MODO LIVRE: detectar nota automaticamente e calcular cents relativos à nota mais próxima ---
        const currentNotaAlvo = notaAlvoRef.current;
        if (!currentNotaAlvo) {
          // calcula MIDI (float) e arredonda para nota mais próxima
          const midiFloat = freqToMidiFloat(freq);
          const midiRound = Math.round(midiFloat);
          const idealFreq = 440 * Math.pow(2, (midiRound - 69) / 12);
          const centsDiff = 1200 * Math.log2(freq / idealFreq);

          // atualiza nota atual no formato "C4"
          const notaDetectada = midiToNoteName(midiRound);
          setNotaAtual(notaDetectada);

          // limita para barra visual (ex: -50..+50)
          const limited = Math.max(-50, Math.min(50, centsDiff));
          setCents(limited);

          // status textual: afinada / aguda / grave (threshold = 5 cents)
          const absC = Math.abs(centsDiff);
          if (absC <= 5) {
            setStatusTexto('Afinada');
          } else if (centsDiff > 0) {
            setStatusTexto('Mais aguda');
          } else {
            setStatusTexto('Mais grave');
          }

          // debug
          console.log('[TUNER][LIVRE] freq:', freq.toFixed(2), 'note:', notaDetectada, 'cents:', centsDiff.toFixed(1));
        } else {
          // --- MODO COM NOTA ALVO SELECIONADA: calcula diferencia para a nota alvo (mantém seu comportamento) ---
          const targetFreq = notesFrequencies[currentNotaAlvo];
          setNotaAtual(frequencyToNote(freq)); // mostra nota próxima (se houver)
          if (targetFreq) {
            const diff = getCentsDiff(freq, targetFreq);
            const limited = Math.max(-50, Math.min(50, diff));
            setCents(limited);

            // status para modo com nota alvo
            const absD = Math.abs(diff);
            if (absD <= 5) setStatusTexto('Afinada');
            else if (diff > 0) setStatusTexto('Mais aguda');
            else setStatusTexto('Mais grave');

            console.log('[TUNER][ALVO] freq:', freq.toFixed(2), 'targetFreq:', targetFreq.toFixed(2), 'cents:', diff.toFixed(1));
          } else {
            setCents(0);
            setStatusTexto('');
          }
        }
      }
    );

    // tenta iniciar captura
    AudioCapture.start?.()
      ?.then(() => console.log("[JS] Microfone ligado com sucesso!"))
      ?.catch((error: any) => {
        console.error("[JS] Falha ao ligar microfone: ", error);
        Alert.alert("Erro de Microfone", "Não foi possível iniciar a captura de áudio. Verifique as permissões.");
      });

    return () => {
      console.log("[JS] Desligando microfone...");
      AudioCapture.stop?.();
      frequencyListener.remove();
    };
  }, []); // listener criado uma vez

  // Efeito que garante que sempre haja um preset válido selecionado
  useEffect(() => {
    const presetsDisponiveis = Object.keys(presetsUsuario[instrumentoSelecionado] || {});
    if (!presetsDisponiveis.includes(presetSelecionado)) {
      setPresetSelecionado(presetsDisponiveis[0] || '');
    }
    // manter modo livre ao trocar instrumento: zera notaAlvo
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

  // mapeamento para posição da agulha (0..100 %)
  const indicatorPercent = (() => {
    // cents no estado ∈ [-50,50]; mapeamos para 0..100
    const p = 50 + (cents);
    const clamped = Math.max(0, Math.min(100, p));
    return Math.round(clamped * 10) / 10; // uma casa
  })();

  // cor da agulha dependendo da proximidade (verde se afinada)
  const indicatorColor = Math.abs(cents) <= 5 ? '#1DB954' : '#FFB300'; // verde quando afinada, amarelo quando não

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
        {/* exibe status no visor (modo livre ou alvo) */}
        <Text style={styles.statusTexto}>{statusTexto}</Text>
      </View>

      {/* BARRA DE AFINAÇÃO (RESPONSIVA) */}
      <View style={styles.tuningBarContainer}>
        <View style={styles.tuningBar}>
          {/* Indicator: left is percentage. We map cents (-50..+50) to 0..100% with center at 50% */}
          <View
            style={[
              styles.tuningIndicator,
              {
                left: `${indicatorPercent}%`,
                backgroundColor: indicatorColor,
                // ajusta ancoragem: transform para centralizar pela metade da largura do indicador
                transform: [{ translateX: -12 }], // desloca metade do width do indicador (ajuste se mudar width)
              }
            ]}
          />
          {/* center marker */}
          <View style={styles.centerMarker} />
        </View>

        <Text style={styles.centsText}>
          {notaAlvo
            ? (() => {
                let adjustedCents = cents;

                if (cents < 0) {
                  adjustedCents = cents;
                } else if (cents > 0) {
                  adjustedCents = cents;
                }

                return `${Math.round(adjustedCents)} cents`;
              })()
            : 'Modo Livre'
          }

        </Text>
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


// Estilos (sem alterações + novos estilos da barra)
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
    statusTexto: { color: '#A0A0A0', fontSize: 16, marginTop: 6 },
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

    /* Novos estilos para a barra de afinação (maior e mais visível) */
    tuningBarContainer: {
      width: '90%',
      alignItems: 'center',
      marginBottom: 20,
    },

    tuningBar: {
      width: '100%',
      height: 36,            // Aumentei a altura para ser mais visível
      backgroundColor: '#222',
      borderRadius: 18,
      position: 'relative',
      overflow: 'hidden',
      justifyContent: 'center',
    },

    tuningIndicator: {
      position: 'absolute',
      width: 24,            // indicador mais largo para facilitar visualização
      height: 48,           // indicador alto (sobressai da barra)
      backgroundColor: '#1DB954',
      top: -6,
      borderRadius: 6,
      // transform é aplicado inline para centralizar o indicador no % calculado
      elevation: 6,
      shadowColor: '#000',
      shadowOpacity: 0.4,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
    },

    centerMarker: {
      position: 'absolute',
      left: '50%',
      width: 3,
      height: 48,
      marginLeft: -1.5,
      backgroundColor: '#666',
      opacity: 0.9,
      top: -6,
      borderRadius: 2,
    },

    centsText: {
      color: '#FFFFFF',
      fontSize: 18,
      marginTop: 10,
    },
});

export default App;
