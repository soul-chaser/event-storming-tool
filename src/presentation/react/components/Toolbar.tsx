import React from 'react';
import './Toolbar.css';

interface ToolbarProps {
    selectedTool: string;
    onToolChange: (tool: string) => void;
    onDetectAggregates: () => void;
}

const EVENT_TYPES = [
    { value: 'domain-event', label: 'Domain Event', color: '#FFA500' },
    { value: 'command', label: 'Command', color: '#87CEEB' },
    { value: 'policy', label: 'Policy', color: '#DDA0DD' },
    { value: 'aggregate', label: 'Aggregate', color: '#FFD700' },
    { value: 'external-system', label: 'External System', color: '#FFB6C1' },
    { value: 'read-model', label: 'Read Model', color: '#90EE90' },
];

export const Toolbar: React.FC<ToolbarProps> = ({
                                                    selectedTool,
                                                    onToolChange,
                                                    onDetectAggregates,
                                                }) => {
    return (
        <div className="toolbar">
            <div className="toolbar-section">
                <h3>Event Types</h3>
                <div className="tool-buttons">
                    {EVENT_TYPES.map((type) => (
                        <button
                            key={type.value}
                            className={`tool-button ${selectedTool === type.value ? 'active' : ''}`}
                            style={{
                                backgroundColor: type.color,
                                borderColor: selectedTool === type.value ? '#000' : '#666',
                            }}
                            onClick={() => onToolChange(type.value)}
                        >
                            {type.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="toolbar-section">
                <h3>Actions</h3>
                <button className="action-button" onClick={onDetectAggregates}>
                    Detect Aggregates
                </button>
            </div>

            <div className="toolbar-section">
                <h3>Help</h3>
                <div className="help-text">
                    <p>• Click on canvas to create event</p>
                    <p>• Drag to move event</p>
                    <p>• Double-click to delete event</p>
                </div>
            </div>
        </div>
    );
};