import React, { useEffect, useMemo, useRef, useState } from 'react';
import Modal from './ui/Modal';
import { useTranslation } from '../hooks/useTranslation';
import { useProfile } from '../context/ProfileContext';
import {
  AI_LOCAL_STORAGE_KEY,
  AiChatMessage,
  AiConfig,
  AiDebugTrace,
  callAiInterviewer,
  normalizeGeneratedCards,
  resolveAiConfig,
} from '../utils/aiProfile';

interface AIProfileBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_CONFIG: AiConfig = {
  apiKey: '',
  baseUrl: '',
  model: '',
};

const QUICK_REPLY_KEYS = [
  'aiBuilder.quickReply1',
  'aiBuilder.quickReply2',
  'aiBuilder.quickReply3',
  'aiBuilder.quickReply4',
];

const AIProfileBuilderModal: React.FC<AIProfileBuilderModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { updateProfileData } = useProfile();
  const [config, setConfig] = useState<AiConfig>(DEFAULT_CONFIG);
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [appliedCount, setAppliedCount] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [debugLogs, setDebugLogs] = useState<AiDebugTrace[]>([]);
  const listRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(AI_LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<AiConfig>;
        setConfig({ ...DEFAULT_CONFIG, ...parsed });
      }
    } catch {
      setConfig(DEFAULT_CONFIG);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    if (messages.length > 0) return;
    setMessages([
      {
        role: 'assistant',
        content: t('aiBuilder.welcomeQuestion'),
      },
    ]);
  }, [isOpen, messages.length, t]);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, isSubmitting]);

  const resolvedConfig = useMemo(() => resolveAiConfig(config), [config]);

  const canSend = useMemo(() => {
    return Boolean(resolvedConfig.config.apiKey);
  }, [resolvedConfig]);

  const interviewRound = useMemo(() => {
    return messages.filter((m) => m.role === 'user').length;
  }, [messages]);

  const phase = useMemo(() => {
    if (appliedCount > 0) return 'done';
    if (interviewRound > 0) return 'interview';
    return 'ready';
  }, [appliedCount, interviewRound]);

  const updateConfig = (patch: Partial<AiConfig>) => {
    setConfig((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem(AI_LOCAL_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const applyGeneratedCards = (generated: unknown) => {
    const rawGenerated = generated as { cards?: unknown; userSettings?: { mainTitle?: string; subtitle?: string } };
    const cards = normalizeGeneratedCards(rawGenerated?.cards);
    if (!cards.length) {
      throw new Error(t('aiBuilder.emptyCardsError'));
    }

    updateProfileData((prev) => {
      const nextSettings = { ...prev.userSettings };
      if (rawGenerated?.userSettings) {
        if (rawGenerated.userSettings.mainTitle) {
          nextSettings.mainTitle = rawGenerated.userSettings.mainTitle;
        }
        if (rawGenerated.userSettings.subtitle) {
          nextSettings.subtitle = rawGenerated.userSettings.subtitle;
        }
      }
      return {
        ...prev,
        userSettings: nextSettings,
        cards,
      };
    });
    setAppliedCount(cards.length);
  };

  const runAi = async (nextHistory: AiChatMessage[], options?: { forceGenerate?: boolean }) => {
    setIsSubmitting(true);
    setError('');
    try {
      const result = await callAiInterviewer(config, nextHistory, options);
      if (result.debug) {
        setDebugLogs((prev) => [result.debug!, ...prev].slice(0, 20));
      }

      if (result.debug?.error) {
        setError(result.debug.error);
        return;
      }

      if (result.generated) {
        applyGeneratedCards(result.generated);
        const successText = result.assistantText || t('aiBuilder.applySuccess');
        setMessages((prev) => [...prev, { role: 'assistant', content: successText }]);
      } else {
        const reply = (result.assistantText || '').trim() || t('aiBuilder.fallbackQuestion');
        setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : t('aiBuilder.unknownError');
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isSubmitting || !canSend) return;
    const userMessage: AiChatMessage = { role: 'user', content: input.trim() };
    const nextHistory = [...messages, userMessage];
    setMessages(nextHistory);
    setInput('');
    await runAi(nextHistory);
  };

  const handleForceGenerate = async () => {
    if (isSubmitting || !canSend) return;
    const directive: AiChatMessage = {
      role: 'user',
      content: t('aiBuilder.forceGeneratePrompt'),
    };
    const nextHistory = [...messages, directive];
    setMessages(nextHistory);
    await runAi(nextHistory, { forceGenerate: true });
  };

  const handleResetChat = () => {
    setError('');
    setAppliedCount(0);
    setInput('');
    setDebugLogs([]);
    setMessages([
      {
        role: 'assistant',
        content: t('aiBuilder.welcomeQuestion'),
      },
    ]);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('aiBuilder.title')} contentClassName="ai-builder-modal-content">
      <div className="ai-builder-panel">
        <p className="modal-intro-text">{t('aiBuilder.intro')}</p>

        <div className="ai-builder-config-grid">
          <div className="ai-builder-status-strip" role="status" aria-live="polite">
            <span className={`ai-step ${phase === 'ready' ? 'is-active' : ''}`}>{t('aiBuilder.stepReady')}</span>
            <span className={`ai-step ${phase === 'interview' ? 'is-active' : ''}`}>{t('aiBuilder.stepInterview')}</span>
            <span className={`ai-step ${phase === 'done' ? 'is-active' : ''}`}>{t('aiBuilder.stepDone')}</span>
            <span className="ai-step-meta">{t('aiBuilder.round', { count: interviewRound })}</span>
          </div>

          <details
            className="ai-builder-advanced"
            open={showAdvanced}
            onToggle={(e) => setShowAdvanced((e.target as HTMLDetailsElement).open)}
          >
            <summary>{t('aiBuilder.advancedSettings')}</summary>
            <div className="ai-builder-advanced-content">
              <label className="ai-builder-field">
                <span>{t('aiBuilder.apiKey')}</span>
                <input
                  type="password"
                  value={config.apiKey}
                  onChange={(e) => updateConfig({ apiKey: e.target.value })}
                  placeholder={t('aiBuilder.apiKeyPlaceholder')}
                />
              </label>
              <label className="ai-builder-field">
                <span>{t('aiBuilder.baseUrl')}</span>
                <input
                  type="text"
                  value={config.baseUrl}
                  onChange={(e) => updateConfig({ baseUrl: e.target.value })}
                  placeholder="https://api.siliconflow.cn/v1"
                />
              </label>
              <label className="ai-builder-field ai-builder-field-full">
                <span>{t('aiBuilder.model')}</span>
                <input
                  type="text"
                  value={config.model}
                  onChange={(e) => updateConfig({ model: e.target.value })}
                  placeholder="Qwen/Qwen2.5-7B-Instruct"
                />
              </label>
            </div>
          </details>

          <div className="ai-builder-runtime-note">
            {resolvedConfig.usesFallbackApiKey ? t('aiBuilder.usingFallbackApi') : t('aiBuilder.usingCustomApi')}
            <span>{resolvedConfig.config.model}</span>
          </div>

          <details
            className="ai-builder-debug"
            open={showDebug}
            onToggle={(e) => setShowDebug((e.target as HTMLDetailsElement).open)}
          >
            <summary>{t('aiBuilder.debugPanel')}</summary>
            <div className="ai-debug-head">
              <span>{t('aiBuilder.debugHint')}</span>
              <button type="button" className="ai-debug-clear" onClick={() => setDebugLogs([])}>
                {t('aiBuilder.clearDebug')}
              </button>
            </div>
            <div className="ai-debug-list">
              {debugLogs.length === 0 ? (
                <p className="ai-debug-empty">{t('aiBuilder.noDebugYet')}</p>
              ) : (
                debugLogs.map((log, index) => (
                  <details key={`${log.elapsedMs}-${index}`} className="ai-debug-item">
                    <summary>
                      <strong>{log.provider}</strong>
                      <span>{log.model}</span>
                      <span>{log.elapsedMs}ms</span>
                      {log.error ? <em className="ai-debug-bad">ERR</em> : <em className="ai-debug-ok">OK</em>}
                    </summary>
                    <pre>{JSON.stringify(log, null, 2)}</pre>
                  </details>
                ))
              )}
            </div>
          </details>
        </div>

        <div ref={listRef} className="ai-chat-list" aria-live="polite">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`ai-chat-message ${message.role === 'assistant' ? 'is-assistant' : 'is-user'}`}
            >
              <span className="ai-chat-role">{message.role === 'assistant' ? 'AI' : t('aiBuilder.you')}</span>
              <p>{message.content}</p>
            </div>
          ))}
          {isSubmitting && (
            <div className="ai-chat-message is-assistant is-pending">
              <span className="ai-chat-role">AI</span>
              <p>{t('aiBuilder.thinking')}</p>
            </div>
          )}
        </div>

        {error && <p className="ai-builder-error">{error}</p>}
        {appliedCount > 0 && <p className="ai-builder-success">{t('aiBuilder.appliedCards', { count: appliedCount })}</p>}

        <div className="ai-builder-input-row">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('aiBuilder.inputPlaceholder')}
            rows={3}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <div className="ai-quick-replies" aria-label={t('aiBuilder.quickReplies')}>
            {QUICK_REPLY_KEYS.map((key) => {
              const reply = t(key);
              return (
              <button
                key={key}
                type="button"
                className="ai-quick-reply"
                onClick={() => {
                  setInput(reply);
                  inputRef.current?.focus();
                }}
                disabled={isSubmitting}
              >
                {reply}
              </button>
              );
            })}
          </div>
        </div>

        <div className="modal-actions ai-builder-actions">
          <button className="modal-button-secondary" onClick={handleResetChat} disabled={isSubmitting}>
            {t('aiBuilder.resetChat')}
          </button>
          <button className="modal-button-secondary" onClick={handleForceGenerate} disabled={isSubmitting || !canSend}>
            {t('aiBuilder.generateNow')}
          </button>
          <button className="modal-button-primary" onClick={handleSend} disabled={isSubmitting || !canSend || !input.trim()}>
            {t('aiBuilder.send')}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default AIProfileBuilderModal;
