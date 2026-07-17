import { addClient, removeClient } from '$lib/server/sse';

export function GET({ params }) {
    let client: ReturnType<typeof addClient>;

    const stream = new ReadableStream({
        start(controller) {
            client = addClient(params.id, controller);
            const encoder = new TextEncoder();
            controller.enqueue(encoder.encode(': connected\n\n'));
        },
        cancel() {
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
