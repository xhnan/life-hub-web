<template>
  <el-dialog
    v-model="dialogVisible"
    :title="title"
    width="600px"
    @close="handleClose"
  >
    <div v-loading="dataLoading">
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
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
        />
      </el-form-item>
      <el-form-item label="菜单名称" prop="menuName">
        <el-input v-model="formData.menuName" placeholder="请输入菜单名称" />
      </el-form-item>
      <el-form-item label="路由名称" prop="routerName">
        <el-input v-model="formData.routerName" placeholder="请输入路由名称（英文标识）" />
      </el-form-item>
      <el-form-item label="权限标识" prop="permission">
        <el-input v-model="formData.permission" placeholder="请输入权限标识" />
      </el-form-item>
      <el-form-item label="菜单路径" prop="path">
        <el-input v-model="formData.path" placeholder="请输入路径" />
      </el-form-item>
      <el-form-item label="组件路径" prop="component">
        <el-input v-model="formData.component" placeholder="请输入组件路径" />
      </el-form-item>
      <el-form-item label="菜单类型" prop="menuType">
        <el-select v-model="formData.menuType" placeholder="请选择菜单类型" style="width: 100%">
          <el-option label="目录" :value="1" />
          <el-option label="菜单" :value="2" />
          <el-option label="按钮" :value="3" />
        </el-select>
      </el-form-item>
      <el-form-item label="图标" prop="icon">
        <el-input v-model="formData.icon" placeholder="请输入图标名称" />
      </el-form-item>
      <el-form-item label="排序号" prop="sortOrder">
        <el-input-number v-model="formData.sortOrder" :min="0" style="width: 100%" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio :value="true">启用</el-radio>
          <el-radio :value="false">禁用</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="可见性" prop="visible">
        <el-radio-group v-model="formData.visible">
          <el-radio :value="true">可见</el-radio>
          <el-radio :value="false">隐藏</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input v-model="formData.remark" type="textarea" :rows="3" placeholder="请输入备注" />
      </el-form-item>
    </el-form>    </div>    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleSubmit" :loading="submitLoading">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import type { MenuRow } from '@/api/menuApi'
import { addMenuApi, updateMenuApi, getMenuDetailApi } from '@/api/menuApi'

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

const treeProps = {
  label: 'menuName',
  value: 'id',
  children: 'children'
}

const formData = reactive<Partial<MenuRow>>({
  parentId: 0,
  menuName: '',
  routerName: '',
  permission: '',
  path: '',
  component: '',
  menuType: 2,
  icon: '',
  sortOrder: 0,
  status: true,
  visible: true,
  remark: ''
})

const formRules: FormRules = {
  menuName: [{ required: true, message: '请输入菜单名称', trigger: 'blur' }],
  routerName: [{ required: true, message: '请输入路由名称', trigger: 'blur' }],
  path: [{ required: true, message: '请输入路径', trigger: 'blur' }],
  menuType: [{ required: true, message: '请选择菜单类型', trigger: 'change' }]
}

// 监听对话框显示状态
watch(() => props.modelValue, async (val) => {
  dialogVisible.value = val
  if (val) {
    // 打开对话框时初始化表单数据
    if (props.isEdit && props.menuData?.id) {
      // 编辑模式：从后端获取完整数据
      dataLoading.value = true
      try {
        const res = await getMenuDetailApi(props.menuData.id)
        const menuDetail = res.data
        Object.assign(formData, {
          id: menuDetail.id,
          parentId: menuDetail.parentId || 0,
          menuName: menuDetail.menuName,
          routerName: menuDetail.routerName || '',
          permission: menuDetail.permission || '',
          path: menuDetail.path,
          component: menuDetail.component || '',
          menuType: menuDetail.menuType,
          icon: menuDetail.icon || '',
          sortOrder: menuDetail.sortOrder || 0,
          status: menuDetail.status ?? true,
          visible: menuDetail.visible ?? true,
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
      Object.assign(formData, {
        id: undefined,
        parentId: props.menuData?.id || 0, // 如果有 menuData，说明是添加子菜单
        menuName: '',
        routerName: '',
        permission: '',
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
    
    // 处理 parentId 为 0 的情况
    const submitData = { ...formData }
    if (submitData.parentId === 0) {
      submitData.parentId = 0
    }
    
    let result
    if (props.isEdit && formData.id) {
      // 修改
      result = await updateMenuApi(submitData)
      ElMessage.success('修改成功')
    } else {
      // 新增
      result = await addMenuApi(submitData)
      ElMessage.success('新增成功')
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

<style scoped lang="scss"></style>
