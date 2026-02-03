<template>
  <div class="generate-container">
    <div class="main-card">
      <div class="header">
        <div class="icon-wrapper">
          <el-icon :size="32" color="#4f46e5"><Cpu /></el-icon>
        </div>
        <h1>AI 代码生成</h1>
        <p class="subtitle">描述您的需求，让 AI 为您编写高质量代码</p>
      </div>

      <div class="content">
        <div class="input-wrapper">
          <el-input
            v-model="description"
            type="textarea"
            :rows="8"
            placeholder="例如：生成sys模块的代码"
            class="custom-textarea"
            resize="none"
          />
          <div class="input-footer">
            <span class="word-count">{{ description.length }}/2000</span>
          </div>
        </div>
        
        <div class="actions">
          <el-button 
            type="primary" 
            size="large" 
            @click="handleGenerate" 
            :loading="loading"
            class="generate-btn"
            round
          >
            <el-icon class="el-icon--left"><Promotion /></el-icon>
            {{ loading ? '正在生成...' : '开始生成' }}
          </el-button>
        </div>

        <transition name="fade">
          <div v-if="generatedCode" class="result-box">
            <div class="result-header">
              <div class="header-left">
                <el-icon><Document /></el-icon>
                <span>生成结果</span>
              </div>
              <el-button 
                type="primary" 
                link 
                size="small" 
                @click="copyCode"
                class="copy-btn"
              >
                <el-icon class="el-icon--left"><CopyDocument /></el-icon>
                复制代码
              </el-button>
            </div>
            <div class="code-content">
              <pre><code>{{ generatedCode }}</code></pre>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import { Promotion, CopyDocument, Document, Cpu } from '@element-plus/icons-vue';
import { generateCodeApi } from '@/api/aiApi';

const description = ref('');
const loading = ref(false);
const generatedCode = ref('');

const handleGenerate = async () => {
  if (!description.value.trim()) {
    ElMessage.warning('请输入需求描述');
    return;
  }

  loading.value = true;
  generatedCode.value = '';

  try {
    const res = await generateCodeApi({
      prompt: description.value
    });

    if (res.code === 200 && res.data) {
      generatedCode.value = res.data.code;
      ElMessage.success('生成成功');
    } else {
      ElMessage.error(res.message || '生成失败');
    }
  } catch (error) {
    console.error(error);
    ElMessage.error('请求失败，请稍后重试');
  } finally {
    loading.value = false;
  }
};

const copyCode = async () => {
  if (!generatedCode.value) return;
  try {
    await navigator.clipboard.writeText(generatedCode.value);
    ElMessage.success('已复制到剪贴板');
  } catch (err) {
    ElMessage.error('复制失败');
  }
};
</script>

<style scoped lang="scss">
.generate-container {
  padding: 24px;
  height: 100%;
  background-color: #f8fafc;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  box-sizing: border-box;
  overflow: hidden;
}

.main-card {
  width: 100%;
  max-width: 900px;
  height: 100%;
  background: #fff;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01);
  display: flex;
  flex-direction: column;
  gap: 24px;
  box-sizing: border-box;
}

.header {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
  
  .icon-wrapper {
    width: 56px;
    height: 56px;
    background-color: rgba(79, 70, 229, 0.1);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 4px;
  }
  
  h1 {
    font-size: 24px;
    font-weight: 700;
    color: #1e293b;
    margin: 0;
    letter-spacing: -0.5px;
  }
  
  .subtitle {
    color: #64748b;
    font-size: 14px;
    margin: 0;
    max-width: 600px;
    line-height: 1.5;
  }
}

.content {
  display: flex;
  flex-direction: column;
  gap: 24px;
  flex: 1;
  min-height: 0; /* Important for flex child scrolling */
}

.input-wrapper {
  position: relative;
  flex-shrink: 0;
  
  .custom-textarea {
    :deep(.el-textarea__inner) {
      padding: 16px;
      border-radius: 12px;
      background-color: #f8fafc;
      border: 2px solid #e2e8f0;
      font-size: 14px;
      line-height: 1.6;
      transition: all 0.3s ease;
      height: 120px; /* Fixed height to save space */
      
      &:focus {
        background-color: #fff;
        border-color: #4f46e5;
        box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1);
      }
      
      &::placeholder {
        color: #94a3b8;
      }
    }
  }
  
  .input-footer {
    display: flex;
    justify-content: flex-end;
    margin-top: 4px;
    padding: 0 4px;
    
    .word-count {
      font-size: 12px;
      color: #94a3b8;
    }
  }
}

.actions {
  display: flex;
  justify-content: center;
  flex-shrink: 0;
  
  .generate-btn {
    width: 200px;
    height: 44px;
    font-size: 15px;
    background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
    border: none;
    font-weight: 600;
    letter-spacing: 0.5px;
    transition: all 0.3s ease;
    box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.3);
    }
    
    &:active {
      transform: translateY(0);
    }
  }
}

.result-box {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  background-color: #fff;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0; /* Crucial for scrolling */
  
  .result-header {
    background-color: #f8fafc;
    padding: 10px 16px;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;
    
    .header-left {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #334155;
      font-weight: 600;
      font-size: 14px;
    }
    
    .copy-btn {
      font-weight: 500;
      
      &:hover {
        color: #4f46e5;
      }
    }
  }
  
  .code-content {
    position: relative;
    flex: 1;
    overflow: auto; /* Enable internal scrolling */
    
    pre {
      margin: 0;
      padding: 20px;
      background-color: #1e293b;
      color: #f1f5f9;
      font-family: 'JetBrains Mono', 'Fira Code', Consolas, Monaco, monospace;
      font-size: 13px;
      line-height: 1.6;
      min-height: 100%;
      box-sizing: border-box;
      tab-size: 2;
      
      code {
        font-family: inherit;
      }
    }
  }
}

/* Animations */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
