// js/accounts/supabase-sync.js
import { supabase } from './config.js';
import { db } from '../db.js';
import { authManager } from './auth.js';

const PUBLIC_COLLECTION = 'public_playlists';
const LIKED_SONGS_TABLE = 'user_liked_songs';
const USER_PLAYLISTS_TABLE = 'user_playlists';
const TABLE_MAP = {
    DB_users: 'profiles',
    public_playlists: 'public_playlists',
    parties: 'parties',
    party_members: 'party_members',
    party_messages: 'party_messages',
    party_requests: 'party_requests',
    themes: 'themes',
};

function resolveTableName(name) {
    return TABLE_MAP[name] || name;
}

function getAuthProfileDefaults() {
    const user = authManager.user;
    const metadata = user?.user_metadata || {};
    const username = metadata.username || metadata.user_name || metadata.preferred_username || user?.email?.split('@')[0] || null;
    const displayName = metadata.display_name || metadata.full_name || metadata.name || username || 'Member';
    const avatarUrl = metadata.avatar_url || metadata.picture || metadata.picture_url || user?.photoURL || null;

    return {
        username,
        display_name: displayName,
        avatar_url: avatarUrl,
    };
}

function toObject(data) {
    if (!data) return {};
    if (data instanceof FormData) return Object.fromEntries(data.entries());
    if (typeof data === 'object') return data;
    return data;
}

function parseSort(sort) {
    if (!sort) return [];
    return String(sort)
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part) => ({ column: part.startsWith('-') ? part.slice(1) : part, ascending: !part.startsWith('-') }));
}

function buildOrExpression(filter) {
    return String(filter)
        .split('||')
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part) => {
            const likeMatch = part.match(/^([\w.]+)\s*~\s*"([^"]*)"$/);
            if (likeMatch) {
                const [, column, value] = likeMatch;
                return `${column}.ilike.%${value.replace(/%/g, '')}%`;
            }

            const eqMatch = part.match(/^([\w.]+)\s*(?:=|==)\s*"([^"]*)"$/);
            if (eqMatch) {
                const [, column, value] = eqMatch;
                return `${column}.eq.${value.replace(/\"/g, '"')}`;
            }

            return null;
        })
        .filter(Boolean)
        .join(',');
}

function applyFilter(query, filter) {
    if (!filter) return query;

    const clauses = String(filter)
        .split('&&')
        .map((part) => part.trim())
        .filter(Boolean);

    for (const clause of clauses) {
        const orExpression = clause.includes('||') ? buildOrExpression(clause) : null;
        if (orExpression) {
            query = query.or(orExpression);
            continue;
        }

        const likeMatch = clause.match(/^([\w.]+)\s*~\s*"([^"]*)"$/);
        if (likeMatch) {
            const [, column, value] = likeMatch;
            query = query.ilike(column, `%${value}%`);
            continue;
        }

        const eqMatch = clause.match(/^([\w.]+)\s*(?:=|==)\s*"([^"]*)"$/);
        if (eqMatch) {
            const [, column, value] = eqMatch;
            query = query.eq(column, value);
        }
    }

    return query;
}

function buildSelect(fields) {
    if (!fields) return '*';
    return fields;
}

async function attachExpands(table, rows, expand) {
    if (!expand || !rows || rows.length === 0) return rows;

    const expandFields = String(expand)
        .split(',')
        .map((field) => field.trim())
        .filter(Boolean);

    const expandedRows = rows.map((row) => ({ ...row, expand: row.expand || {} }));

    for (const field of expandFields) {
        if (table === 'parties' && field === 'host') {
            const hostIds = [...new Set(expandedRows.map((row) => row.host).filter(Boolean))];
            if (hostIds.length > 0) {
                const { data } = await supabase
                    .from('profiles')
                    .select('id,username,display_name,avatar_url,banner,status,about,website,lastfm_username,privacy')
                    .in('id', hostIds);
                const hostMap = new Map((data || []).map((item) => [item.id, item]));
                expandedRows.forEach((row) => {
                    if (row.host && hostMap.has(row.host)) row.expand.host = hostMap.get(row.host);
                });
            }
        }

        if (table === 'themes' && field === 'author') {
            const authorIds = [...new Set(expandedRows.map((row) => row.author).filter(Boolean))];
            if (authorIds.length > 0) {
                const { data } = await supabase
                    .from('profiles')
                    .select('id,username,display_name,avatar_url,banner,status,about,website,lastfm_username,privacy')
                    .in('id', authorIds);
                const authorMap = new Map((data || []).map((item) => [item.id, item]));
                expandedRows.forEach((row) => {
                    if (row.author && authorMap.has(row.author)) row.expand.author = authorMap.get(row.author);
                });
            }
        }
    }

    return expandedRows;
}

function createCollectionApi(collectionName) {
    const table = resolveTableName(collectionName);

    return {
        async getList(page = 1, perPage = 30, options = {}) {
            const select = buildSelect(options.fields);
            let query = supabase.from(table).select(select, { count: 'exact' });
            query = applyFilter(query, options.filter);

            for (const sort of parseSort(options.sort)) {
                query = query.order(sort.column, { ascending: sort.ascending });
            }

            const from = Math.max(0, (page - 1) * perPage);
            const to = from + perPage - 1;
            const { data, error, count } = await query.range(from, to);
            if (error) throw error;

            const items = await attachExpands(table, data || [], options.expand);

            return {
                items,
                page,
                perPage,
                totalItems: count || items.length,
            };
        },

        async getFullList(options = {}) {
            const result = await this.getList(1, 100000, options);
            return result.items;
        },

        async getOne(id, options = {}) {
            const select = buildSelect(options.fields);
            const { data, error } = await supabase.from(table).select(select).eq('id', id).maybeSingle();
            if (error) throw error;
            if (!data) {
                const notFound = new Error('Record not found');
                notFound.status = 404;
                throw notFound;
            }

            const rows = await attachExpands(table, [data], options.expand);
            return rows[0];
        },

        async getFirstListItem(filter, options = {}) {
            const result = await this.getList(1, 1, { ...options, filter });
            if (!result.items.length) {
                const notFound = new Error('Record not found');
                notFound.status = 404;
                throw notFound;
            }
            return result.items[0];
        },

        async create(data, _options = {}) {
            const payload = toObject(data);
            const { data: inserted, error } = await supabase.from(table).insert(payload).select('*').single();
            if (error) throw error;
            return inserted;
        },

        async update(id, data, _options = {}) {
            const payload = toObject(data);
            const { data: updated, error } = await supabase.from(table).update(payload).eq('id', id).select('*').single();
            if (error) throw error;
            return updated;
        },

        async delete(id, _options = {}) {
            const { error } = await supabase.from(table).delete().eq('id', id);
            if (error) throw error;
            return true;
        },

        async subscribe(target, callback, options = {}) {
            const channelName = `${table}:${target || '*'}:${crypto.randomUUID?.() || Date.now()}`;
            const channel = supabase.channel(channelName);

            const payloadTarget = target && target !== '*' ? `id=eq.${target}` : undefined;
            const filter = options.filter ? options.filter : payloadTarget;

            channel.on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table,
                    ...(filter ? { filter } : {}),
                },
                async (payload) => {
                    const action = payload.eventType?.toLowerCase?.() || 'update';
                    const record = payload.new || payload.old || null;
                    if (record) {
                        const expanded = await attachExpands(table, [record], options.expand);
                        callback({ action, record: expanded[0] });
                    } else {
                        callback({ action, record: null });
                    }
                }
            );

            return new Promise((resolve, reject) => {
                channel.subscribe((status) => {
                    if (status === 'SUBSCRIBED') {
                        resolve(() => {
                            supabase.removeChannel(channel);
                        });
                    }
                    if (status === 'CHANNEL_ERROR') {
                        reject(new Error(`Subscription failed for ${table}`));
                    }
                });
            });
        },
    };
}

const pb = {
    collection(name) {
        return createCollectionApi(name);
    },
    files: {
        getUrl(_record, filePath) {
            return filePath;
        },
    },
};

console.log('[Supabase] Sync layer initialized');

const syncManager = {
    pb: pb,
    _userRecordCache: null,
    _getUserRecordPromise: null,
    _isSyncing: false,

    async _readLikedSongs(uid) {
        const { data, error } = await supabase
            .from(LIKED_SONGS_TABLE)
            .select('track_id,track_data,created_at')
            .eq('user_id', uid)
            .order('created_at', { ascending: false });
        if (error) {
            console.error('[Supabase] Failed to read liked songs:', error);
            return {};
        }

        const tracks = {};
        for (const row of data || []) {
            const payload = row.track_data || {};
            tracks[row.track_id] = {
                ...payload,
                id: payload.id || row.track_id,
                addedAt: payload.addedAt || new Date(row.created_at).getTime() || Date.now(),
            };
        }
        return tracks;
    },

    async _readUserPlaylists(uid) {
        const { data, error } = await supabase
            .from(USER_PLAYLISTS_TABLE)
            .select('playlist_id,name,cover,description,tracks,images,is_public,created_at,updated_at')
            .eq('user_id', uid)
            .order('updated_at', { ascending: false });
        if (error) {
            console.error('[Supabase] Failed to read user playlists:', error);
            return {};
        }

        const playlists = {};
        for (const row of data || []) {
            const tracks = Array.isArray(row.tracks) ? row.tracks : [];
            playlists[row.playlist_id] = {
                id: row.playlist_id,
                name: row.name || 'Untitled Playlist',
                cover: row.cover || null,
                description: row.description || '',
                tracks,
                images: Array.isArray(row.images) ? row.images : [],
                createdAt: new Date(row.created_at).getTime() || Date.now(),
                updatedAt: new Date(row.updated_at).getTime() || Date.now(),
                numberOfTracks: tracks.length,
                isPublic: !!row.is_public,
            };
        }
        return playlists;
    },

    async _replaceLikedSongs(uid, tracksMap) {
        const tracks = Object.values(tracksMap || {}).filter((t) => t && t.id);
        const { error: clearError } = await supabase.from(LIKED_SONGS_TABLE).delete().eq('user_id', uid);
        if (clearError) {
            console.error('[Supabase] Failed to clear liked songs:', clearError);
            return;
        }
        if (!tracks.length) return;

        const rows = tracks.map((track) => ({
            user_id: uid,
            track_id: track.id,
            track_data: track,
        }));

        const { error } = await supabase.from(LIKED_SONGS_TABLE).insert(rows);
        if (error) console.error('[Supabase] Failed to write liked songs:', error);
    },

    async _replaceUserPlaylists(uid, playlistsMap) {
        const playlists = Object.values(playlistsMap || {}).filter((p) => p && p.id);
        const { error: clearError } = await supabase.from(USER_PLAYLISTS_TABLE).delete().eq('user_id', uid);
        if (clearError) {
            console.error('[Supabase] Failed to clear user playlists:', clearError);
            return;
        }
        if (!playlists.length) return;

        const rows = playlists.map((playlist) => ({
            user_id: uid,
            playlist_id: playlist.id,
            name: playlist.name || 'Untitled Playlist',
            description: playlist.description || '',
            cover: playlist.cover || null,
            tracks: Array.isArray(playlist.tracks) ? playlist.tracks : [],
            images: Array.isArray(playlist.images) ? playlist.images : [],
            is_public: !!playlist.isPublic,
            updated_at: new Date(playlist.updatedAt || Date.now()).toISOString(),
            created_at: new Date(playlist.createdAt || Date.now()).toISOString(),
        }));

        const { error } = await supabase.from(USER_PLAYLISTS_TABLE).insert(rows);
        if (error) console.error('[Supabase] Failed to write user playlists:', error);
    },

    async _getUserRecord(uid) {
        if (!uid) return null;

        if (this._userRecordCache && this._userRecordCache.id === uid) {
            return this._userRecordCache;
        }

        if (this._getUserRecordPromise && this._getUserRecordPromise.uid === uid) {
            return this._getUserRecordPromise.promise;
        }

        const promise = (async () => {
            try {
                const result = await this.pb.collection('DB_users').getList(1, 1, {
                    filter: `id="${uid}"`,
                    sort: '-username',
                    f_id: uid,
                });

                if (result.items.length > 0) {
                    const record = result.items[0];
                    const authProfile = getAuthProfileDefaults();
                    const updates = {};

                    if (authProfile.username && !record.username) updates.username = authProfile.username;
                    if (authProfile.display_name && !record.display_name) updates.display_name = authProfile.display_name;
                    if (authProfile.avatar_url && (!record.avatar_url || record.avatar_url === '/icon.jpg')) {
                        updates.avatar_url = authProfile.avatar_url;
                    }

                    if (Object.keys(updates).length > 0) {
                        const updatedRecord = await this.pb.collection('DB_users').update(record.id, updates, { f_id: uid });
                        this._userRecordCache = updatedRecord;
                        return updatedRecord;
                    }

                    this._userRecordCache = record;
                    return record;
                }

                try {
                    const authProfile = getAuthProfileDefaults();
                    const newRecord = await this.pb.collection('DB_users').create(
                        {
                            id: uid,
                            username: authProfile.username,
                            display_name: authProfile.display_name,
                            avatar_url: authProfile.avatar_url,
                            banner: null,
                            status: null,
                            about: null,
                            website: null,
                            lastfm_username: null,
                            privacy: { playlists: 'public', lastfm: 'public' },
                            library: {},
                            history: [],
                            user_playlists: {},
                            user_folders: {},
                            favorite_albums: [],
                        },
                        { f_id: uid }
                    );
                    this._userRecordCache = newRecord;
                    return newRecord;
                } catch (createError) {
                    const retryResult = await this.pb.collection('DB_users').getList(1, 1, {
                        filter: `id="${uid}"`,
                        f_id: uid,
                    });
                    if (retryResult.items.length > 0) {
                        this._userRecordCache = retryResult.items[0];
                        return this._userRecordCache;
                    }
                    console.error('[Supabase] Failed to create user:', createError);
                    return null;
                }
            } catch (error) {
                console.error('[Supabase] Failed to get user:', error);
                return null;
            } finally {
                this._getUserRecordPromise = null;
            }
        })();

        this._getUserRecordPromise = { uid, promise };
        return promise;
    },

    async getUserData() {
        const user = authManager.user;
        if (!user) return null;

        const record = await this._getUserRecord(user.$id);
        if (!record) return null;

        const library = this.safeParseInternal(record.library, 'library', {});
        const history = this.safeParseInternal(record.history, 'history', []);
        const userPlaylists = this.safeParseInternal(record.user_playlists, 'user_playlists', {});
        const userFolders = this.safeParseInternal(record.user_folders, 'user_folders', {});
        const favoriteAlbums = this.safeParseInternal(record.favorite_albums, 'favorite_albums', []);

        if (!library.tracks || Object.keys(library.tracks).length === 0) {
            library.tracks = await this._readLikedSongs(user.$id);
        }

        if (!userPlaylists || Object.keys(userPlaylists).length === 0) {
            const tablePlaylists = await this._readUserPlaylists(user.$id);
            if (Object.keys(tablePlaylists).length > 0) {
                Object.assign(userPlaylists, tablePlaylists);
            }
        }

        const profile = {
            username: record.username,
            display_name: record.display_name,
            avatar_url: record.avatar_url || authManager.user?.photoURL || null,
            banner: record.banner,
            status: record.status,
            about: record.about,
            website: record.website,
            privacy: this.safeParseInternal(record.privacy, 'privacy', { playlists: 'public', lastfm: 'public' }),
            lastfm_username: record.lastfm_username,
            favorite_albums: favoriteAlbums,
        };

        return { library, history, userPlaylists, userFolders, profile };
    },

    async _updateUserJSON(uid, field, data) {
        const record = await this._getUserRecord(uid);
        if (!record) {
            console.error('Cannot update: no user record found');
            return;
        }

        try {
            const payload = { [field]: data };
            const updated = await this.pb.collection('DB_users').update(record.id, payload, { f_id: uid });
            this._userRecordCache = updated;
        } catch (error) {
            console.error(`Failed to sync ${field} to Supabase:`, error);
        }
    },

    safeParseInternal(str, _fieldName, fallback) {
        if (!str) return fallback;
        if (typeof str !== 'string') return str;
        try {
            return JSON.parse(str);
        } catch {
            try {
                // Recovery attempt: replace illegal internal quotes in name/title fields
                const recovered = str.replace(/(:\s*")(.+?)("(?=\s*[,}\n\r]))/g, (_match, p1, p2, p3) => {
                    const escapedContent = p2.replace(/(?<!\\)"/g, '\\"');
                    return p1 + escapedContent + p3;
                });
                return JSON.parse(recovered);
            } catch {
                try {
                    // Python-style fallback (Single quotes, True/False, None)
                    // This handles data that was incorrectly serialized as Python repr string
                    if (str.includes("'") || str.includes('True') || str.includes('False')) {
                        const jsFriendly = str
                            .replace(/\bTrue\b/g, 'true')
                            .replace(/\bFalse\b/g, 'false')
                            .replace(/\bNone\b/g, 'null');

                        // Basic safety check: ensure it looks like a structure and doesn't contain obvious code vectors
                        if (
                            (jsFriendly.trim().startsWith('[') || jsFriendly.trim().startsWith('{')) &&
                            !jsFriendly.match(/function|=>|window|document|alert|eval/)
                        ) {
                            // TODO: maybe this could be parsed as json5?
                            // eslint-disable-next-line @typescript-eslint/no-implied-eval
                            return new Function('return ' + jsFriendly)();
                        }
                    }
                } catch (error) {
                    console.log(error); // Ignore fallback error
                }
                return fallback;
            }
        }
    },

    async syncLibraryItem(type, item, added) {
        const user = authManager.user;
        if (!user) return;

        if (type === 'track' && item?.id) {
            if (added) {
                const payload = {
                    user_id: user.$id,
                    track_id: item.id,
                    track_data: this._minifyItem('track', item),
                };
                const { error } = await supabase.from(LIKED_SONGS_TABLE).upsert(payload, {
                    onConflict: 'user_id,track_id',
                });
                if (error) console.error('[Supabase] Failed to sync liked song:', error);
            } else {
                const { error } = await supabase
                    .from(LIKED_SONGS_TABLE)
                    .delete()
                    .eq('user_id', user.$id)
                    .eq('track_id', item.id);
                if (error) console.error('[Supabase] Failed to remove liked song:', error);
            }
        }

        const record = await this._getUserRecord(user.$id);
        if (!record) return;

        let library = this.safeParseInternal(record.library, 'library', {});

        const pluralType = type === 'mix' ? 'mixes' : `${type}s`;
        const key = type === 'playlist' ? item.uuid : item.id;

        if (!library[pluralType]) {
            library[pluralType] = {};
        }

        if (added) {
            library[pluralType][key] = this._minifyItem(type, item);
        } else {
            delete library[pluralType][key];
        }

        await this._updateUserJSON(user.$id, 'library', library);
    },

    _minifyItem(type, item) {
        if (!item) return item;

        const base = {
            id: item.id,
            addedAt: item.addedAt || Date.now(),
        };

        if (type === 'track') {
            return {
                ...base,
                title: item.title || null,
                duration: item.duration || null,
                explicit: item.explicit || false,
                artist: item.artist || (item.artists && item.artists.length > 0 ? item.artists[0] : null) || null,
                artists: item.artists?.map((a) => ({ id: a.id, name: a.name || null })) || [],
                album: item.album
                    ? {
                          id: item.album.id,
                          title: item.album.title || null,
                          cover: item.album.cover || null,
                          releaseDate: item.album.releaseDate || null,
                          vibrantColor: item.album.vibrantColor || null,
                          artist: item.album.artist || null,
                          numberOfTracks: item.album.numberOfTracks || null,
                      }
                    : null,
                copyright: item.copyright || null,
                isrc: item.isrc || null,
                trackNumber: item.trackNumber || null,
                streamStartDate: item.streamStartDate || null,
                version: item.version || null,
                mixes: item.mixes || null,
                isPodcast: item.isPodcast || (item.id && String(item.id).startsWith('podcast_')) || null,
                enclosureUrl: item.enclosureUrl || null,
                enclosureType: item.enclosureType || null,
                enclosureLength: item.enclosureLength || null,
            };
        }

        if (type === 'video') {
            return {
                ...base,
                type: 'video',
                title: item.title || null,
                duration: item.duration || null,
                image: item.image || item.cover || null,
                artist: item.artist || (item.artists && item.artists.length > 0 ? item.artists[0] : null) || null,
                artists: item.artists?.map((a) => ({ id: a.id, name: a.name || null })) || [],
                album: item.album || { title: 'Video', cover: item.image || item.cover },
            };
        }

        if (type === 'album') {
            return {
                ...base,
                title: item.title || null,
                cover: item.cover || null,
                releaseDate: item.releaseDate || null,
                explicit: item.explicit || false,
                artist: item.artist
                    ? { name: item.artist.name || null, id: item.artist.id }
                    : item.artists?.[0]
                      ? { name: item.artists[0].name || null, id: item.artists[0].id }
                      : null,
                type: item.type || null,
                numberOfTracks: item.numberOfTracks || null,
            };
        }

        if (type === 'artist') {
            return {
                ...base,
                name: item.name || null,
                picture: item.picture || item.image || null,
            };
        }

        if (type === 'playlist') {
            return {
                uuid: item.uuid || item.id,
                addedAt: item.addedAt || Date.now(),
                title: item.title || item.name || null,
                image: item.image || item.squareImage || item.cover || null,
                numberOfTracks: item.numberOfTracks || (item.tracks ? item.tracks.length : 0),
                user: item.user ? { name: item.user.name || null } : null,
            };
        }

        if (type === 'mix') {
            return {
                id: item.id,
                addedAt: item.addedAt || Date.now(),
                title: item.title,
                subTitle: item.subTitle,
                mixType: item.mixType,
                cover: item.cover,
            };
        }

        return item;
    },

    async syncHistoryItem(historyEntry) {
        const user = authManager.user;
        if (!user) return;

        const record = await this._getUserRecord(user.$id);
        if (!record) return;

        let history = this.safeParseInternal(record.history, 'history', []);

        const newHistory = [historyEntry, ...history].slice(0, 100);
        await this._updateUserJSON(user.$id, 'history', newHistory);
    },

    async clearHistory() {
        const user = authManager.user;
        if (!user) return;

        await this._updateUserJSON(user.$id, 'history', []);
    },

    async syncUserPlaylist(playlist, action) {
        const user = authManager.user;
        if (!user) return;

        const record = await this._getUserRecord(user.$id);
        if (!record) return;

        let userPlaylists = this.safeParseInternal(record.user_playlists, 'user_playlists', {});

        if (action === 'delete') {
            delete userPlaylists[playlist.id];
            const { error } = await supabase
                .from(USER_PLAYLISTS_TABLE)
                .delete()
                .eq('user_id', user.$id)
                .eq('playlist_id', playlist.id);
            if (error) console.error('[Supabase] Failed to remove user playlist:', error);
            await this.unpublishPlaylist(playlist.id);
        } else {
            const payload = {
                id: playlist.id,
                name: playlist.name,
                description: playlist.description || '',
                cover: playlist.cover || null,
                tracks: playlist.tracks ? playlist.tracks.map((t) => this._minifyItem(t.type || 'track', t)) : [],
                createdAt: playlist.createdAt || Date.now(),
                updatedAt: playlist.updatedAt || Date.now(),
                numberOfTracks: playlist.tracks ? playlist.tracks.length : 0,
                images: playlist.images || [],
                isPublic: playlist.isPublic || false,
            };
            userPlaylists[playlist.id] = payload;

            const { error } = await supabase.from(USER_PLAYLISTS_TABLE).upsert(
                {
                    user_id: user.$id,
                    playlist_id: payload.id,
                    name: payload.name || 'Untitled Playlist',
                    description: payload.description || '',
                    cover: payload.cover || null,
                    tracks: Array.isArray(payload.tracks) ? payload.tracks : [],
                    images: Array.isArray(payload.images) ? payload.images : [],
                    is_public: !!payload.isPublic,
                    created_at: new Date(payload.createdAt || Date.now()).toISOString(),
                    updated_at: new Date(payload.updatedAt || Date.now()).toISOString(),
                },
                {
                    onConflict: 'user_id,playlist_id',
                }
            );
            if (error) console.error('[Supabase] Failed to sync user playlist:', error);

            if (playlist.isPublic) {
                await this.publishPlaylist(playlist);
            } else {
                await this.unpublishPlaylist(playlist.id);
            }
        }

        await this._updateUserJSON(user.$id, 'user_playlists', userPlaylists);
    },

    async syncUserFolder(folder, action) {
        const user = authManager.user;
        if (!user) return;

        const record = await this._getUserRecord(user.$id);
        if (!record) return;

        let userFolders = this.safeParseInternal(record.user_folders, 'user_folders', {});

        if (action === 'delete') {
            delete userFolders[folder.id];
        } else {
            userFolders[folder.id] = {
                id: folder.id,
                name: folder.name,
                cover: folder.cover || null,
                playlists: folder.playlists || [],
                createdAt: folder.createdAt || Date.now(),
                updatedAt: folder.updatedAt || Date.now(),
            };
        }

        await this._updateUserJSON(user.$id, 'user_folders', userFolders);
    },

    async getPublicPlaylist(uuid) {
        try {
            const record = await this.pb
                .collection(PUBLIC_COLLECTION)
                .getFirstListItem(`uuid="${uuid}"`, { p_id: uuid });

            let rawCover = record.image || record.cover || record.playlist_cover || '';
            let extraData = this.safeParseInternal(record.data, 'data', {});

            if (!rawCover && extraData && typeof extraData === 'object') {
                rawCover = extraData.cover || extraData.image || '';
            }

            let finalCover = rawCover;
            if (rawCover && !rawCover.startsWith('http') && !rawCover.startsWith('data:')) {
                finalCover = this.pb.files.getUrl(record, rawCover);
            }

            let images = [];
            let tracks = this.safeParseInternal(record.tracks, 'tracks', []);

            if (!finalCover && tracks && tracks.length > 0) {
                const uniqueCovers = [];
                const seenCovers = new Set();
                for (const track of tracks) {
                    const c = track.album?.cover;
                    if (c && !seenCovers.has(c)) {
                        seenCovers.add(c);
                        uniqueCovers.push(c);
                        if (uniqueCovers.length >= 4) break;
                    }
                }
                images = uniqueCovers;
            }

            let finalTitle = record.title || record.name || record.playlist_name;
            if (!finalTitle && extraData && typeof extraData === 'object') {
                finalTitle = extraData.title || extraData.name;
            }
            if (!finalTitle) finalTitle = 'Untitled Playlist';

            let finalDescription = record.description || '';
            if (!finalDescription && extraData && typeof extraData === 'object') {
                finalDescription = extraData.description || '';
            }

            return {
                ...record,
                id: record.uuid,
                name: finalTitle,
                title: finalTitle,
                description: finalDescription,
                cover: finalCover,
                image: finalCover,
                tracks: tracks,
                images: images,
                numberOfTracks: tracks.length,
                type: 'user-playlist',
                isPublic: true,
                user: { name: 'Community Playlist' },
            };
        } catch (error) {
            if (error.status === 404) return null;
            console.error('Failed to fetch public playlist:', error);
            throw error;
        }
    },

    async publishPlaylist(playlist) {
        if (!playlist || !playlist.id) return;
        const uid = authManager.user?.$id;
        if (!uid) return;

        const data = {
            uuid: playlist.id,
            uid: uid,
            title: playlist.name,
            name: playlist.name,
            playlist_name: playlist.name,
            image: playlist.cover,
            cover: playlist.cover,
            playlist_cover: playlist.cover,
            description: playlist.description || '',
            tracks: Array.isArray(playlist.tracks) ? playlist.tracks : [],
            is_public: true,
            data: {
                title: playlist.name,
                cover: playlist.cover,
                description: playlist.description || '',
            },
        };

        try {
            const existing = await this.pb.collection(PUBLIC_COLLECTION).getList(1, 1, {
                filter: `uuid="${playlist.id}"`,
                p_id: playlist.id,
            });

            if (existing.items.length > 0) {
                await this.pb.collection(PUBLIC_COLLECTION).update(existing.items[0].id, data, { f_id: uid });
            } else {
                await this.pb.collection(PUBLIC_COLLECTION).create(data, { f_id: uid });
            }
        } catch (error) {
            console.error('Failed to publish playlist:', error);
        }
    },

    async unpublishPlaylist(uuid) {
        const uid = authManager.user?.$id;
        if (!uid) return;

        try {
            const existing = await this.pb.collection(PUBLIC_COLLECTION).getList(1, 1, {
                filter: `uuid="${uuid}"`,
                p_id: uuid,
            });

            if (existing.items && existing.items.length > 0) {
                await this.pb.collection(PUBLIC_COLLECTION).delete(existing.items[0].id, { p_id: uuid, f_id: uid });
            }
        } catch (error) {
            console.error('Failed to unpublish playlist:', error);
        }
    },

    async getProfile(username) {
        try {
            const record = await this.pb.collection('DB_users').getFirstListItem(`username="${username}"`, {
                fields: 'username,display_name,avatar_url,banner,status,about,website,lastfm_username,privacy,user_playlists,favorite_albums',
            });
            return {
                ...record,
                privacy: this.safeParseInternal(record.privacy, 'privacy', { playlists: 'public', lastfm: 'public' }),
                user_playlists: this.safeParseInternal(record.user_playlists, 'user_playlists', {}),
                favorite_albums: this.safeParseInternal(record.favorite_albums, 'favorite_albums', []),
            };
        } catch {
            return null;
        }
    },

    async updateProfile(data) {
        const user = authManager.user;
        if (!user) return;
        const record = await this._getUserRecord(user.$id);
        if (!record) return;

        const updateData = { ...data };

        const updated = await this.pb.collection('DB_users').update(record.id, updateData, { f_id: user.$id });
        this._userRecordCache = updated;
    },

    async isUsernameTaken(username) {
        try {
            const list = await this.pb.collection('DB_users').getList(1, 1, { filter: `username="${username}"` });
            return list.totalItems > 0;
        } catch {
            return false;
        }
    },

    async clearCloudData() {
        const user = authManager.user;
        if (!user) return;

        try {
            const record = await this._getUserRecord(user.$id);
            if (record) {
                await this.pb.collection('DB_users').delete(record.id, { f_id: user.$id });
                this._userRecordCache = null;
                alert('Cloud data cleared successfully.');
            }
        } catch (error) {
            console.error('Failed to clear cloud data!', error);
            alert('Failed to clear cloud data! :( Check console for details.');
        }
    },

    async onAuthStateChanged(user) {
        if (user) {
            if (this._isSyncing) return;

            this._isSyncing = true;

            try {
                const cloudData = await this.getUserData();

                if (cloudData) {
                    let database = db;

                    const localData = {
                        tracks: (await database.getAll('favorites_tracks')) || [],
                        albums: (await database.getAll('favorites_albums')) || [],
                        artists: (await database.getAll('favorites_artists')) || [],
                        playlists: (await database.getAll('favorites_playlists')) || [],
                        mixes: (await database.getAll('favorites_mixes')) || [],
                        history: (await database.getAll('history_tracks')) || [],
                        userPlaylists: (await database.getAll('user_playlists')) || [],
                        userFolders: (await database.getAll('user_folders')) || [],
                    };

                    let { library, history, userPlaylists, userFolders } = cloudData;
                    let needsUpdate = false;

                    if (!library) library = {};
                    if (!library.tracks) library.tracks = {};
                    if (!library.albums) library.albums = {};
                    if (!library.artists) library.artists = {};
                    if (!library.playlists) library.playlists = {};
                    if (!library.mixes) library.mixes = {};
                    if (!userPlaylists) userPlaylists = {};
                    if (!userFolders) userFolders = {};
                    if (!history) history = [];

                    const mergeItem = (collection, item, type) => {
                        const id = type === 'playlist' ? item.uuid || item.id : item.id;
                        if (!collection[id]) {
                            collection[id] = this._minifyItem(type, item);
                            needsUpdate = true;
                        }
                    };

                    localData.tracks.forEach((item) => mergeItem(library.tracks, item, 'track'));
                    localData.albums.forEach((item) => mergeItem(library.albums, item, 'album'));
                    localData.artists.forEach((item) => mergeItem(library.artists, item, 'artist'));
                    localData.playlists.forEach((item) => mergeItem(library.playlists, item, 'playlist'));
                    localData.mixes.forEach((item) => mergeItem(library.mixes, item, 'mix'));

                    localData.userPlaylists.forEach((playlist) => {
                        if (!userPlaylists[playlist.id]) {
                            userPlaylists[playlist.id] = {
                                id: playlist.id,
                                name: playlist.name,
                                cover: playlist.cover || null,
                                tracks: playlist.tracks
                                    ? playlist.tracks.map((t) => this._minifyItem(t.type || 'track', t))
                                    : [],
                                createdAt: playlist.createdAt || Date.now(),
                                updatedAt: playlist.updatedAt || Date.now(),
                                numberOfTracks: playlist.tracks ? playlist.tracks.length : 0,
                                images: playlist.images || [],
                                isPublic: playlist.isPublic || false,
                            };
                            needsUpdate = true;
                        }
                    });

                    localData.userFolders.forEach((folder) => {
                        if (!userFolders[folder.id]) {
                            userFolders[folder.id] = {
                                id: folder.id,
                                name: folder.name,
                                cover: folder.cover || null,
                                playlists: folder.playlists || [],
                                createdAt: folder.createdAt || Date.now(),
                                updatedAt: folder.updatedAt || Date.now(),
                            };
                            needsUpdate = true;
                        }
                    });

                    const combinedHistory = [...history, ...localData.history];
                    combinedHistory.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

                    const uniqueHistory = [];
                    const seenTimestamps = new Set();

                    for (const item of combinedHistory) {
                        if (!item.timestamp) continue;
                        if (!seenTimestamps.has(item.timestamp)) {
                            seenTimestamps.add(item.timestamp);
                            uniqueHistory.push(item);
                        }
                        if (uniqueHistory.length >= 100) break;
                    }

                    if (JSON.stringify(history) !== JSON.stringify(uniqueHistory)) {
                        history = uniqueHistory;
                        needsUpdate = true;
                    }

                    if (needsUpdate) {
                        await this._updateUserJSON(user.$id, 'library', library);
                        await this._updateUserJSON(user.$id, 'user_playlists', userPlaylists);
                        await this._updateUserJSON(user.$id, 'user_folders', userFolders);
                        await this._updateUserJSON(user.$id, 'history', history);
                    }

                    await this._replaceLikedSongs(user.$id, library.tracks || {});
                    await this._replaceUserPlaylists(user.$id, userPlaylists || {});

                    const convertedData = {
                        favorites_tracks: Object.values(library.tracks).filter((t) => t && typeof t === 'object'),
                        favorites_albums: Object.values(library.albums).filter((a) => a && typeof a === 'object'),
                        favorites_artists: Object.values(library.artists).filter((a) => a && typeof a === 'object'),
                        favorites_playlists: Object.values(library.playlists).filter((p) => p && typeof p === 'object'),
                        favorites_mixes: Object.values(library.mixes).filter((m) => m && typeof m === 'object'),
                        history_tracks: history,
                        user_playlists: Object.values(userPlaylists).filter((p) => p && typeof p === 'object'),
                        user_folders: Object.values(userFolders).filter((f) => f && typeof f === 'object'),
                    };

                    await database.importData(convertedData);
                    await new Promise((resolve) => setTimeout(resolve, 300));

                    window.dispatchEvent(new CustomEvent('library-changed'));
                    window.dispatchEvent(new CustomEvent('history-changed'));
                    window.dispatchEvent(new HashChangeEvent('hashchange'));

                    console.log('[Supabase] ✓ Sync completed');
                }
            } catch (error) {
                console.error('[Supabase] Sync error:', error);
            } finally {
                this._isSyncing = false;
            }
        } else {
            this._userRecordCache = null;
            this._isSyncing = false;
        }
    },
};

if (pb) {
    authManager.onAuthStateChanged(syncManager.onAuthStateChanged.bind(syncManager));
}

export { pb, syncManager };
