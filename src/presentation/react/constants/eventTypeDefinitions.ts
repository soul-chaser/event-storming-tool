export interface EventTypeDefinition {
    value: string;
    label: string;
    color: string;
    defaultName: string;
}

export const EVENT_TYPE_DEFINITIONS: EventTypeDefinition[] = [
    { value: 'domain-event', label: 'Domain Event', color: '#FFA500', defaultName: 'New Domain Event' },
    { value: 'command', label: 'Command', color: '#87CEEB', defaultName: 'New Command' },
    { value: 'policy', label: 'Policy', color: '#DDA0DD', defaultName: 'New Policy' },
    { value: 'aggregate', label: 'Aggregate', color: '#FFD700', defaultName: 'New Aggregate' },
    { value: 'external-system', label: 'External System', color: '#FFB6C1', defaultName: 'New External System' },
    { value: 'read-model', label: 'Read Model', color: '#90EE90', defaultName: 'New Read Model' },
];

export function getDefaultEventNameByType(type: string): string {
    return EVENT_TYPE_DEFINITIONS.find((definition) => definition.value === type)?.defaultName ?? 'New Event';
}
