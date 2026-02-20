interface ExportEvent {
    id: string;
    name: string;
    position: { x: number; y: number };
}

interface ExportAggregate {
    id: string;
    name: string;
    eventIds: string[];
}

interface ExportBoard {
    events: ExportEvent[];
    aggregates: ExportAggregate[];
}

function sanitizeId(id: string): string {
    return id.replace(/[^a-zA-Z0-9_]/g, '_');
}

function escapeLabel(value: string): string {
    return value.replace(/"/g, '\\"');
}

function getFlowOrderedEvents(events: ExportEvent[]): ExportEvent[] {
    return [...events].sort((a, b) => {
        if (a.position.x !== b.position.x) {
            return a.position.x - b.position.x;
        }
        return a.position.y - b.position.y;
    });
}

export function formatBoardAsMermaid(board: ExportBoard): string {
    const orderedEvents = getFlowOrderedEvents(board.events);
    const lines: string[] = ['flowchart LR'];

    for (const event of orderedEvents) {
        lines.push(`  ${sanitizeId(event.id)}["${escapeLabel(event.name)}"]`);
    }

    for (let i = 0; i < orderedEvents.length - 1; i += 1) {
        const from = sanitizeId(orderedEvents[i].id);
        const to = sanitizeId(orderedEvents[i + 1].id);
        lines.push(`  ${from} --> ${to}`);
    }

    for (const aggregate of board.aggregates) {
        lines.push(`  subgraph ${sanitizeId(aggregate.id)}["${escapeLabel(aggregate.name)}"]`);
        for (const eventId of aggregate.eventIds) {
            lines.push(`    ${sanitizeId(eventId)}`);
        }
        lines.push('  end');
    }

    return lines.join('\n');
}

export function formatBoardAsPlantUML(board: ExportBoard): string {
    const orderedEvents = getFlowOrderedEvents(board.events);
    const lines: string[] = ['@startuml', 'left to right direction'];

    for (const event of orderedEvents) {
        lines.push(`rectangle "${escapeLabel(event.name)}" as ${sanitizeId(event.id)}`);
    }

    for (let i = 0; i < orderedEvents.length - 1; i += 1) {
        const from = sanitizeId(orderedEvents[i].id);
        const to = sanitizeId(orderedEvents[i + 1].id);
        lines.push(`${from} --> ${to}`);
    }

    for (const aggregate of board.aggregates) {
        lines.push(`package "${escapeLabel(aggregate.name)}" as ${sanitizeId(aggregate.id)} {`);
        for (const eventId of aggregate.eventIds) {
            lines.push(`  ${sanitizeId(eventId)}`);
        }
        lines.push('}');
    }

    lines.push('@enduml');
    return lines.join('\n');
}
