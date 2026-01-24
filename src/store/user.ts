import { reactive } from 'vue';

interface UserState {
    roles: string[];
    permissions: string[];
}

export const userStore = reactive<UserState>({
    roles: [],
    permissions: []
});

export const setUserInfo = (roles: string[], permissions: string[]) => {
    userStore.roles = roles;
    userStore.permissions = permissions;
};

export const clearUserInfo = () => {
    userStore.roles = [];
    userStore.permissions = [];
};
