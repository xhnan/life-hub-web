<template>
  <el-dialog
    v-model="dialogVisible"
    :title="title"
    width="700px"
    @close="handleClose"
  >
    <div v-loading="dataLoading">
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input 
            v-model="formData.username" 
            placeholder="请输入用户名" 
            :disabled="isEdit"
          />
        </el-form-item>

        <el-form-item label="密码" prop="password" v-if="!isEdit">
          <el-input 
            v-model="formData.password" 
            type="password" 
            placeholder="请输入密码" 
            show-password
          />
        </el-form-item>

        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="formData.nickname" placeholder="请输入昵称" />
        </el-form-item>

        <el-form-item label="邮箱" prop="email">
          <el-input v-model="formData.email" placeholder="请输入邮箱" />
        </el-form-item>

        <el-form-item label="手机号" prop="phone">
          <el-input v-model="formData.phone" placeholder="请输入手机号" />
        </el-form-item>

        <el-form-item label="性别" prop="gender">
          <el-select v-model="formData.gender" placeholder="请选择性别" style="width: 100%">
            <el-option label="未知" :value="0" />
            <el-option label="男" :value="1" />
            <el-option label="女" :value="2" />
          </el-select>
        </el-form-item>

        <el-form-item label="状态" prop="status">
        <el-select v-model="formData.status" placeholder="请选择状态">
          <el-option label="正常" value="active" />
          <el-option label="停用" value="inactive" />
          <el-option label="禁用" value="banned" />
        </el-select>
      </el-form-item>

        <el-form-item label="备注" prop="remark">
          <el-input 
            v-model="formData.remark" 
            type="textarea" 
            :rows="3" 
            placeholder="请输入备注" 
          />
        </el-form-item>
      </el-form>
    </div>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleSubmit" :loading="submitLoading">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import type { UserRow } from '@/api/userApi'
import { addUserApi, updateUserApi, getUserDetailApi } from '@/api/userApi'

interface Props {
  modelValue: boolean
  title: string
  isEdit: boolean
  userData?: UserRow | null
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'success', data: UserRow): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const dialogVisible = ref(false)
const formRef = ref<FormInstance>()
const submitLoading = ref(false)
const dataLoading = ref(false)

const formData = reactive<Partial<UserRow & { password?: string }>>({
  username: '',
  password: '',
  nickname: '',
  email: '',
  phone: '',
  gender: 0,
  status: 'active',
  remark: ''
})

// 表单验证规则
const formRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ]
}

// 监听对话框显示状态
watch(() => props.modelValue, async (val) => {
  dialogVisible.value = val
  if (val) {
    // 打开对话框时初始化表单数据
    if (props.isEdit && props.userData?.userId) {
      // 编辑模式：从后端获取完整数据
      dataLoading.value = true
      try {
        const res = await getUserDetailApi(props.userData.userId)
        const userDetail = res.data
        Object.assign(formData, {
          userId: userDetail.userId,
          username: userDetail.username,
          nickname: userDetail.nickname || '',
          email: userDetail.email || '',
          phone: userDetail.phone || '',
          gender: userDetail.gender ?? 0,
          status: userDetail.status ?? 'active',
          remark: userDetail.remark || ''
        })
      } catch (error: any) {
        ElMessage.error(error?.message || '获取用户详情失败')
        handleClose()
      } finally {
        dataLoading.value = false
      }
    } else {
      // 新增模式：重置表单
      resetForm()
    }
  }
})

watch(dialogVisible, (val) => {
  if (!val) {
    emit('update:modelValue', false)
  }
})

// 重置表单
const resetForm = () => {
  Object.assign(formData, {
    username: '',
    password: '',
    nickname: '',
    email: '',
    phone: '',
    gender: 0,
    status: 'active',
    remark: ''
  })
  formRef.value?.clearValidate()
}

// 关闭对话框
const handleClose = () => {
  dialogVisible.value = false
  resetForm()
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
  } catch {
    return
  }

  submitLoading.value = true
  try {
    let userId: string | number
    if (props.isEdit) {
      // 编辑用户
      const { password, ...editData } = formData
      const result = await updateUserApi(editData)
      ElMessage.success('修改成功')
      userId = result.data.id
    } else {
      // 新增用户
      const result = await addUserApi(formData)
      ElMessage.success('新增成功')
      userId = result.data.id
    }
    
    // 重新获取用户数据
    const userRes = await getUserDetailApi(userId)
    emit('success', userRes.data)
    handleClose()
  } catch (error: any) {
    ElMessage.error(error?.message || '操作失败')
  } finally {
    submitLoading.value = false
  }
}
</script>

<style scoped lang="scss">
:deep(.el-checkbox) {
  margin-right: 0;
  width: 100%;
}
</style>
