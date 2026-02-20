import React from 'react';
import './Toolbar.css';
import { EVENT_TYPE_DEFINITIONS } from '../constants/eventTypeDefinitions';

interface ToolbarProps {
    selectedTool: string;
    onToolChange: (tool: string) => void;
    onDetectAggregates: () => void;
}

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
                    {EVENT_TYPE_DEFINITIONS.map((type) => (
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
                    <p>• Double-click to rename event</p>
                    <p>• Right-click to delete event</p>
                </div>
            </div>
        </div>
    );
};
