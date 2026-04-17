import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://ayvwykvovlqiqiagtpfo.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'public-anon-key';

export const getSupabaseUrl = () => {
    const local = localStorage.getItem('monochrome-supabase-url');
    if (local) return local;

    if (window.__SUPABASE_URL__) return window.__SUPABASE_URL__;

    return DEFAULT_SUPABASE_URL;
};

export const getSupabaseAnonKey = () => {
    const local = localStorage.getItem('monochrome-supabase-anon-key');
    if (local) return local;

    if (window.__SUPABASE_ANON_KEY__) return window.__SUPABASE_ANON_KEY__;

    return DEFAULT_SUPABASE_ANON_KEY;
};

export const supabase = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
    },
});

function normalizeSupabaseUser(user) {
    if (!user) return null;

    const metadata = user.user_metadata || {};
    const displayName =
        metadata.display_name || metadata.full_name || metadata.name || user.email?.split('@')[0] || 'Member';

    return {
        ...user,
        id: user.id,
        $id: user.id,
        email: user.email || null,
        username: metadata.username || metadata.user_name || metadata.preferred_username || user.email?.split('@')[0] || null,
        displayName,
        name: displayName,
        avatar_url: metadata.avatar_url || metadata.picture || null,
        photoURL: metadata.avatar_url || metadata.picture || null,
    };
}

const auth = {
    async exchangeCodeForSession(code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) throw error;
        return normalizeSupabaseUser(data.user);
    },

    async createOAuth2Session(provider, redirectTo) {
        const { error } = await supabase.auth.signInWithOAuth({
            provider,
            options: { redirectTo },
        });
        if (error) throw error;
    },

    async createEmailPasswordSession(email, password) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return normalizeSupabaseUser(data.user);
    },

    async create(_id, email, password) {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: window.location.origin + '/index.html?oauth=1',
            },
        });
        if (error) throw error;
        return normalizeSupabaseUser(data.user);
    },

    async createRecovery(email, redirectTo) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo,
        });
        if (error) throw error;
    },

    async deleteSession() {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    },

    async get() {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;
        return normalizeSupabaseUser(data.user);
    },
};

export { auth, normalizeSupabaseUser };
