import React from 'react';
import './Toolbar.css';
import { EVENT_TYPE_DEFINITIONS } from '../constants/eventTypeDefinitions';

interface ToolbarProps {
    selectedTool: string;
    onToolChange: (tool: string) => void;
    onDetectAggregates: () => void;
    onImportBoard: () => void;
    onExport: (format: 'mermaid' | 'plantuml' | 'pdf' | 'png') => void;
    onUndo: () => void;
    onRedo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    onEditDescription: () => void;
    hasSelectedEvent: boolean;
    storagePath: string;
    onChangeStoragePath: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
                                                    selectedTool,
                                                    onToolChange,
                                                    onDetectAggregates,
                                                    onImportBoard,
                                                    onExport,
                                                    onUndo,
                                                    onRedo,
                                                    canUndo,
                                                    canRedo,
                                                    onEditDescription,
                                                    hasSelectedEvent,
                                                    storagePath,
                                                    onChangeStoragePath,
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
                <button className="action-button secondary" onClick={onImportBoard}>
                    Import JSON
                </button>
                <button className="action-button secondary" onClick={onUndo} disabled={!canUndo}>
                    Undo
                </button>
                <button className="action-button secondary" onClick={onRedo} disabled={!canRedo}>
                    Redo
                </button>
                <button
                    className="action-button secondary"
                    onClick={onEditDescription}
                    disabled={!hasSelectedEvent}
                >
                    이벤트 설명 편집
                </button>
                <button className="action-button secondary" onClick={onChangeStoragePath}>
                    저장 경로 변경
                </button>
            </div>

            <div className="toolbar-section">
                <h3>Export</h3>
                <button className="action-button" onClick={() => onExport('mermaid')}>
                    Export Mermaid
                </button>
                <button className="action-button" onClick={() => onExport('plantuml')}>
                    Export PlantUML
                </button>
                <button className="action-button" onClick={() => onExport('pdf')}>
                    Export PDF
                </button>
                <button className="action-button" onClick={() => onExport('png')}>
                    Export PNG
                </button>
            </div>

            <div className="toolbar-section">
                <h3>Storage</h3>
                <p className="storage-path">{storagePath || '-'}</p>
            </div>

            <div className="toolbar-section">
                <h3>Help</h3>
                <div className="help-text">
                    <p>• Click on canvas to create event</p>
                    <p>• Drag to move event</p>
                    <p>• Double-click to rename event</p>
                    <p>• Right-click to delete event</p>
                    <p>• Cmd/Ctrl+I: Import JSON</p>
                    <p>• Cmd/Ctrl+Z: Undo, Cmd/Ctrl+Y: Redo</p>
                    <p>• Cmd/Ctrl+1~6: Select event type</p>
                </div>
            </div>
        </div>
    );
};
