import React, { useState } from 'react';
import styles from './KnowledgeExplorer.module.css';
import { KnowledgeNote, StorageLocation } from '../../types/workspace';

export const KnowledgeExplorer: React.FC = () => {
  const [activeStorage, setActiveStorage] = useState<StorageLocation>('vps');
  const [notes, setNotes] = useState<KnowledgeNote[]>([
    {
      id: 'note-1',
      workspaceId: 'ws-1',
      title: '01_Workspace_Vision.md',
      content: '# Hermes Workspace Vision\n\nЕдиное рабочее пространство...',
      storage: 'vps',
      tags: ['vision', 'architecture'],
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'note-2',
      workspaceId: 'ws-1',
      title: 'Skill_React_Codegen.md',
      content: '# Skill: React Code Generation\n\nИнструкции для обучения агентов...',
      storage: 'vps',
      tags: ['skill', 'training'],
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'note-3',
      workspaceId: 'ws-1',
      title: 'Local_PC_Draft.md',
      content: '# Локальный черновик на ПК\n\nСохраняется на локальном диске пользователя.',
      storage: 'local_pc',
      localPath: 'C:/Vault/Local_PC_Draft.md',
      tags: ['local', 'draft'],
      updatedAt: new Date().toISOString(),
    },
  ]);

  const [selectedNoteId, setSelectedNoteId] = useState<string>('note-1');

  const selectedNote = notes.find((n) => n.id === selectedNoteId) || notes[0];

  const handleCreateNote = async () => {
    const newNote: KnowledgeNote = {
      id: `note-${Date.now()}`,
      workspaceId: 'ws-1',
      title: 'Новая_Заметка_или_Скилл.md',
      content: '# Новый материал\n\nВведите текст...',
      storage: activeStorage,
      localPath: activeStorage === 'local_pc' ? 'C:/Vault/New_File.md' : undefined,
      tags: ['new'],
      updatedAt: new Date().toISOString(),
    };

    setNotes((prev) => [...prev, newNote]);
    setSelectedNoteId(newNote.id);
  };

  const handleSave = async () => {
    if (!selectedNote) return;

    if (selectedNote.storage === 'local_pc') {
      // Local filesystem access is deliberately not enabled yet. The upcoming
      // connector will require a user-selected folder and a scoped permission.
      return;
    }

    setNotes((prev) =>
      prev.map((n) =>
        n.id === selectedNote.id ? { ...n, updatedAt: new Date().toISOString() } : n
      )
    );
  };

  const handleDelete = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (selectedNoteId === id && notes.length > 1) {
      setSelectedNoteId(notes[0].id);
    }
  };

  const filteredNotes = notes.filter((n) => n.storage === activeStorage);

  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <span className={styles.sectionTitle}>Knowledge & Skill Studio</span>
          <button className={styles.button} onClick={handleCreateNote}>
            + Создать
          </button>
        </div>

        <div className={styles.storageToggle}>
          <button
            className={`${styles.toggleBtn} ${
              activeStorage === 'vps' ? styles.toggleActive : ''
            }`}
            onClick={() => setActiveStorage('vps')}
          >
            VPS Storage
          </button>
          <button
            className={`${styles.toggleBtn} ${
              activeStorage === 'local_pc' ? styles.toggleActive : ''
            }`}
            onClick={() => setActiveStorage('local_pc')}
          >
            Local PC Storage
          </button>
        </div>

        <div className={styles.fileList}>
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className={`${styles.fileItem} ${
                note.id === selectedNoteId ? styles.fileActive : ''
              }`}
              onClick={() => setSelectedNoteId(note.id)}
            >
              <span>{note.title}</span>
              <span className={styles.badge}>{note.storage.toUpperCase()}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.editorArea}>
        {selectedNote && (
          <>
            <div className={styles.editorHeader}>
              <input
                type="text"
                className={styles.docTitleInput}
                value={selectedNote.title}
                onChange={(e) => {
                  const val = e.target.value;
                  setNotes((prev) =>
                    prev.map((n) => (n.id === selectedNote.id ? { ...n, title: val } : n))
                  );
                }}
              />
              <div className={styles.actions}>
                <button className={styles.button} onClick={handleSave}>
                  Сохранить ({selectedNote.storage.toUpperCase()})
                </button>
                <button
                  className={`${styles.button} ${styles.buttonDanger}`}
                  onClick={() => handleDelete(selectedNote.id)}
                >
                  Удалить
                </button>
              </div>
            </div>

            <div className={styles.editorBody}>
              <textarea
                className={styles.textarea}
                value={selectedNote.content}
                onChange={(e) => {
                  const val = e.target.value;
                  setNotes((prev) =>
                    prev.map((n) => (n.id === selectedNote.id ? { ...n, content: val } : n))
                  );
                }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};
