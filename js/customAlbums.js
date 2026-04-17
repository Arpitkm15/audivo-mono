const HOT_HITS_HINDI_ALBUM_ID = 'hot-hits-hindi';
const HOT_HITS_HINDI_ALBUM_TITLE = 'Hot Hits Hindi';
const HOT_HITS_PUNJABI_ALBUM_ID = 'hot-hits-punjabi';
const HOT_HITS_PUNJABI_ALBUM_TITLE = 'Hot Hits Punjabi';
const HOT_HITS_ENGLISH_ALBUM_ID = 'hot-hits-english';
const HOT_HITS_ENGLISH_ALBUM_TITLE = 'Hot Hits English';
const HOT_HITS_HARYANVI_ALBUM_ID = 'hot-hits-haryanvi';
const HOT_HITS_HARYANVI_ALBUM_TITLE = 'Hot Hits Haryanvi';

const HOT_HITS_HINDI_TRACK_QUERIES = [
    'Dhurandhar The Revenge - Aari Aari',
    'Sitaare (From "Ikkis")',
    'Saiyaara (From "Saiyaara")',
    'Aawaara Angaara',
    'Gehra Hua (From "Dhurandhar")',
    'Phir Se (From "Dhurandhar The Revenge")',
    'Finding Her',
    'Arz Kiya Hai | Coke Studio Bharat',
    'Sahiba',
    'Main Aur Tu',
    'Run Down The City - Monica',
    'Thodi Si Daaru',
    'Deewaana Deewaana',
    'Deewaniyat (From "Ek Deewane Ki Deewaniyat") (Original Motion Picture Soundtrack)',
    'Ae Ajnabee | Coke Studio Bharat',
    'Ek Din Title Track - From "Ek Din"',
    'Sajni (From "Laapataa Ladies")',
    'Dil Lagana Mana Tha',
    'Aavan Jaavan (From "WAR 2")',
    'Shararat (From "Dhurandhar")',
    'Aarzu',
    'Khat',
    'Raanjhan (From "Do Patti")',
    'Humsafar (From "Saiyaara")',
    'The Last Letter',
    'RAINA',
    'Ehsaas',
    'Jo Ishq Hua',
    'Pardesiya - From "Param Sundari"',
    'Jaane Na Tu (From "UR Debut")',
    'Paan Ki Dukaan (From "O\' Romeo")',
    'Ghar Kab Aaoge (From "BORDER 2")',
    'Iss Tarah',
    'Tumse Behtar (From "Sunny Sanskari Ki Tulsi Kumari")',
    'Paro',
    'Tere Ishk Mein (From "Tere Ishk Mein")',
    'Ishq Hai',
    'Dhun (From "Saiyaara")',
    'Qayde Se (From "Metro ... In Dino")',
    'Guzaara (From "Baaghi 4")',
    'Andaaz e Karam',
    'I\'m Done. - I-Popstar: Vol. 1',
    'Uyi Amma - From "Azaad"',
    'Ghafoor',
    'Tum Mere Na Huye - From "Thamma"',
    'Nafrat',
    'Qubool (From "Haq")',
    'bargad',
    'Inaam',
    'Banda Kaam Ka',
];

const HOT_HITS_PUNJABI_TRACK_QUERIES = [
    'Dealer',
    'Sirra',
    'Aura',
    'High On You',
    'Tu',
    'For A Reason',
    'Jogi',
    'Aadat (Feat. AP Dhillon)',
    'Tutor',
    'LAAVAN',
    'Naal Nachna',
    'Deewane',
    'Barota',
    'Superstar',
    'DOPAMINE',
    'Mera Mann',
    'Lor Lor',
    'Thodi Si Daaru',
    'Supreme',
    'Tere Bina Na Guzara E',
    'Piche Tere',
    'Bande 4',
    'Jaiye Sajana',
    'Midnight Call',
    'Ok Hoye Paye Haan',
    'Nazare',
    'Ranjha',
    'Boyfriend',
    'Afsos',
    'Balenci',
    'AZUL',
    "Can't Be Us",
    'Dhurandhar The Revenge - Aari Aari',
    'Faqeeran - Live',
    'That Girl',
    'Police',
    'Water',
    'At Peace',
    'Haseen',
    'Thinking of You',
    'Qatal',
    'Together',
    'Lutt Le Gaya',
    'Millionaire',
    'Convo',
    '8',
    'Charmer',
    'Without Me',
    'SHKINI',
    '05-Jul',
];

const HOT_HITS_ENGLISH_TRACK_QUERIES = [
    'Shape of You',
    'Blinding Lights',
    'Somewhere Far Away',
    'As It Was',
    'lovely',
    'rockstar',
    'Birds Of A Feather',
    'Flowers',
    'Yellow',
    'One Dance',
    'YUKON',
    'Kill Bill',
    'Smooth Operator',
    'Sunflower - Spider-Man: Into the Spider-Verse',
    'i love you',
    "Stumblin' In",
    'bad guy',
    'Enjoy The Silence',
    'Perfect',
    'Chase the Sun',
    'Thinking out Loud',
    'Celestial',
    'Ayo Technology',
    'Starboy',
    "I'm Good (Blue)",
    'Something Just Like This',
    "We Can't Be Friends",
    'Habits (Stay High)',
    'Sweet Dreams (Are Made Of This)',
    'I Like Me Better',
    'Havana (feat. Young Thug)',
    'Coastline',
    'Shallow',
    'Locked Away',
    'All of Me',
    'No Diggity',
    'So Sick',
    'Upside Down',
    "You're Somebody Else",
    'Jocelyn Flores',
    'Take Me To Church',
    'Stay',
    'Clocks',
    'Faith (with Dolly Parton) [feat. Mr. Probz]',
    'Diet Pepsi',
    'Good Luck, Babe!',
    "Can't Feel My Face",
    'Lean On (feat. MØ & DJ Snake)',
    "I'm So Tired...",
    'Silence',
    'Blessings',
    'Watermelon Sugar',
    'Blinding Lights',
    "Creepin' (with The Weeknd & 21 Savage)",
    "That's So True",
    'Miles On It',
    'Electricity',
    'Cigarette Daydreams',
    'Almost Home',
    'Chemical',
    'Relax, Take It Easy',
    'Night Changes',
    'Riptide',
    'I Will Find',
    'We Found Love',
    'Cooler Than Me - Single Mix',
    'Ghost',
    'Best Friend (feat. NERVO, The Knocks & ALISA UENO)',
    'Little Hollywood',
    'Congratulations',
    "Don't Be So Shy",
    'I Took A Pill In Ibiza - Seeb Remix',
    "I Don't Wanna Wait",
    'Too Sweet',
    'Runaway',
    'Sugar',
    'Feel',
    'Bad Habits',
    'Think Of Me',
    'BITTERSUITE',
    'Numb',
    'back to friends',
    'What Is Love',
    'Tongue Tied',
    'A Bar Song (Tipsy)',
    'Apologize',
    'i like the way you kiss me',
    'Inner Light',
    'Delilah',
];

const HOT_HITS_HARYANVI_TRACK_QUERIES = [
    'Bairan',
    'Sheesha - Aakhya Mai Aakh Ghali Jo Bairan',
    'Bairi',
    'Seet Lehar',
    'Total',
    'Champ',
    'Russian Bandana',
    'Naam Chale',
    'Gach Laage (From "Licence")',
    'Raat Ke Shikari',
    'Ace',
    'Kitab',
    'Tu Na Samjhe',
    'Gaadi 150',
    'Status',
    'License Ka Asla (From "Licence")',
    'Not Guilty',
    'Tension',
    'Illusion',
    'Jogi',
    'Ranjha',
    'Bounce',
    'Financer',
    'Thug Love',
    'Broken',
    'Yaari',
    'Gaadi Paache Gaadi',
    'Bottle',
    'Jaat Intro (feat. Pranjal Dahiya)',
    'Moves',
    'GAAM GAWAH',
    'Ram Ji Aake Bhala Karenge - From "Bhooth Bangla"',
    '2 Khatole (Lofi Mix)',
    'Sheesha - Aakhya Mai Aakh Ghali Jo Bairan',
    'Maruti',
    'Naam Tera',
    'Label Blue',
    'Nateeja',
    'Teri Ramjhol Bole Gi (feat. Kay D & Aarohi Raghav)',
    'Ramayan Ka Saar',
    'Dil Pe Zakham Khate Hain',
    'Tarraki',
    'Baba Ji',
    'Ghode 3',
    'Blender',
    'Mithi Bole Bangro',
    'Rail',
    'Warning',
    'Lofar',
    'Kabootri',
    'Ek Khtola Jail Ke Bhitar',
    'Mahila Mittar',
    'Kabootar',
    'Matak Chalungi',
    'Love You Tere Te',
    'Bada Saang',
    'Hero Handa',
    'Jale 2',
    'Nazra Ke Teer',
    'Up To U',
    'Desi Hood',
    'Chilam Ke Sutte',
    'Fortuner',
    'Lamba Lamba Ghunghat',
    'Gypsy (feat. Pranjal Dahiya )',
    'Gabbar Bhi Nachega (feat. Nidhi Sharma)',
    'Attitude',
    'Bhagatt Aadmi',
    'Thar',
    'Laado',
    'Dabya Ni Karde',
    'Ghana Kasoota (feat. Surbhi Jyoti)',
    'Rao Sahab Drill',
    'Haryana Hood',
    'Moto',
    'Chatak Matak',
    'Lala Lori',
    'Nangad (feat. Pranjal Dahiya)',
    'Yadav Brand 2 (feat. Elvish Yadav)',
    'Mote Peg',
    'Kaana Pe Baal',
    'Ghungroo',
    'Dj Pe Matkungi',
    'Chand',
    'Jale',
    'Heavy Ghaghra',
    'Tu Cheez Lajwab',
    'Chore Haryane Aale',
    '2 Gulaab',
    'Haye Garmi',
    'Khadi Matke',
    'Fouji Fojan 2',
    'Kaana Pe Baal',
    'Kaki',
    'Payal',
    'Bhaga Aale',
    'Mard',
    'Tag Awara Ke',
    'Nature',
    'Iski Bhen Ki Maje Maje',
    'Gunday',
    'Gadar',
    'Uncle (feat Aarju Dhillon)',
    'Jija Ji',
    'Not Like You',
    'High Court',
    'Ghagre Wali Chhori',
    'Jaat Gelya Yaari',
    'Ranjha',
    'Yamdoot (Clean Version)',
    'La Te Thalle',
    'Kiya Kiya',
    'Apna Bana Le',
    'Sarkar',
    'Bau Ji',
    'Chele Chapte',
    'DINOSAUR',
    'Hopeless',
    'Kishor Avastha',
    'Rohtak Ke Albadi',
    'Nas Nas Kyu Dukhe',
    'Fortuner',
];

const CUSTOM_ALBUMS = {
    [HOT_HITS_HINDI_ALBUM_ID]: {
        id: HOT_HITS_HINDI_ALBUM_ID,
        title: HOT_HITS_HINDI_ALBUM_TITLE,
        tracks: HOT_HITS_HINDI_TRACK_QUERIES,
    },
    [HOT_HITS_PUNJABI_ALBUM_ID]: {
        id: HOT_HITS_PUNJABI_ALBUM_ID,
        title: HOT_HITS_PUNJABI_ALBUM_TITLE,
        tracks: HOT_HITS_PUNJABI_TRACK_QUERIES,
    },
    [HOT_HITS_ENGLISH_ALBUM_ID]: {
        id: HOT_HITS_ENGLISH_ALBUM_ID,
        title: HOT_HITS_ENGLISH_ALBUM_TITLE,
        tracks: HOT_HITS_ENGLISH_TRACK_QUERIES,
    },
    [HOT_HITS_HARYANVI_ALBUM_ID]: {
        id: HOT_HITS_HARYANVI_ALBUM_ID,
        title: HOT_HITS_HARYANVI_ALBUM_TITLE,
        tracks: HOT_HITS_HARYANVI_TRACK_QUERIES,
    },
};

const customAlbumCache = new Map();

const normalizeText = (value) =>
    String(value || '')
        .toLowerCase()
        .replace(/[^a-z0-9 ]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

const scoreTrackMatch = (track, query) => {
    const queryTokens = normalizeText(query)
        .split(' ')
        .filter((token) => token.length >= 3);
    if (queryTokens.length === 0) return 0;

    const artists = Array.isArray(track.artists) ? track.artists.map((artist) => artist.name).join(' ') : '';
    const haystack = normalizeText(`${track.title || ''} ${artists}`);

    return queryTokens.reduce((score, token) => score + (haystack.includes(token) ? 1 : 0), 0);
};

const pickBestTrack = (items, query) => {
    if (!Array.isArray(items) || items.length === 0) return null;
    if (items.length === 1) return items[0];

    return items
        .map((item) => ({ item, score: scoreTrackMatch(item, query) }))
        .sort((a, b) => b.score - a.score)[0].item;
};

const resolveTrackByQuery = async (api, query) => {
    try {
        const result = await api.searchTracks(query, { limit: 5 });
        return pickBestTrack(result?.items || [], query);
    } catch (error) {
        console.warn(`Failed to resolve track for query: ${query}`, error);
        return null;
    }
};

export const isCustomAlbumId = (albumId) => Boolean(CUSTOM_ALBUMS[String(albumId || '').toLowerCase()]);

export async function resolveCustomAlbum(api, albumId) {
    const normalizedAlbumId = String(albumId || '').toLowerCase();
    const albumConfig = CUSTOM_ALBUMS[normalizedAlbumId];
    if (!albumConfig) return null;

    if (!customAlbumCache.has(normalizedAlbumId)) {
        customAlbumCache.set(
            normalizedAlbumId,
            (async () => {
                const resolvedTracks = [];
                const seenTrackIds = new Set();
                const batchSize = 6;

                for (let i = 0; i < albumConfig.tracks.length; i += batchSize) {
                    const chunk = albumConfig.tracks.slice(i, i + batchSize);
                    const chunkResults = await Promise.all(chunk.map((query) => resolveTrackByQuery(api, query)));

                    for (const track of chunkResults) {
                        if (!track || !track.id || seenTrackIds.has(track.id)) continue;
                        seenTrackIds.add(track.id);
                        resolvedTracks.push(track);
                    }
                }

                const fallbackCoverId = resolvedTracks[0]?.album?.cover || resolvedTracks[0]?.cover || null;

                return {
                    album: {
                        id: albumConfig.id,
                        title: albumConfig.title,
                        artist: {
                            id: 'audivo-curated',
                            name: 'audivo Curated',
                        },
                        cover: fallbackCoverId,
                        releaseDate: null,
                        _isCustomAlbum: true,
                    },
                    tracks: resolvedTracks,
                };
            })()
        );
    }

    return customAlbumCache.get(normalizedAlbumId);
}

export function getHotHitsHindiPath() {
    return `/album/${HOT_HITS_HINDI_ALBUM_ID}`;
}

export function getHotHitsPunjabiPath() {
    return `/album/${HOT_HITS_PUNJABI_ALBUM_ID}`;
}

export function getHotHitsEnglishPath() {
    return `/album/${HOT_HITS_ENGLISH_ALBUM_ID}`;
}

export function getHotHitsHaryanviPath() {
    return `/album/${HOT_HITS_HARYANVI_ALBUM_ID}`;
}
