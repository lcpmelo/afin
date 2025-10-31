package com.afinador.persistence

import android.content.ContentValues
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import kotlin.concurrent.thread

//ponte javascript e kotlin
class PersistenceModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    //DatabaseHelper cria as tabelas do banco de dados (arquivo separado)
    private val dbHelper = DatabaseHelper(reactContext)

    override fun getName() = "Persistence"

    @ReactMethod
    fun savePreset(name: String, tuningDataJson: String, promise: Promise) { //OBS parâmetros: padronização de tuningDataJson -> {"notes": ["E", "A", "D", "G", "B", "E"], "frequencies": [82.41, 110.0, ...]}
        //novamente usando uma thread separada para não travar o app
        thread {
            try {
                ////pede ao DatabaseHelper uma conexão com o banco de dados que permite escrita
                val db = dbHelper.writableDatabase
                val values = ContentValues().apply { //forma segura do Android de preparar os dados para serem inseridos
                    put(DatabaseHelper.COLUMN_NAME, name)
                    put(DatabaseHelper.COLUMN_TUNING_DATA, tuningDataJson)
                }
                //comando que efetivamente insere os dados na tabela de presets
                db.insert(DatabaseHelper.TABLE_PRESETS, null, values)

                promise.resolve("Preset '${name}' salvo com sucesso!")
            } catch (e: Exception) {
                promise.reject("DB_ERROR", "Erro ao salvar o preset", e)
            }
        }
    }

    //método para ler os dados
    @ReactMethod
    fun loadPresets(promise: Promise) {
        //outra thread
        thread {
            try {
                //pede ao helper uma conexão de apenas leitura
                val db = dbHelper.readableDatabase
                // Executa a query (SELECT * FROM presets) e obtém um cursor (ponteiro que aponta para os resultados da busca, uma linha de cada vez)
                val cursor = db.query(DatabaseHelper.TABLE_PRESETS, null, null, null, null, null, null)
                val presetsArray = Arguments.createArray()

                //percorre cada preset salvo que o banco de dados retornou
                while (cursor.moveToNext()) {
                    val presetMap = Arguments.createMap() //cria um objetos 'Map' que o JS vai entender
                    //preenche o objeto com os dados da linha atual (id, nome, dados_da_afinacao).
                    presetMap.putInt("id", cursor.getInt(cursor.getColumnIndexOrThrow(DatabaseHelper.COLUMN_ID)))
                    presetMap.putString("name", cursor.getString(cursor.getColumnIndexOrThrow(DatabaseHelper.COLUMN_NAME)))
                    presetMap.putString("tuning_data", cursor.getString(cursor.getColumnIndexOrThrow(DatabaseHelper.COLUMN_TUNING_DATA)))
                    presetsArray.pushMap(presetMap)
                }
                //fecha o cursor para liberar os recursos

                cursor.close()
                promise.resolve(presetsArray)

            } catch (e: Exception) {
                promise.reject("DB_ERROR", "Erro ao carregar os presets", e)
            }
        }
    }
}