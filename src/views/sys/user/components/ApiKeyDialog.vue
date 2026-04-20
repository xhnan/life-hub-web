<template>
  <el-dialog
    v-model="dialogVisible"
    title="创建 API Key"
    width="680px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="dialog-shell">
      <div class="dialog-lead">
        <p class="lead-eyebrow">Least Privilege First</p>
        <h3>为自动化流程创建受限凭证</h3>
        <p class="lead-desc">
          建议只开放必要接口，并尽量设置过期时间。你可以输入一条或多条路径，提交前输入框中的内容也会自动加入列表。
        </p>
      </div>

      <el-alert
        title="如果未填写允许路径，后端会默认只开放 /sys/app-version/quick-publish。"
        type="info"
        :closable="false"
        show-icon
      />

      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="110px" class="api-form">
        <el-form-item label="Key 名称" prop="keyName">
          <el-input
            v-model="formData.keyName"
            placeholder="例如：安卓自动发布…"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="用途说明" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="例如：给 CI 流水线与第三方发布工具使用…"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="允许路径" prop="allowedPaths">
          <div class="path-field">
            <el-input
              v-model="pathInput"
              placeholder="例如 /sys/app-version/quick-publish 或 /fin/**…"
              @keyup.enter="handleAddPath"
              @blur="handlePathBlur"
            >
              <template #append>
                <el-button @click="handleAddPath">添加</el-button>
              </template>
            </el-input>

            <div class="preset-list">
              <button type="button" class="preset-chip" @click="applyPreset('/sys/app-version/quick-publish')">
                /sys/app-version/quick-publish
              </button>
              <button type="button" class="preset-chip" @click="applyPreset('/fin/**')">
                /fin/**
              </button>
            </div>

            <div v-if="formData.allowedPaths.length" class="path-tags">
              <span
                v-for="path in formData.allowedPaths"
                :key="path"
                class="path-chip"
              >
                <span>{{ path }}</span>
                <button type="button" class="remove-chip" :aria-label="`移除路径 ${path}`" @click="handleRemovePath(path)">
                  ×
                </button>
              </span>
            </div>
          </div>
        </el-form-item>

        <el-form-item label="过期时间" prop="expiresAt">
          <el-date-picker
            v-model="formData.expiresAt"
            type="datetime"
            value-format="YYYY-MM-DDTHH:mm:ss"
            placeholder="不填写表示不过期"
            style="width: 100%"
            clearable
          />
        </el-form-item>
      </el-form>
    </div>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
        {{ submitLoading ? "创建中…" : "保存并生成 Key" }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import { ElMessage, type FormInstance, type FormRules } from "element-plus";
import type { CreateApiKeyPayload, CreateApiKeyResult } from "@/api/userApiKeyApi";
import { createUserApiKeyApi } from "@/api/userApiKeyApi";

interface Emits {
  (e: "update:modelValue", value: boolean): void;
  (e: "success", value: CreateApiKeyResult): void;
}

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<Emits>();

const dialogVisible = ref(false);
const submitLoading = ref(false);
const formRef = ref<FormInstance>();
const pathInput = ref("");

const formData = reactive({
  keyName: "",
  description: "",
  allowedPaths: [] as string[],
  expiresAt: ""
});

const formRules: FormRules = {
  keyName: [{ required: true, message: "请输入 Key 名称", trigger: "blur" }]
};

watch(
  () => props.modelValue,
  value => {
    dialogVisible.value = value;
    if (value) {
      resetForm();
    }
  }
);

watch(dialogVisible, value => {
  if (!value) {
    emit("update:modelValue", false);
  }
});

function normalizePath(path: string) {
  return path.trim();
}

function tryAppendPath() {
  const normalized = normalizePath(pathInput.value);
  if (!normalized) {
    return true;
  }

  if (!normalized.startsWith("/")) {
    ElMessage.warning("路径必须以 / 开头");
    return false;
  }

  if (!formData.allowedPaths.includes(normalized)) {
    formData.allowedPaths.push(normalized);
  }

  pathInput.value = "";
  return true;
}

function handleAddPath() {
  tryAppendPath();
}

function handlePathBlur() {
  if (pathInput.value.trim()) {
    tryAppendPath();
  }
}

function applyPreset(path: string) {
  pathInput.value = path;
  tryAppendPath();
}

function handleRemovePath(path: string) {
  formData.allowedPaths = formData.allowedPaths.filter(item => item !== path);
}

function resetForm() {
  formData.keyName = "";
  formData.description = "";
  formData.allowedPaths = [];
  formData.expiresAt = "";
  pathInput.value = "";
  formRef.value?.clearValidate();
}

function handleClose() {
  dialogVisible.value = false;
}

async function handleSubmit() {
  if (!formRef.value) return;

  if (!tryAppendPath()) {
    return;
  }

  try {
    await formRef.value.validate();
  } catch {
    return;
  }

  submitLoading.value = true;

  try {
    const payload: CreateApiKeyPayload = {
      keyName: formData.keyName.trim()
    };

    if (formData.description.trim()) {
      payload.description = formData.description.trim();
    }

    if (formData.allowedPaths.length) {
      payload.allowedPaths = [...formData.allowedPaths];
    }

    if (formData.expiresAt) {
      payload.expiresAt = formData.expiresAt;
    }

    const res = await createUserApiKeyApi(payload);
    ElMessage.success("API Key 创建成功");
    emit("success", res.data);
    handleClose();
  } catch (error: any) {
    ElMessage.error(error?.message || "创建 API Key 失败");
  } finally {
    submitLoading.value = false;
  }
}
</script>

<style scoped lang="scss">
.dialog-shell {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.dialog-lead {
  padding: 2px 0;
}

.lead-eyebrow {
  margin: 0 0 10px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #0369a1;
}

.dialog-lead h3 {
  margin: 0;
  font-size: 24px;
  line-height: 1.2;
  color: #0f172a;
  text-wrap: balance;
}

.lead-desc {
  margin: 10px 0 0;
  line-height: 1.7;
  color: #475569;
}

.api-form {
  padding: 14px 16px 4px;
  border: 1px solid #e6edf5;
  border-radius: 18px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
}

.path-field {
  width: 100%;
}

.preset-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.preset-chip {
  padding: 7px 10px;
  border: 1px solid #dbe7f3;
  border-radius: 999px;
  background: #ffffff;
  color: #0f172a;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.18s ease;
}

.preset-chip:hover {
  border-color: #7dd3fc;
  background: #f0f9ff;
}

.path-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}

.path-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  max-width: 100%;
  padding: 7px 10px;
  border: 1px solid #dbe7f3;
  border-radius: 999px;
  background: #f8fbff;
  color: #0f172a;
  font-size: 12px;
  line-height: 1.4;
}

.remove-chip {
  padding: 0;
  border: 0;
  background: transparent;
  color: #64748b;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
}

.remove-chip:hover {
  color: #dc2626;
}

@media (max-width: 720px) {
  .api-form {
    padding: 14px 10px 4px;
  }
}
</style>
