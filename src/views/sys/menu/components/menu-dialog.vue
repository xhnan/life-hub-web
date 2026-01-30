<template>
  <el-dialog
    v-model="dialogVisible"
    :title="title"
    width="680px"
    @close="handleClose"
    class="menu-dialog glass-effect"
    :close-on-click-modal="false"
    destroy-on-close
    align-center
  >
    <div v-loading="dataLoading" class="dialog-content">
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
        class="menu-form"
        label-position="right"
      >
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="父级菜单" prop="parentId">
              <el-tree-select
                v-model="formData.parentId"
                :data="menuTreeData"
                :props="treeProps"
                check-strictly
                :render-after-expand="false"
                placeholder="请选择父级菜单，留空为根菜单"
                style="width: 100%"
                clearable
                class="modern-input"
              />
            </el-form-item>
          </el-col>
          
          <el-col :span="12">
            <el-form-item label="菜单名称" prop="menuName">
              <el-input v-model="formData.menuName" placeholder="请输入菜单名称" class="modern-input" />
            </el-form-item>
          </el-col>
          
          <el-col :span="12">
            <el-form-item label="路由名称" prop="routerName">
              <el-input v-model="formData.routerName" placeholder="英文标识 (如: SystemUser)" class="modern-input" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="菜单类型" prop="menuType">
              <el-select v-model="formData.menuType" placeholder="请选择" style="width: 100%" class="modern-input">
                <el-option label="目录" :value="1" />
                <el-option label="菜单" :value="2" />
                <el-option label="按钮" :value="3" />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="图标" prop="icon">
              <icon-selector v-model="formData.icon" />
            </el-form-item>
          </el-col>

          <el-col :span="24">
             <el-form-item label="菜单路径" prop="path">
              <el-input v-model="formData.path" placeholder="路由路径 (如: /sys/user)" class="modern-input" />
            </el-form-item>
          </el-col>

          <el-col :span="24" v-if="formData.menuType === 2">
            <el-form-item label="组件路径" prop="component">
              <el-input v-model="formData.component" placeholder="组件路径 (如: sys/user/index)" class="modern-input" />
            </el-form-item>
          </el-col>
          
          <el-col :span="24">
            <el-form-item label="权限标识" prop="menuCode">
              <el-input v-model="formData.menuCode" placeholder="权限字符 (如: sys:user:list)" class="modern-input" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="排序" prop="sortOrder">
              <el-input-number v-model="formData.sortOrder" :min="0" style="width: 100%" class="modern-input" controls-position="right" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
             <el-form-item label="状态" prop="status">
               <el-radio-group v-model="formData.status">
                 <el-radio :value="true">启用</el-radio>
                 <el-radio :value="false">禁用</el-radio>
               </el-radio-group>
             </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="可见性" prop="visible">
              <el-radio-group v-model="formData.visible">
                <el-radio :value="true">显示</el-radio>
                <el-radio :value="false">隐藏</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>

          <el-col :span="24">
             <el-form-item label="备注" prop="remark">
              <el-input v-model="formData.remark" type="textarea" :rows="2" placeholder="请输入备注信息" class="modern-input" />
            </el-form-item>
          </el-col>
          
          <!-- 新增：同步生成权限复选框 -->
          <el-col :span="24" v-if="!isEdit">
            <el-form-item>
              <el-checkbox v-model="syncPermission" label="同步生成权限" class="sync-checkbox" border />
              <div class="form-tip">勾选后，系统将自动根据菜单信息生成对应的基础权限点（增删改查）</div>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose" class="btn-cancel">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading" class="btn-submit">
          {{ submitLoading ? '提交中...' : '确定' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import { ElMessage, ElNotification, type FormInstance, type FormRules } from 'element-plus'
import type { MenuRow } from '@/api/menuApi'
import type { components } from '@/types/api-schema'
import { addMenuApi, updateMenuApi, getMenuDetailApi, generatePermissionApi } from '@/api/menuApi'
import IconSelector from '@/components/IconSelector/index.vue'

type SysMenu = components['schemas']['SysMenu']

interface Props {
  modelValue: boolean
  title: string
  isEdit: boolean
  menuData?: MenuRow | null
  menuTreeData: MenuRow[]
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'success', data: MenuRow): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const dialogVisible = ref(false)
const formRef = ref<FormInstance>()
const submitLoading = ref(false)
const dataLoading = ref(false)

// 新增：同步生成权限的状态
const syncPermission = ref(true)

const treeProps = {
  label: 'menuName',
  value: 'id',
  children: 'children'
}

const formData = reactive<Partial<SysMenu>>({
  parentId: 0,
  menuName: '',
  routerName: '',
  menuCode: '',
  path: '',
  component: '',
  menuType: 2,
  icon: '',
  sortOrder: 0,
  status: true,
  visible: true,
  remark: ''
})

const formRules = computed<FormRules>(() => {
  const rules: FormRules = {
    menuName: [{ required: true, message: '请输入菜单名称', trigger: 'blur' }],
    menuType: [{ required: true, message: '请选择菜单类型', trigger: 'change' }]
  }

  // 只有菜单类型 (2) 才需要校验路由名称和路径
  if (formData.menuType === 2) {
    rules.routerName = [{ required: true, message: '请输入路由名称', trigger: 'blur' }]
    rules.path = [{ required: true, message: '请输入路径', trigger: 'blur' }]
  }
  
  return rules
})

// 监听对话框显示状态
watch(() => props.modelValue, async (val) => {
  dialogVisible.value = val
  if (val) {
    // 重置状态
    syncPermission.value = true
    
    // 打开对话框时初始化表单数据
    if (props.isEdit && props.menuData?.id) {
      // 编辑模式：从后端获取完整数据
      dataLoading.value = true
      try {
        const res = await getMenuDetailApi(props.menuData.id)
        const menuDetail = res.data as SysMenu
        
        // 数据转换处理
        const pid = (menuDetail.parentId === 0 || Number(menuDetail.parentId) === 0) ? undefined : menuDetail.parentId;
        
        // 确保 status 和 visible 为布尔值，处理可能为 null/undefined 的情况，默认为 true
        const status = menuDetail.status !== false && menuDetail.status !== 0 && String(menuDetail.status) !== 'false' && String(menuDetail.status) !== '0';
        const visible = menuDetail.visible !== false && menuDetail.visible !== 0 && String(menuDetail.visible) !== 'false' && String(menuDetail.visible) !== '0';
        
        Object.assign(formData, {
          id: menuDetail.id,
          parentId: pid,
          menuName: menuDetail.menuName,
          routerName: menuDetail.routerName || '',
          menuCode: menuDetail.menuCode || '',
          path: menuDetail.path,
          component: menuDetail.component || '',
          menuType: Number(menuDetail.menuType),
          icon: menuDetail.icon || '',
          sortOrder: menuDetail.sortOrder || 0,
          status: status,
          visible: visible,
          remark: menuDetail.remark || ''
        })
      } catch (error: any) {
        ElMessage.error(error?.message || '获取菜单详情失败')
        handleClose()
      } finally {
        dataLoading.value = false
      }
    } else {
      // 新增模式：重置表单
      // 如果有 props.menuData?.id，说明是新增子菜单，将其设为 parentId
      const initParentId = props.menuData?.id;
      
      Object.assign(formData, {
        id: undefined,
        parentId: initParentId || undefined, // 根菜单 parentId 为 undefined 以显示 placeholder
        menuName: '',
        routerName: '',
        menuCode: '',
        path: '',
        component: '',
        menuType: 2,
        icon: '',
        sortOrder: 0,
        status: true,
        visible: true,
        remark: ''
      })
    }
  }
})

watch(dialogVisible, (val) => {
  emit('update:modelValue', val)
})

// 关闭对话框
const handleClose = () => {
  formRef.value?.resetFields()
  dialogVisible.value = false
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    submitLoading.value = true
    
    // 处理 parentId 为 undefined/null 的情况 (根菜单)
    const submitData = { ...formData }
    if (!submitData.parentId) {
      submitData.parentId = 0
    }
    
    // 确保类型正确
    submitData.menuType = Number(submitData.menuType)
    
    let result
    if (props.isEdit && formData.id) {
      // 修改
      result = await updateMenuApi(submitData)
      ElMessage.success('修改成功')
    } else {
      // 新增
      result = await addMenuApi(submitData)
      ElMessage.success('菜单创建成功')
      
      // 处理同步生成权限逻辑
      if (syncPermission.value && result.data && result.data.id) {
          try {
              // 调用预留的生成权限接口
              await generatePermissionApi(result.data.id)
              ElNotification({
                  title: '权限生成成功',
                  message: `已为菜单 "${result.data.menuName}" 自动生成相关权限点`,
                  type: 'success',
                  duration: 4000
              })
          } catch (permError) {
              console.error('权限生成失败:', permError)
              ElNotification({
                  title: '权限生成失败',
                  message: '菜单已创建，但自动生成权限失败，请稍后手动处理',
                  type: 'warning',
                  duration: 6000
              })
          }
      }
    }
    
    handleClose()
    // 返回最新数据给父组件
    emit('success', result.data)
  } catch (error: any) {
    if (error?.message) {
      ElMessage.error(error.message)
    }
  } finally {
    submitLoading.value = false
  }
}
</script>

<style lang="scss">
/* 全局样式覆盖 - 用于 Dialog 本身 */
.menu-dialog.glass-effect {
    border-radius: 16px;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);

    .el-dialog__header {
        margin-right: 0;
        padding: 20px 24px;
        border-bottom: 1px solid #f3f4f6;
        
        .el-dialog__title {
            font-weight: 600;
            color: #111827;
        }
    }

    .el-dialog__body {
        padding: 24px;
    }

    .el-dialog__footer {
        padding: 16px 24px;
        border-top: 1px solid #f3f4f6;
        background-color: #f9fafb;
    }
}
</style>

<style scoped lang="scss">
.form-tip {
    font-size: 12px;
    color: #909399;
    margin-top: 5px;
    margin-left: 2px;
}

.sync-checkbox {
    font-weight: 500;
}

/* 对话框底部按钮美化 */
.dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding-top: 10px;
}

.btn-cancel {
    border-radius: 8px;
    &:hover {
        background-color: #f3f4f6;
        color: #4b5563;
        border-color: #d1d5db;
    }
}

.btn-submit {
    border-radius: 8px;
    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
    border: none;
    
    &:hover {
        opacity: 0.9;
        transform: translateY(-1px);
        box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);
    }
}

/* 输入框样式微调 */
:deep(.modern-input .el-input__wrapper),
:deep(.modern-input .el-textarea__inner) {
    box-shadow: 0 0 0 1px #e2e8f0 inset;
    border-radius: 6px;
    padding: 8px 11px;
    transition: all 0.2s;
    
    &:hover {
        box-shadow: 0 0 0 1px #cbd5e1 inset;
    }
    
    &.is-focus {
        box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2) inset;
    }
}
</style>
