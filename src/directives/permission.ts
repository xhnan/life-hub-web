import { type Directive, type DirectiveBinding } from 'vue';
import { checkPermi, checkRole } from '@/utils/permission';

/**
 * 移除元素自身
 */
function removeEl(el: HTMLElement) {
    el.parentNode?.removeChild(el);
}

/**
 * 统一的绑定值校验：必须为非空数组
 */
function ensureArray(value: unknown, usage: string): string[] | null {
    if (!Array.isArray(value) || value.length === 0) {
        console.warn(usage);
        return null;
    }
    return value as string[];
}

/**
 * v-hasPermi：按权限码控制元素显隐。
 * 不具备其中任一权限码时移除元素；持有 `*:*:*` 时保留。
 * 用法：v-hasPermi="['system:user:create']"
 */
export const hasPermi: Directive = {
    mounted(el: HTMLElement, binding: DirectiveBinding) {
        const values = ensureArray(
            binding.value,
            "v-hasPermi 需要传入权限码数组，例如 v-hasPermi=\"['system:user:create','system:user:update']\""
        );
        if (values === null) {
            removeEl(el);
            return;
        }
        if (!checkPermi(values)) {
            removeEl(el);
        }
    }
};

/**
 * v-hasRole：按角色码控制元素显隐。
 * 不具备其中任一角色码时移除元素。
 * 用法：v-hasRole="['ADMIN']"
 */
export const hasRole: Directive = {
    mounted(el: HTMLElement, binding: DirectiveBinding) {
        const values = ensureArray(
            binding.value,
            "v-hasRole 需要传入角色码数组，例如 v-hasRole=\"['ADMIN','SUPER_ADMIN']\""
        );
        if (values === null) {
            removeEl(el);
            return;
        }
        if (!checkRole(values)) {
            removeEl(el);
        }
    }
};

/**
 * v-permission：向后兼容指令，等价于 v-hasPermi。
 * 保留以便存量页面（如 role/index.vue 的 v-permission="['system:role:create']"）无需改动。
 */
export const permission: Directive = hasPermi;
