import { addClient, removeClient } from '$lib/server/sse';

const HEARTBEAT_MS = 30_000;

export function GET({ params }) {
    let client: ReturnType<typeof addClient>;
    let heartbeat: ReturnType<typeof setInterval>;

    const stream = new ReadableStream({
        start(controller) {
            client = addClient(params.id, controller);
            const encoder = new TextEncoder();
            controller.enqueue(encoder.encode(': connected\n\n'));

            heartbeat = setInterval(() => {
                try {
                    controller.enqueue(encoder.encode(': ping\n\n'));
                } catch {
                    clearInterval(heartbeat);
                }
            }, HEARTBEAT_MS);
        },
        cancel() {
            clearInterval(heartbeat);
            removeClient(params.id, client);
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}
