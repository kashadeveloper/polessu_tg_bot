export function isAdminRole(role: string, user_id?: number) {
    if(role === 'administator' || role === 'creator') return true;

    return false;
}