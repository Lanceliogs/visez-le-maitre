type Client = {
    controller: ReadableStreamDefaultController;
};

const contests = new Map<string, Set<Client>>();

export function addClient(contestId: string, controller: ReadableStreamDefaultController): Client {
    if (!contests.has(contestId)) contests.set(contestId, new Set());
    const client: Client = { controller };
    contests.get(contestId)!.add(client);
    return client;
}

export function removeClient(contestId: string, client: Client) {
    contests.get(contestId)?.delete(client);
    if (contests.get(contestId)?.size === 0) contests.delete(contestId);
}

export function broadcast(contestId: string, event: string = 'refresh') {
    const clients = contests.get(contestId);
    if (!clients) return;
    const data = `event: ${event}\ndata: {}\n\n`;
    const encoder = new TextEncoder();
    for (const client of clients) {
        try {
            client.controller.enqueue(encoder.encode(data));
        } catch {
            clients.delete(client);
        }
    }
}
