import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { hasPermi, hasRole, permission } from './permission';
import { permissionStore } from '@/store/permission';

function setStore(roles: string[], permissions: string[]) {
    permissionStore.roles = roles;
    permissionStore.permissions = permissions;
}

function mountWith(directives: Record<string, any>, template: string) {
    return mount({ template }, { global: { directives } });
}

describe('v-hasPermi / v-hasRole / v-permission directives', () => {
    beforeEach(() => setStore([], []));

    it('v-hasPermi keeps element when permission present', () => {
        setStore([], ['system:user:create']);
        const wrapper = mountWith({ hasPermi }, `<div><button v-hasPermi="['system:user:create']">ok</button></div>`);
        expect(wrapper.find('button').exists()).toBe(true);
    });

    it('v-hasPermi removes element when permission absent', () => {
        setStore([], ['system:role:query']);
        const wrapper = mountWith({ hasPermi }, `<div><button v-hasPermi="['system:user:create']">no</button></div>`);
        expect(wrapper.find('button').exists()).toBe(false);
    });

    it('v-hasPermi keeps element with wildcard *:*:*', () => {
        setStore([], ['*:*:*']);
        const wrapper = mountWith({ hasPermi }, `<div><button v-hasPermi="['system:user:create']">ok</button></div>`);
        expect(wrapper.find('button').exists()).toBe(true);
    });

    it('v-hasRole removes element when role absent', () => {
        setStore(['USER'], []);
        const wrapper = mountWith({ hasRole }, `<div><button v-hasRole="['ADMIN']">no</button></div>`);
        expect(wrapper.find('button').exists()).toBe(false);
    });

    it('empty binding warns and removes element, does not throw', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        expect(() =>
            mountWith({ hasPermi }, `<div><button v-hasPermi="[]">x</button></div>`)
        ).not.toThrow();
        expect(warn).toHaveBeenCalled();
        warn.mockRestore();
    });

    it('v-permission is an alias of v-hasPermi', () => {
        expect(permission).toBe(hasPermi);
        setStore([], ['system:role:create']);
        const wrapper = mountWith({ permission }, `<div><button v-permission="['system:role:create']">ok</button></div>`);
        expect(wrapper.find('button').exists()).toBe(true);
    });
});
