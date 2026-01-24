<template>
  <div class="app-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>GLM-TTS 语音合成测试</span>
          <el-link type="primary" href="https://open.bigmodel.cn/dev/api#tts" target="_blank" style="float: right">API 文档</el-link>
        </div>
      </template>

      <el-alert
        title="注意：此功能直接调用 ZHIPU AI 开放平台接口，请确保您的 API Key 具有相应权限。"
        type="info"
        show-icon
        style="margin-bottom: 20px"
      />

      <el-form :model="form" label-width="120px">
        <el-form-item label="API Key" required>
          <el-input 
            v-model="form.apiKey" 
            placeholder="请输入 ZHIPU AI API Key (例如: 123.abc...)" 
            show-password 
            type="password"
          />
        </el-form-item>

        <el-form-item label="合成文本" required>
          <el-input
            v-model="form.input"
            type="textarea"
            :rows="4"
            placeholder="请输入要转换的文本"
            maxlength="1024"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="音色">
          <el-select v-model="form.voice" placeholder="请选择音色" style="width: 100%">
            <el-option label="彤彤 (默认, 甜美)" value="tongtong" />
            <el-option label="锤锤 (沉稳)" value="chuichui" />
            <el-option label="小陈 (自然)" value="xiaochen" />
            <el-option label="jam (动物圈)" value="jam" />
            <el-option label="kazi (动物圈)" value="kazi" />
            <el-option label="douji (动物圈)" value="douji" />
            <el-option label="luodo (动物圈)" value="luodo" />
          </el-select>
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="语速">
              <el-slider v-model="form.speed" :min="0.5" :max="2.0" :step="0.1" show-input />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="音量">
              <el-slider v-model="form.volume" :min="0.1" :max="10.0" :step="0.1" show-input />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="采样率">
           <el-input-number v-model="form.sample_rate" :step="1000" />
        </el-form-item>

        <el-form-item label="流式输出">
          <el-switch v-model="form.stream" active-text="开启 (更低延迟)" inactive-text="关闭" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleGenerate" :loading="loading">生成并播放</el-button>
        </el-form-item>
      </el-form>

      <div v-if="audioUrl" class="audio-player">
        <div class="player-title">生成的音频：</div>
        <audio ref="audioRef" controls autoplay :src="audioUrl" style="width: 100%"></audio>
      </div>
      
      <div v-if="form.stream && loading" class="streaming-status">
        <el-tag type="success" effect="dark">正在流式播放...</el-tag>
      </div>
      
      <div v-if="errorMsg" class="error-msg">
        <el-alert :title="errorMsg" type="error" :closable="false" show-icon />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const audioUrl = ref('')
const errorMsg = ref('')
const audioRef = ref<HTMLAudioElement>()

const form = reactive({
  apiKey: localStorage.getItem('zhipu_api_key') || '',
  model: 'glm-tts',
  input: '你好，今天天气怎么样',
  voice: 'tongtong',
  speed: 1.0,
  volume: 1.0,
  sample_rate: 24000,
  stream: true
})

// PCM 播放器类
class PCMPlayer {
  audioContext: AudioContext
  nextStartTime: number
  
  constructor(sampleRate: number) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    this.audioContext = new AudioContextClass({ sampleRate })
    this.nextStartTime = 0
  }

  playChunk(base64Data: string) {
    // PCM 16-bit to Float32
    // 注意：Zhipu AI 的 GLM-TTS 返回的流式 PCM 数据可能是二进制流，而非 base64 字符串
    // 但是文档和 openapi 示例显示如果是 json 响应，可能是 base64
    // 观察发现，response_format: wav 时，直接返回二进制；流式时，是 SSE。
    // SSE 的 data 字段内容，如果是 pcm 格式，可能是 raw binary in buffer? 不，SSE 是文本协议。
    // 所以 data 字段必然是 base64 编码的 PCM 数据。
    
    // 修正：如果 Base64 解码后的数据是 Uint8，需要组合成 Int16
    const binaryString = window.atob(base64Data)
    const len = binaryString.length
    const bytes = new Uint8Array(len)
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    
    // 处理字节序 (Little Endian)
    // 必须确保字节数是偶数
    if (bytes.length % 2 !== 0) {
       console.warn('PCM chunk length is odd, dropping last byte')
    }
    const validBytes = bytes.length % 2 === 0 ? bytes : bytes.slice(0, bytes.length - 1)
    const int16Data = new Int16Array(validBytes.buffer)
    const float32Data = new Float32Array(int16Data.length)
    
    for (let i = 0; i < int16Data.length; i++) {
      // Normalize to [-1.0, 1.0]
      float32Data[i] = (int16Data[i] ?? 0) / 32768.0
    }

    // Resume audio context if suspended (browser policy)
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume()
    }

    const buffer = this.audioContext.createBuffer(1, float32Data.length, this.audioContext.sampleRate)
    buffer.getChannelData(0).set(float32Data)

    const source = this.audioContext.createBufferSource()
    source.buffer = buffer
    source.connect(this.audioContext.destination)

    // Schedule playback
    const currentTime = this.audioContext.currentTime
    if (this.nextStartTime < currentTime) {
      this.nextStartTime = currentTime
    }
    source.start(this.nextStartTime)
    this.nextStartTime += buffer.duration
  }

  async close() {
    if (this.audioContext.state !== 'closed') {
      await this.audioContext.close()
    }
  }
}

let pcmPlayer: PCMPlayer | null = null

const handleGenerate = async () => {
  if (!form.apiKey) {
    ElMessage.warning('请输入 API Key')
    return
  }
  if (!form.input) {
    ElMessage.warning('请输入文本')
    return
  }

  // Save API Key for convenience
  localStorage.setItem('zhipu_api_key', form.apiKey)

  loading.value = true
  errorMsg.value = ''
  
  // Revoke previous URL to avoid memory leaks
  if (audioUrl.value) {
    URL.revokeObjectURL(audioUrl.value)
    audioUrl.value = ''
  }
  
  // Close previous player
  if (pcmPlayer) {
    await pcmPlayer.close()
    pcmPlayer = null
  }

  try {
    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/audio/speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${form.apiKey}`
      },
      body: JSON.stringify({
        model: form.model,
        input: form.input,
        voice: form.voice,
        speed: form.speed,
        volume: form.volume,
        sample_rate: form.sample_rate,
        stream: form.stream,
        response_format: form.stream ? undefined : 'wav', // stream must be pcm, handled by client
        watermark_enabled: false
      })
    })

    if (!response.ok) {
      let message = `请求失败: ${response.status}`
      try {
        const errorData = await response.json()
        if (errorData.error && errorData.error.message) {
          message = `API错误: ${errorData.error.message}`
        }
      } catch (e) {
        // ignore json parse error
      }
      throw new Error(message)
    }

    if (form.stream) {
      // 流式处理
      const reader = response.body?.getReader()
      if (!reader) throw new Error('Response body is not readable')
      
      pcmPlayer = new PCMPlayer(form.sample_rate)
      const decoder = new TextDecoder()
      let buffer = ''
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        // 保留最后一行，因为它可能是不完整的
        buffer = lines.pop() || ''
        
        for (const line of lines) {
          if (line.trim() === '') continue
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim()
            if (data && data !== '[DONE]') {
               try {
                 // 尝试处理可能包含的引号或 JSON 格式
                 let rawAudio = data
                 
                 // 1. 尝试解析为 JSON
                  if (data.startsWith('{')) {
                    try {
                      const jsonData = JSON.parse(data)
                      // 根据 GLM-4 协议 (OpenAI 兼容)
                      // 结构通常是: {"id":..., "choices": [{"delta": {"audio": "..."}}]}
                      // 或者直接 data chunk
                      if (jsonData.audio) rawAudio = jsonData.audio
                      else if (jsonData.data) rawAudio = jsonData.data
                      else if (jsonData.choices && jsonData.choices[0]) {
                         const choice = jsonData.choices[0]
                         if (choice.delta && choice.delta.audio) rawAudio = choice.delta.audio
                         else if (choice.audio) rawAudio = choice.audio
                         else if (choice.delta && choice.delta.content) rawAudio = choice.delta.content // 某些非标准实现
                      }
                      
                      // 如果没有找到 audio 数据，可能是元数据帧（如 finish_reason），跳过
                      if (rawAudio === data || typeof rawAudio !== 'string') {
                         return 
                      }
                    } catch (e) {
                      // JSON 解析失败，回退到原始字符串
                    }
                  } 
                 // 2. 去除可能存在的首尾引号
                 else if (data.startsWith('"') && data.endsWith('"')) {
                   rawAudio = data.slice(1, -1)
                 }

                 pcmPlayer.playChunk(rawAudio)
               } catch (e) {
                 console.warn('Failed to parse chunk', e)
                 console.warn('Chunk data snippet:', data.slice(0, 50))
               }
            }
          }
        }
      }
      ElMessage.success('流式播放结束')
      
    } else {
      // 非流式处理 (WAV)
      const blob = await response.blob()
      audioUrl.value = URL.createObjectURL(blob)
      ElMessage.success('生成成功，正在播放')
      
      // Ensure audio plays (sometimes browsers block auto-play)
      setTimeout(() => {
        if (audioRef.value) {
          audioRef.value.play().catch(e => {
            console.warn('Auto-play blocked:', e)
            ElMessage.info('请点击播放按钮播放音频')
          })
        }
      }, 100)
    }

  } catch (error: any) {
    console.error(error)
    errorMsg.value = error.message || '发生未知错误'
    ElMessage.error('生成失败')
  } finally {
    loading.value = false
  }
}

onUnmounted(() => {
  if (audioUrl.value) {
    URL.revokeObjectURL(audioUrl.value)
  }
})
</script>

<style scoped>
.app-container {
  padding: 20px;
}
.audio-player {
  margin-top: 20px;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}
.player-title {
  font-weight: bold;
  margin-bottom: 10px;
  color: #606266;
}
.streaming-status {
  margin-top: 20px;
  text-align: center;
}
.error-msg {
  margin-top: 20px;
}
</style>
