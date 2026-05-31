/**
 * 存储键名常量
 */
export const STORAGE_KEYS = {
    TOKEN: 'life_hub_token',
    TOKEN_EXPIRES_AT: 'life_hub_tokenExpiresAt',
    USER_INFO: 'life_hub_userInfo',
    USER_ROLES: 'life_hub_userRoles',
    USER_PERMISSIONS: 'life_hub_userPermissions',
    MENU_DATA: 'life_hub_menuData',
    MENU_TREE: 'life_hub_menuTree',
    CACHE_TIMESTAMP: 'life_hub_cacheTimestamp'
} as const;

/**
 * 权限/菜单缓存新鲜度阈值（毫秒）。
 * 仅用于接口不可达时的弱网降级；正常路径始终以接口返回为准。
 * 设为 2 小时以缩短“权限已被收回但用户仍持旧缓存”的暴露窗口。
 */
export const PERMISSION_CACHE_TTL_MS = 2 * 60 * 60 * 1000;
