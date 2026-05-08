import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, Settings, Sparkles, Send, RotateCcw, Wand2, Gamepad2, Music, Users, ChevronRight } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { useProfile } from '../context/ProfileContext';
import {
  AI_LOCAL_STORAGE_KEY,
  AiChatMessage,
  AiConfig,
  callAiInterviewer,
  normalizeGeneratedCards,
  resolveAiConfig,
} from '../utils/aiProfile';

interface AIChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_CONFIG: AiConfig = {
  provider: 'gemini',
  apiKey: '',
  baseUrl: '',
  model: 'gemini-2.5-flash-lite',
};

const PROVIDER_PRESETS: Record<string, { baseUrl: string; model: string }> = {
  gemini: { baseUrl: 'https://generativelanguage.googleapis.com/v1beta', model: 'gemini-2.5-flash-lite' },
  openai: { baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
  anthropic: { baseUrl: 'https://api.anthropic.com', model: 'claude-sonnet-4-20250514' },
  custom: { baseUrl: '', model: '' },
};

const QUICK_STARTS = [
  { key: 'quickStart1', icon: Wand2, replyKey: 'quickReply4' },
  { key: 'quickStart2', icon: Gamepad2, replyKey: 'quickReply2' },
  { key: 'quickStart3', icon: Music, replyKey: 'quickReply3' },
  { key: 'quickStart4', icon: Users, replyKey: 'quickReply1' },
];

const AIChatPanel: React.FC<AIChatPanelProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { updateProfileData } = useProfile();
  const [config, setConfig] = useState<AiConfig>(DEFAULT_CONFIG);
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [appliedCount, setAppliedCount] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, isSubmitting]);

  const resolvedConfig = useMemo(() => resolveAiConfig(config), [config]);
  const canSend = useMemo(() => Boolean(resolvedConfig.config.apiKey), [resolvedConfig]);
  const interviewRound = useMemo(() => messages.filter(m => m.role === 'user').length, [messages]);
  const phase = useMemo(() => {
    if (appliedCount > 0) return 'done';
    if (interviewRound > 0) return 'interview';
    return 'ready';
  }, [appliedCount, interviewRound]);

  const updateConfig = (patch: Partial<AiConfig>) => {
    setConfig(prev => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(AI_LOCAL_STORAGE_KEY, JSON.stringify(next));
      } catch { /* quota exceeded */ }
      return next;
    });
  };

  const applyGeneratedCards = (generated: unknown) => {
    const raw = generated as { cards?: unknown; userSettings?: { mainTitle?: string; subtitle?: string } };
    const cards = normalizeGeneratedCards(raw?.cards);
    if (!cards.length) throw new Error(t('aiBuilder.emptyCardsError'));

    updateProfileData(prev => {
      const nextSettings = { ...prev.userSettings };
      if (raw?.userSettings) {
        if (raw.userSettings.mainTitle) nextSettings.mainTitle = raw.userSettings.mainTitle;
        if (raw.userSettings.subtitle) nextSettings.subtitle = raw.userSettings.subtitle;
      }
      return { ...prev, userSettings: nextSettings, cards };
    });
    setAppliedCount(cards.length);
  };

  const errorCodeToMessage = (code?: string, fallback?: string): string => {
    if (!code) return fallback || t('aiBuilder.unknownError');
    const key = `aiBuilder.${code}`;
    const params = code === 'API_ERROR' ? { message: fallback || '' } : undefined;
    const translated = t(key, params);
    return translated === key ? (fallback || t('aiBuilder.unknownError')) : translated;
  };

  const runAi = async (nextHistory: AiChatMessage[], options?: { forceGenerate?: boolean }) => {
    setIsSubmitting(true);
    setError('');
    try {
      const result = await callAiInterviewer(resolvedConfig.config, nextHistory, options);
      if (result.debug?.error) {
        setError(errorCodeToMessage(result.debug.errorCode, result.debug.error));
        return;
      }

      if (result.generated) {
        applyGeneratedCards(result.generated);
        setMessages(prev => [...prev, { role: 'assistant', content: result.assistantText || t('aiBuilder.applySuccess') }]);
      } else {
        const reply = (result.assistantText || '').trim() || t('aiBuilder.fallbackQuestion');
        setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('aiBuilder.unknownError'));
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

  const handleQuickStart = async (replyKey: string) => {
    if (isSubmitting || !canSend) return;
    const reply = t(`aiBuilder.${replyKey}`);
    const userMessage: AiChatMessage = { role: 'user', content: reply };
    const nextHistory = [...messages, userMessage];
    setMessages(nextHistory);
    await runAi(nextHistory);
  };

  const handleForceGenerate = async () => {
    if (isSubmitting || !canSend) return;
    const directive: AiChatMessage = { role: 'user', content: t('aiBuilder.forceGeneratePrompt') };
    const nextHistory = [...messages, directive];
    setMessages(nextHistory);
    await runAi(nextHistory, { forceGenerate: true });
  };

  const handleResetChat = () => {
    setError('');
    setAppliedCount(0);
    setInput('');
    setMessages([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="ai-panel-overlay" onClick={onClose}>
      <div className="ai-panel" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="ai-panel-header">
          <div className="ai-panel-header-left">
            <Sparkles size={20} className="ai-panel-icon" />
            <h2 className="ai-panel-title">{t('aiBuilder.title')}</h2>
            {phase !== 'ready' && (
              <span className="ai-panel-phase">
                {phase === 'interview' ? t('aiBuilder.stepInterview') : t('aiBuilder.stepDone')}
              </span>
            )}
          </div>
          <div className="ai-panel-header-right">
            <button
              type="button"
              className="ai-panel-header-btn"
              onClick={() => setShowSettings(!showSettings)}
              title={t('aiBuilder.advancedSettings')}
              aria-expanded={showSettings}
            >
              <Settings size={18} />
            </button>
            <button type="button" className="ai-panel-header-btn" onClick={onClose} title="Close">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Settings Panel (slide down) */}
        {showSettings && (
          <div className="ai-panel-settings">
            <div className="ai-settings-grid">
              <label className="ai-settings-field">
                <span>Provider</span>
                <select
                  value={config.provider || 'gemini'}
                  onChange={e => {
                    const provider = e.target.value as AiConfig['provider'];
                    const preset = PROVIDER_PRESETS[provider];
                    updateConfig({ provider, baseUrl: preset.baseUrl, model: preset.model });
                  }}
                >
                  <option value="gemini">Google Gemini</option>
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="custom">Custom Endpoint</option>
                </select>
              </label>
              <label className="ai-settings-field">
                <span>{t('aiBuilder.apiKey')}</span>
                <input
                  type="password"
                  value={config.apiKey}
                  onChange={e => updateConfig({ apiKey: e.target.value })}
                  placeholder={t('aiBuilder.apiKeyPlaceholder')}
                />
              </label>
              <label className="ai-settings-field">
                <span>{t('aiBuilder.baseUrl')}</span>
                <input
                  type="text"
                  value={config.baseUrl}
                  onChange={e => updateConfig({ baseUrl: e.target.value })}
                  placeholder="https://generativelanguage.googleapis.com/v1beta"
                />
              </label>
              <label className="ai-settings-field">
                <span>{t('aiBuilder.model')}</span>
                <input
                  type="text"
                  value={config.model}
                  onChange={e => updateConfig({ model: e.target.value })}
                  placeholder="gemini-2.5-flash-lite"
                />
              </label>
            </div>
            <div className="ai-settings-status">
              {resolvedConfig.usesFallbackApiKey ? t('aiBuilder.usingFallbackApi') : t('aiBuilder.usingCustomApi')}
              <code>{resolvedConfig.config.model}</code>
            </div>
          </div>
        )}

        {/* Chat Area */}
        <div ref={listRef} className="ai-panel-chat" aria-live="polite">
          {messages.length === 0 && !isSubmitting && (
            <div className="ai-welcome-card">
              <div className="ai-welcome-icon">
                <Sparkles size={32} />
              </div>
              <p className="ai-welcome-text">{t('aiBuilder.welcomeQuestion')}</p>
              <div className="ai-welcome-actions">
                {QUICK_STARTS.map(qs => {
                  const Icon = qs.icon;
                  return (
                    <button
                      key={qs.key}
                      type="button"
                      className="ai-quick-start-btn"
                      onClick={() => handleQuickStart(qs.replyKey)}
                      disabled={!canSend}
                    >
                      <Icon size={18} />
                      <span>{t(`aiBuilder.${qs.key}`)}</span>
                      <ChevronRight size={14} className="ai-quick-start-arrow" />
                    </button>
                  );
                })}
              </div>
              {!canSend && (
                <button
                  type="button"
                  className="ai-welcome-hint"
                  onClick={() => setShowSettings(true)}
                >
                  <Settings size={14} />
                  {t('aiBuilder.apiKeyRequired')}
                </button>
              )}
            </div>
          )}

          {messages.map((msg, i) => (
              <div key={`${msg.role}-${i}`} className={`ai-msg ${msg.role === 'user' ? 'ai-msg-user' : 'ai-msg-assistant'}`}>
                <div className="ai-msg-bubble">
                  {msg.content.split('\n').map((line, li) => (
                    <React.Fragment key={li}>
                      {line}
                      {li < msg.content.split('\n').length - 1 && <br />}
                    </React.Fragment>
                  ))}
                </div>
              </div>
          ))}

          {isSubmitting && (
            <div className="ai-msg ai-msg-assistant">
              <div className="ai-msg-bubble ai-typing">
                <span className="ai-typing-dot" />
                <span className="ai-typing-dot" />
                <span className="ai-typing-dot" />
              </div>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="ai-panel-error">
            <span>{error}</span>
            <button type="button" onClick={() => setError('')}>&times;</button>
          </div>
        )}

        {/* Success */}
        {appliedCount > 0 && (
          <div className="ai-panel-success">
            <span>{t('aiBuilder.appliedCards', { count: appliedCount })}</span>
          </div>
        )}

        {/* Input Area */}
        <div className="ai-panel-input-area">
          {phase === 'interview' && (
            <div className="ai-suggestion-chips">
              <button type="button" className="ai-chip" onClick={handleForceGenerate} disabled={isSubmitting || !canSend}>
                <Wand2 size={14} /> {t('aiBuilder.generateNow')}
              </button>
              <button type="button" className="ai-chip" onClick={handleResetChat} disabled={isSubmitting}>
                <RotateCcw size={14} /> {t('aiBuilder.resetChat')}
              </button>
            </div>
          )}
          <div className="ai-input-row">
            <textarea
              ref={inputRef}
              className="ai-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('aiBuilder.inputPlaceholder')}
              rows={2}
              disabled={isSubmitting}
            />
            <button
              type="button"
              className="ai-send-btn"
              onClick={handleSend}
              disabled={isSubmitting || !canSend || !input.trim()}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChatPanel;
