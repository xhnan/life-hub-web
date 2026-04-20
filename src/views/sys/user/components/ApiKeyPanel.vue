<template>
  <div class="api-key-panel">
    <section class="api-toolbar">
      <div class="toolbar-title">
        <h2>API Key 管理</h2>
        <p>用于第三方发布、CI 流程和自动化调用。</p>
      </div>

      <div class="toolbar-summary" aria-label="API Key 概览">
        <span class="summary-chip">
          <span class="summary-label">全部</span>
          <strong class="summary-value">{{ tableData.length }}</strong>
        </span>
        <span class="summary-chip summary-chip--green">
          <span class="summary-label">生效中</span>
          <strong class="summary-value">{{ activeCount }}</strong>
        </span>
        <span class="summary-chip summary-chip--amber">
          <span class="summary-label">已失效</span>
          <strong class="summary-value">{{ revokedCount + expiredCount }}</strong>
        </span>
      </div>

      <div class="toolbar-actions">
        <el-button plain @click="loadApiKeys">刷新列表</el-button>
        <el-button type="primary" @click="dialogVisible = true">创建 API Key</el-button>
      </div>
    </section>

    <section class="table-card">
      <div class="card-header">
        <div>
          <div class="card-title">Key 列表</div>
          <div class="card-subtitle">查看状态、允许路径、使用时间与撤销操作</div>
        </div>
      </div>

      <div class="table-wrap">
        <el-table :data="tableData" v-loading="loading" stripe height="100%" class="api-table">
          <template #empty>
            <div class="empty-state">
              <div class="empty-title">还没有 API Key</div>
              <div class="empty-desc">先创建一个 Key，用于快速发布或第三方自动化调用。</div>
              <el-button type="primary" @click="dialogVisible = true">立即创建</el-button>
            </div>
          </template>

          <el-table-column prop="keyName" label="名称" min-width="180">
            <template #default="{ row }">
              <div class="primary-cell">
                <span class="primary-text">{{ row.keyName }}</span>
                <span v-if="row.description" class="secondary-text">{{ row.description }}</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="maskedKey" label="Key" min-width="220" show-overflow-tooltip>
            <template #default="{ row }">
              <code class="masked-key">{{ row.maskedKey }}</code>
            </template>
          </el-table-column>

          <el-table-column label="允许路径" min-width="320">
            <template #default="{ row }">
              <div v-if="row.allowedPaths?.length" class="path-list">
                <span v-for="path in row.allowedPaths" :key="path" class="path-chip">{{ path }}</span>
              </div>
              <span v-else class="muted-text">未配置</span>
            </template>
          </el-table-column>

          <el-table-column label="状态" width="120">
            <template #default="{ row }">
              <el-tag :type="statusTagType[row.status]" effect="light" round>
                {{ statusLabelMap[row.status] ?? row.status }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="最近使用" width="180">
            <template #default="{ row }">
              <span class="mono-cell">{{ formatDateTime(row.lastUsedAt) }}</span>
            </template>
          </el-table-column>

          <el-table-column label="过期时间" width="180">
            <template #default="{ row }">
              <span class="mono-cell">{{ formatDateTime(row.expiresAt) }}</span>
            </template>
          </el-table-column>

          <el-table-column label="创建时间" width="180">
            <template #default="{ row }">
              <span class="mono-cell">{{ formatDateTime(row.createdAt) }}</span>
            </template>
          </el-table-column>

          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row }">
              <el-button
                type="danger"
                link
                :disabled="row.status !== 'active'"
                @click="handleRevoke(row)"
              >
                撤销
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </section>

    <api-key-dialog v-model="dialogVisible" @success="handleCreateSuccess" />

    <el-dialog
      v-model="resultDialogVisible"
      title="请立即保存 API Key"
      width="680px"
      :close-on-click-modal="false"
    >
      <div class="result-box">
        <el-alert
          title="该明文 Key 只展示这一次，关闭弹窗后将无法再次查看。"
          type="warning"
          :closable="false"
          show-icon
        />

        <div class="result-card">
          <div class="result-row">
            <span class="result-label">名称</span>
            <span class="result-value">{{ createdResult?.keyName }}</span>
          </div>
          <div class="result-row">
            <span class="result-label">Key 前缀</span>
            <code class="result-value">{{ createdResult?.keyPrefix }}</code>
          </div>
          <div class="result-row result-row--top">
            <span class="result-label">允许路径</span>
            <div class="path-list">
              <span
                v-for="path in createdResult?.allowedPaths ?? []"
                :key="path"
                class="path-chip"
              >
                {{ path }}
              </span>
            </div>
          </div>
          <div class="result-row result-row--top">
            <span class="result-label">明文 Key</span>
            <div class="secret-box">
              <code class="secret-value">{{ createdResult?.apiKey ?? "" }}</code>
              <el-button type="primary" plain @click="handleCopyKey">复制 Key</el-button>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button type="primary" @click="resultDialogVisible = false">我已保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import dayjs from "dayjs";
import { ElMessage, ElMessageBox } from "element-plus";
import ApiKeyDialog from "./ApiKeyDialog.vue";
import type { ApiKeyItem, ApiKeyStatus, CreateApiKeyResult } from "@/api/userApiKeyApi";
import { getUserApiKeyListApi, revokeUserApiKeyApi } from "@/api/userApiKeyApi";

const loading = ref(false);
const dialogVisible = ref(false);
const resultDialogVisible = ref(false);
const tableData = ref<ApiKeyItem[]>([]);
const createdResult = ref<CreateApiKeyResult | null>(null);

const statusLabelMap: Record<ApiKeyStatus, string> = {
  active: "生效中",
  revoked: "已撤销",
  expired: "已过期"
};

const statusTagType: Record<ApiKeyStatus, "success" | "danger" | "info" | "warning"> = {
  active: "success",
  revoked: "danger",
  expired: "info"
};

const activeCount = computed(() => tableData.value.filter(item => item.status === "active").length);
const revokedCount = computed(() => tableData.value.filter(item => item.status === "revoked").length);
const expiredCount = computed(() => tableData.value.filter(item => item.status === "expired").length);

function formatDateTime(value?: string) {
  return value ? dayjs(value).format("YYYY-MM-DD HH:mm:ss") : "-";
}

async function loadApiKeys() {
  loading.value = true;
  try {
    const res = await getUserApiKeyListApi();
    tableData.value = res.data ?? [];
  } catch (error: any) {
    ElMessage.error(error?.message || "获取 API Key 列表失败");
  } finally {
    loading.value = false;
  }
}

function handleCreateSuccess(result: CreateApiKeyResult) {
  createdResult.value = result;
  resultDialogVisible.value = true;
  void loadApiKeys();
}

async function handleCopyKey() {
  if (!createdResult.value?.apiKey) return;

  try {
    await navigator.clipboard.writeText(createdResult.value.apiKey);
    ElMessage.success("API Key 已复制");
  } catch {
    ElMessage.error("复制失败，请手动保存");
  }
}

async function handleRevoke(row: ApiKeyItem) {
  try {
    await ElMessageBox.confirm(
      `撤销后，API Key“${row.keyName}”将立即失效，第三方调用会被拒绝。是否继续？`,
      "撤销确认",
      {
        type: "warning",
        confirmButtonText: "确认撤销",
        cancelButtonText: "取消"
      }
    );

    await revokeUserApiKeyApi(row.id);
    ElMessage.success("API Key 已撤销");
    await loadApiKeys();
  } catch (error: any) {
    if (error !== "cancel") {
      ElMessage.error(error?.message || "撤销 API Key 失败");
    }
  }
}

onMounted(() => {
  void loadApiKeys();
});
</script>

<style scoped lang="scss">
.api-key-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.api-toolbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid #e6ecf5;
  border-radius: 16px;
  background: linear-gradient(145deg, #f8fbff 0%, #eef6ff 48%, #ffffff 100%);
}

.toolbar-title {
  min-width: 0;
}

.toolbar-title h2 {
  margin: 0;
  font-size: 20px;
  line-height: 1.2;
  color: #0f172a;
}

.toolbar-title p {
  margin: 4px 0 0;
  font-size: 12px;
  color: #64748b;
}

.toolbar-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.summary-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid #dbe7f3;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.86);
}

.summary-chip--green {
  background: #f6fef9;
}

.summary-chip--amber {
  background: #fffaf0;
}

.summary-label {
  font-size: 12px;
  color: #64748b;
}

.summary-value {
  font-size: 18px;
  line-height: 1;
  color: #0f172a;
  font-variant-numeric: tabular-nums;
}

.toolbar-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.table-card {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
  padding: 14px 16px;
  border: 1px solid #e7edf5;
  border-radius: 18px;
  background: #ffffff;
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 10px;
}

.card-title {
  font-size: 17px;
  font-weight: 700;
  color: #0f172a;
}

.card-subtitle {
  margin-top: 4px;
  font-size: 12px;
  color: #64748b;
}

.table-wrap {
  min-height: 0;
  flex: 1;
  overflow: hidden;
}

.api-table :deep(.el-table__inner-wrapper::before) {
  display: none;
}

.api-table :deep(.el-table__cell) {
  padding: 12px 0;
}

.api-table :deep(.el-table__body-wrapper) {
  overflow-y: auto;
  overflow-x: auto;
}

.primary-cell {
  min-width: 0;
}

.primary-text {
  display: block;
  font-weight: 600;
  color: #0f172a;
}

.secondary-text {
  display: block;
  margin-top: 4px;
  color: #64748b;
  line-height: 1.5;
  word-break: break-word;
}

.masked-key,
.mono-cell,
.result-value,
.secret-value {
  font-family: "Consolas", "SFMono-Regular", "Roboto Mono", monospace;
  font-variant-numeric: tabular-nums;
}

.masked-key,
.mono-cell {
  color: #334155;
}

.path-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.path-chip {
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  padding: 6px 10px;
  border: 1px solid #dbe7f3;
  border-radius: 999px;
  background: #f8fbff;
  color: #0f172a;
  font-size: 12px;
  line-height: 1.4;
  word-break: break-word;
}

.muted-text {
  color: #94a3b8;
}

.empty-state {
  padding: 36px 0;
}

.empty-title {
  font-size: 17px;
  font-weight: 700;
  color: #0f172a;
}

.empty-desc {
  margin: 8px 0 18px;
  color: #64748b;
}

.result-box {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.result-card {
  padding: 18px;
  border: 1px solid #e6edf5;
  border-radius: 18px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
}

.result-row {
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr);
  gap: 16px;
  align-items: center;
  padding: 10px 0;
}

.result-row + .result-row {
  border-top: 1px dashed #e2e8f0;
}

.result-row--top {
  align-items: start;
}

.result-label {
  color: #64748b;
}

.secret-box {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  min-width: 0;
}

.secret-value {
  display: block;
  flex: 1;
  min-width: 0;
  padding: 12px 14px;
  overflow-wrap: anywhere;
  border-radius: 14px;
  background: #0f172a;
  color: #f8fafc;
}

@media (max-width: 1200px) {
  .api-toolbar {
    grid-template-columns: 1fr;
    align-items: flex-start;
  }

  .toolbar-actions {
    justify-content: flex-start;
  }
}

@media (max-width: 900px) {
  .api-key-panel {
    overflow: auto;
  }

  .table-card,
  .table-wrap {
    overflow: visible;
  }

  .result-row,
  .secret-box {
    grid-template-columns: 1fr;
  }
}
</style>
