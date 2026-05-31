import { describe, it, expect, beforeEach, vi } from 'vitest';
import { checkPermi, checkPermiAnd, checkRole, checkRoleAnd } from './permission';
import { permissionStore } from '@/store/permission';

function setStore(roles: string[], permissions: string[]) {
    permissionStore.roles = roles;
    permissionStore.permissions = permissions;
}

describe('permission helpers', () => {
    beforeEach(() => {
        setStore([], []);
    });

    it('checkPermi returns true when any permission matches', () => {
        setStore([], ['system:user:query', 'system:role:query']);
        expect(checkPermi(['system:user:query'])).toBe(true);
        expect(checkPermi(['system:menu:query'])).toBe(false);
    });

    it('checkPermi short-circuits with wildcard *:*:*', () => {
        setStore([], ['*:*:*']);
        expect(checkPermi(['anything:at:all'])).toBe(true);
    });

    it('checkPermiAnd requires all permissions', () => {
        setStore([], ['a:b:c', 'd:e:f']);
        expect(checkPermiAnd(['a:b:c', 'd:e:f'])).toBe(true);
        expect(checkPermiAnd(['a:b:c', 'x:y:z'])).toBe(false);
    });

    it('checkPermiAnd short-circuits with wildcard', () => {
        setStore([], ['*:*:*']);
        expect(checkPermiAnd(['a:b:c', 'd:e:f'])).toBe(true);
    });

    it('checkRole returns true when any role matches', () => {
        setStore(['ADMIN'], []);
        expect(checkRole(['ADMIN', 'SUPER_ADMIN'])).toBe(true);
        expect(checkRole(['USER'])).toBe(false);
    });

    it('checkRoleAnd requires all roles', () => {
        setStore(['ADMIN', 'USER'], []);
        expect(checkRoleAnd(['ADMIN', 'USER'])).toBe(true);
        expect(checkRoleAnd(['ADMIN', 'SUPER_ADMIN'])).toBe(false);
    });

    it('empty input warns and returns false', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        expect(checkPermi([])).toBe(false);
        expect(checkRole([])).toBe(false);
        expect(warn).toHaveBeenCalled();
        warn.mockRestore();
    });
});
