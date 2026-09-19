/** Optional browser-agent navigation. Unsupported browsers need no polyfill. */
export function registerAgentTools({ getState, openCabinet }) {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const register = tool => {
        try {
            Promise.resolve(context.registerTool(tool, { signal: lifecycle.signal }))
                .catch(() => {}); // Optional integration must never block the arcade.
        } catch { /* Unsupported or disabled by the browser. */ }
    };
    register({
        name: 'get_arcade_state',
        description: 'Read the current arcade screen and available cabinet names. Does not expose music, tokens, or account identity.',
        inputSchema: { type: 'object', properties: {}, additionalProperties: false },
        annotations: { readOnlyHint: true, untrustedContentHint: false },
        execute(input) {
            if (!input || typeof input !== 'object' || Object.keys(input).length) throw new Error('No arguments expected.');
            return getState();
        },
    });
    register({
        name: 'open_arcade_cabinet',
        description: 'Open a cabinet instruction screen after the user has entered the arcade. Does not start a game or abandon an active run.',
        inputSchema: { type: 'object', properties: { cabinet: { type: 'string', enum: ['track', 'world', 'roast', 'higher', 'aux', 'drop', 'crate'] } }, required: ['cabinet'], additionalProperties: false },
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        async execute(input) {
            if (!input || Object.keys(input).some(key => key !== 'cabinet') || !['track', 'world', 'roast', 'higher', 'aux', 'drop', 'crate'].includes(input.cabinet)) throw new Error('Choose a valid cabinet.');
            await openCabinet(input.cabinet);
            return getState();
        },
    });
    window.addEventListener('pagehide', () => lifecycle.abort(), { once: true });
}
