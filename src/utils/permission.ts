import { userStore } from '@/store/user';

const ALL_PERMISSION = '*:*:*';

/**
 * 读取当前用户权限码列表
 */
function currentPermissions(): string[] {
    return userStore.permissions || [];
}

/**
 * 读取当前用户角色码列表
 */
function currentRoles(): string[] {
    return userStore.roles || [];
}

/**
 * 是否持有超级权限通配符
 */
function hasAllPermission(): boolean {
    return currentPermissions().includes(ALL_PERMISSION);
}

/**
 * 校验是否具备数组中任一权限码。
 * 持有 `*:*:*` 时短路通过。
 * @param values 权限码数组
 */
export function checkPermi(values: string[]): boolean {
    if (!Array.isArray(values) || values.length === 0) {
        console.warn("checkPermi 需要传入权限码数组，例如 checkPermi(['system:user:create'])");
        return false;
    }
    if (hasAllPermission()) return true;
    const permissions = currentPermissions();
    return values.some(v => permissions.includes(v));
}

/**
 * 校验是否具备数组中全部权限码。
 * 持有 `*:*:*` 时短路通过。
 * @param values 权限码数组
 */
export function checkPermiAnd(values: string[]): boolean {
    if (!Array.isArray(values) || values.length === 0) {
        console.warn("checkPermiAnd 需要传入权限码数组，例如 checkPermiAnd(['system:user:create'])");
        return false;
    }
    if (hasAllPermission()) return true;
    const permissions = currentPermissions();
    return values.every(v => permissions.includes(v));
}

/**
 * 校验是否具备数组中任一角色码。
 * @param values 角色码数组
 */
export function checkRole(values: string[]): boolean {
    if (!Array.isArray(values) || values.length === 0) {
        console.warn("checkRole 需要传入角色码数组，例如 checkRole(['ADMIN'])");
        return false;
    }
    const roles = currentRoles();
    return values.some(v => roles.includes(v));
}

/**
 * 校验是否具备数组中全部角色码。
 * @param values 角色码数组
 */
export function checkRoleAnd(values: string[]): boolean {
    if (!Array.isArray(values) || values.length === 0) {
        console.warn("checkRoleAnd 需要传入角色码数组，例如 checkRoleAnd(['ADMIN'])");
        return false;
    }
    const roles = currentRoles();
    return values.every(v => roles.includes(v));
}
