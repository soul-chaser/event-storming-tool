import React from 'react';
import './Toolbar.css';
import { EVENT_TYPE_DEFINITIONS } from '../constants/eventTypeDefinitions';

interface ToolbarProps {
    selectedTool: string;
    onToolChange: (tool: string) => void;
    onDetectAggregates: () => void;
    onImportBoard: () => void;
    onDeleteSelectedCards: () => void;
    canDeleteSelection: boolean;
    onStartArrowMode: () => void;
    isArrowMode: boolean;
    onExport: (format: 'mermaid' | 'plantuml' | 'pdf' | 'png') => void;
    onUndo: () => void;
    onRedo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    onRenameCard: () => void;
    storagePath: string;
    onChangeStoragePath: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
                                                    selectedTool,
                                                    onToolChange,
                                                    onDetectAggregates,
                                                    onImportBoard,
                                                    onDeleteSelectedCards,
                                                    canDeleteSelection,
                                                    onStartArrowMode,
                                                    isArrowMode,
                                                    onExport,
                                                    onUndo,
                                                    onRedo,
                                                    canUndo,
                                                    canRedo,
                                                    onRenameCard,
                                                    storagePath,
                                                    onChangeStoragePath,
                                                }) => {
    return (
        <div className="toolbar">
            <div className="toolbar-section">
                <h3>Card Types</h3>
                <div className="tool-buttons">
                    {EVENT_TYPE_DEFINITIONS.map((type, index) => (
                        <button
                            key={type.value}
                            className={`tool-button ${selectedTool === type.value ? 'active' : ''}`}
                            style={{
                                backgroundColor: type.color,
                                borderColor: selectedTool === type.value ? '#000' : '#666',
                            }}
                            onClick={() => onToolChange(type.value)}
                        >
                            <span>{type.label}</span>
                            <span className="shortcut-chip">{`Cmd/Ctrl+${index + 1}`}</span>
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
                    <span>Import JSON</span>
                    <span className="shortcut-chip">Cmd/Ctrl+I</span>
                </button>
                <button className="action-button secondary" onClick={onDeleteSelectedCards} disabled={!canDeleteSelection}>
                    <span>선택 카드 삭제</span>
                    <span className="shortcut-chip">Delete / Backspace</span>
                </button>
                <button className="action-button secondary" onClick={onUndo} disabled={!canUndo}>
                    <span>Undo</span>
                    <span className="shortcut-chip">Cmd/Ctrl+Z</span>
                </button>
                <button className="action-button secondary" onClick={onRedo} disabled={!canRedo}>
                    <span>Redo</span>
                    <span className="shortcut-chip">Cmd/Ctrl+Y</span>
                </button>
                <button
                    className="action-button secondary"
                    onClick={onRenameCard}
                >
                    <span>카드 이름 변경</span>
                    <span className="shortcut-chip">Cmd/Ctrl+E</span>
                </button>
                <button
                    className={`action-button secondary ${isArrowMode ? 'active-mode' : ''}`}
                    onClick={onStartArrowMode}
                >
                    <span>화살머리 선 추가</span>
                    <span className="shortcut-chip">Cmd/Ctrl+L</span>
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
                    <p>• Click on canvas to create card</p>
                    <p>• Drag to move card</p>
                    <p>• Double-click to rename card</p>
                    <p>• Cmd/Ctrl+I: Import JSON</p>
                    <p>• Cmd/Ctrl+Z: Undo, Cmd/Ctrl+Y: Redo</p>
                    <p>• Cmd/Ctrl+E: Rename selected card</p>
                    <p>• Cmd/Ctrl+L: Add arrowed line mode</p>
                    <p>• Cmd/Ctrl+1~6: Select card type</p>
                </div>
            </div>
        </div>
    );
};
