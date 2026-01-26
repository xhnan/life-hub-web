import { type Directive } from 'vue';
import { hasPermission } from '@/utils/auth';

export const permission: Directive = {
    mounted(el, binding) {
        const { value } = binding;
        if (value) {
            if (!hasPermission(value)) {
                el.parentNode?.removeChild(el);
            }
        } else {
            throw new Error(`need permissions! Like v-permission="['sys:user:add','sys:user:edit']"`);
        }
    }
};
