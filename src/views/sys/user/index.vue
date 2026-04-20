<template>
  <div class="user-page">
    <section class="page-hero">
      <div>
        <p class="page-eyebrow">Access Control</p>
        <h1>用户与 API Key 管理</h1>
        <p class="page-desc">
          统一管理后台用户、角色分配与第三方发布凭证。页面采用固定高度布局，避免外层滚动条干扰操作。
        </p>
      </div>
      <div class="hero-metrics">
        <div class="metric-card">
          <span class="metric-label">当前用户数</span>
          <strong class="metric-value">{{ total }}</strong>
        </div>
        <div class="metric-card metric-card--soft">
          <span class="metric-label">当前模式</span>
          <strong class="metric-mode">{{ activeTab === "users" ? "用户管理" : "API Key 管理" }}</strong>
        </div>
      </div>
    </section>

    <section class="workspace-shell">
      <div class="workspace-tabs" role="tablist" aria-label="用户与 API Key 管理">
        <button
          type="button"
          class="tab-button"
          :class="{ active: activeTab === 'users' }"
          :aria-selected="activeTab === 'users'"
          @click="activeTab = 'users'"
        >
          用户管理
        </button>
        <button
          type="button"
          class="tab-button"
          :class="{ active: activeTab === 'apiKeys' }"
          :aria-selected="activeTab === 'apiKeys'"
          @click="activeTab = 'apiKeys'"
        >
          API Key 管理
        </button>
      </div>

      <div v-if="activeTab === 'users'" class="workspace-panel workspace-panel--users">
        <section class="filter-card">
          <div class="filter-main">
            <el-form :inline="true" :model="searchForm" class="filter-form">
              <el-form-item label="用户名">
                <el-input
                  v-model="searchForm.username"
                  placeholder="请输入用户名"
                  clearable
                  style="width: 200px"
                />
              </el-form-item>
              <el-form-item label="昵称">
                <el-input
                  v-model="searchForm.nickname"
                  placeholder="请输入昵称"
                  clearable
                  style="width: 200px"
                />
              </el-form-item>
              <el-form-item label="状态">
                <el-select
                  v-model="searchForm.status"
                  placeholder="请选择状态"
                  clearable
                  style="width: 180px"
                >
                  <el-option label="正常" value="active" />
                  <el-option label="停用" value="inactive" />
                  <el-option label="禁用" value="banned" />
                </el-select>
              </el-form-item>
            </el-form>
          </div>

          <div class="filter-actions">
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button @click="handleReset">重置</el-button>
            <el-button type="success" @click="handleAdd">新增用户</el-button>
          </div>
        </section>

        <section class="table-card">
          <div class="table-header">
            <div>
              <div class="table-title">用户列表</div>
              <div class="table-subtitle">支持搜索、编辑、删除与分配角色</div>
            </div>
          </div>

          <div class="table-wrap">
            <el-table
              :data="tableData"
              v-loading="loading"
              stripe
              height="100%"
              class="user-table"
            >
              <el-table-column prop="userId" label="ID" width="80" />
              <el-table-column prop="username" label="用户名" min-width="140" />
              <el-table-column prop="nickname" label="昵称" min-width="140" />
              <el-table-column prop="email" label="邮箱" min-width="220" show-overflow-tooltip />
              <el-table-column prop="phone" label="手机号" min-width="150" />
              <el-table-column prop="gender" label="性别" width="90">
                <template #default="{ row }">
                  <el-tag v-if="row.gender === 1" type="primary" round>男</el-tag>
                  <el-tag v-else-if="row.gender === 2" type="danger" round>女</el-tag>
                  <el-tag v-else type="info" round>未知</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="status" label="状态" width="90">
                <template #default="{ row }">
                  <el-tag v-if="row.status === 'active'" type="success" round>正常</el-tag>
                  <el-tag v-else-if="row.status === 'inactive'" type="info" round>停用</el-tag>
                  <el-tag v-else-if="row.status === 'banned'" type="danger" round>禁用</el-tag>
                  <el-tag v-else type="info" round>未知</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="createdAt" label="创建时间" width="180" />
              <el-table-column label="操作" width="260" fixed="right">
                <template #default="{ row }">
                  <div class="row-actions">
                    <el-button type="success" size="small" plain @click="handleAssignRole(row)">分配角色</el-button>
                    <el-button type="primary" size="small" plain @click="handleEdit(row)">编辑</el-button>
                    <el-button type="danger" size="small" plain @click="handleDelete(row)">删除</el-button>
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <div class="pager-wrap">
            <el-pagination
              v-model:current-page="pageParams.pageNum"
              v-model:page-size="pageParams.pageSize"
              :page-sizes="[10, 20, 50, 100]"
              :total="total"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
        </section>

        <user-dialog
          v-model="dialogVisible"
          :title="dialogTitle"
          :is-edit="isEdit"
          :user-data="dialogUserData"
          @success="handleDialogSuccess"
        />

        <user-role-dialog ref="userRoleDialogRef" @success="loadUserList" />
      </div>

      <div v-else class="workspace-panel workspace-panel--api">
        <api-key-panel />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import UserDialog from "@/views/sys/user/components/user-dialog.vue";
import UserRoleDialog from "./components/user-role-dialog.vue";
import ApiKeyPanel from "./components/ApiKeyPanel.vue";
import { deleteUserApi, getUserListPageApi, type PageParams, type UserRow } from "@/api/userApi";

const activeTab = ref<"users" | "apiKeys">("users");
const loading = ref(false);
const tableData = ref<UserRow[]>([]);
const total = ref(0);

const pageParams = reactive<PageParams>({
  pageNum: 1,
  pageSize: 10
});

const searchForm = reactive({
  username: "",
  nickname: "",
  status: "" as string | undefined
});

const dialogVisible = ref(false);
const dialogTitle = ref("");
const isEdit = ref(false);
const dialogUserData = ref<UserRow | null>(null);
const userRoleDialogRef = ref();

const loadUserList = async () => {
  loading.value = true;
  try {
    const res = await getUserListPageApi({
      ...pageParams,
      ...searchForm
    });
    tableData.value = res.data.records || [];
    total.value = res.data.total || 0;
  } catch (error: any) {
    ElMessage.error(error?.message || "获取用户列表失败");
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  pageParams.pageNum = 1;
  void loadUserList();
};

const handleReset = () => {
  searchForm.username = "";
  searchForm.nickname = "";
  searchForm.status = undefined;
  pageParams.pageNum = 1;
  void loadUserList();
};

const handleAdd = () => {
  dialogTitle.value = "新增用户";
  isEdit.value = false;
  dialogUserData.value = null;
  dialogVisible.value = true;
};

const handleEdit = (row: UserRow) => {
  dialogTitle.value = "编辑用户";
  isEdit.value = true;
  dialogUserData.value = row;
  dialogVisible.value = true;
};

const handleDialogSuccess = () => {
  void loadUserList();
};

const handleAssignRole = (row: UserRow) => {
  userRoleDialogRef.value?.openDialog(row);
};

const handleDelete = async (row: UserRow) => {
  try {
    await ElMessageBox.confirm(
      `确定删除用户“${row.username}”吗？`,
      "删除确认",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }
    );

    await deleteUserApi(row.userId);
    ElMessage.success("删除成功");
    await loadUserList();
  } catch (error: any) {
    if (error !== "cancel") {
      ElMessage.error(error?.message || "删除失败");
    }
  }
};

const handleSizeChange = () => {
  pageParams.pageNum = 1;
  void loadUserList();
};

const handleCurrentChange = () => {
  void loadUserList();
};

onMounted(() => {
  void loadUserList();
});
</script>

<style scoped lang="scss">
.user-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.page-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(260px, 0.7fr);
  gap: 16px;
  padding: 24px 26px;
  border: 1px solid #e6ecf5;
  border-radius: 24px;
  background:
    radial-gradient(circle at top left, rgba(14, 165, 233, 0.14), transparent 32%),
    linear-gradient(145deg, #f7fbff 0%, #eef6ff 46%, #ffffff 100%);
}

.page-eyebrow {
  margin: 0 0 10px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #0369a1;
}

.page-hero h1 {
  margin: 0;
  font-size: 30px;
  line-height: 1.15;
  color: #0f172a;
}

.page-desc {
  max-width: 720px;
  margin: 12px 0 0;
  color: #475569;
  line-height: 1.7;
}

.hero-metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.metric-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 120px;
  padding: 18px;
  border: 1px solid #dbe7f3;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.86);
}

.metric-card--soft {
  background: linear-gradient(180deg, #f6fef9 0%, #ffffff 100%);
}

.metric-label {
  font-size: 13px;
  color: #64748b;
}

.metric-value,
.metric-mode {
  color: #0f172a;
  font-weight: 700;
}

.metric-value {
  font-size: 34px;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.metric-mode {
  font-size: 18px;
  line-height: 1.35;
}

.workspace-shell {
  display: flex;
  flex-direction: column;
  gap: 14px;
  flex: 1;
  min-height: 0;
  padding: 14px;
  border: 1px solid #e6ecf5;
  border-radius: 24px;
  background: #fbfdff;
  overflow: hidden;
}

.workspace-tabs {
  display: inline-flex;
  gap: 8px;
  align-self: flex-start;
  padding: 6px;
  border-radius: 16px;
  background: #eef4fa;
}

.tab-button {
  min-width: 126px;
  padding: 10px 18px;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: #64748b;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s ease;
}

.tab-button:hover,
.tab-button:focus-visible {
  color: #0f172a;
  outline: none;
}

.tab-button.active {
  background: #ffffff;
  color: #0f172a;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08);
}

.workspace-panel {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.workspace-panel--users {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.workspace-panel--api {
  height: 100%;
}

.filter-card {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px;
  border: 1px solid #e7edf5;
  border-radius: 20px;
  background: #ffffff;
}

.filter-main {
  min-width: 0;
  flex: 1;
}

.filter-form {
  display: flex;
  flex-wrap: wrap;
}

.filter-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.table-card {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
  padding: 18px 20px 16px;
  border: 1px solid #e7edf5;
  border-radius: 20px;
  background: #ffffff;
  overflow: hidden;
}

.table-header {
  flex-shrink: 0;
  margin-bottom: 14px;
}

.table-title {
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
}

.table-subtitle {
  margin-top: 4px;
  font-size: 13px;
  color: #64748b;
}

.table-wrap {
  min-height: 0;
  flex: 1;
  overflow: hidden;
}

.user-table {
  height: 100%;
}

.user-table :deep(.el-table__inner-wrapper::before) {
  display: none;
}

.user-table :deep(.el-table__cell) {
  padding: 14px 0;
}

.user-table :deep(.el-table__body-wrapper) {
  overflow-y: auto;
  overflow-x: auto;
}

.row-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.pager-wrap {
  display: flex;
  justify-content: flex-end;
  flex-shrink: 0;
  margin-top: 14px;
}

@media (max-width: 1100px) {
  .page-hero {
    grid-template-columns: 1fr;
  }

  .hero-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .user-page {
    overflow: auto;
  }

  .workspace-shell,
  .workspace-panel,
  .table-card,
  .table-wrap {
    overflow: visible;
  }

  .filter-card {
    flex-direction: column;
  }

  .hero-metrics {
    grid-template-columns: 1fr;
  }

  .workspace-tabs {
    width: 100%;
  }

  .tab-button {
    flex: 1;
  }
}
</style>
