import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, Settings, Sparkles, Send, RotateCcw, Wand2, Gamepad2, Music, Users, ChevronRight, MessageCircle, ExternalLink } from 'lucide-react';
import { SegmentedControl } from './ui/EditorControls';
import { fixCardLayouts } from '../utils/profileSchema';
import { useTranslation } from '../hooks/useTranslation';
import { useProfileActions, useProfileDataCtx } from '../context/ProfileContext';
import { isSubmitEnter } from '../utils/keyboard';
import { safeGetItem, safeSetItem } from '../utils/storage';
import {
  AI_LOCAL_STORAGE_KEY,
  AI_REQUEST_TIMEOUT_MS,
  AiChatMessage,
  AiConfig,
  DEFAULT_MODEL,
  LEGACY_DEFAULT_MODELS,
  PROVIDER_PRESETS,
  callAiInterviewer,
  normalizeGeneratedCards,
  resolveAiConfig,
} from '../utils/aiProfile';

/** 对话按标签页保存：误点遮罩 / 按 Esc 关掉面板后再打开，聊天记录还在 */
const CHAT_SESSION_KEY = 'profilecraft-ai-chat';

interface SavedChat {
  messages: AiChatMessage[];
  appliedCount: number;
}

const loadChat = (): SavedChat => {
  try {
    const raw = JSON.parse(sessionStorage.getItem(CHAT_SESSION_KEY) || 'null');
    if (raw && Array.isArray(raw.messages)) {
      return {
        messages: raw.messages.filter((m: AiChatMessage) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string'),
        appliedCount: Number(raw.appliedCount) || 0,
      };
    }
  } catch {
    /* sessionStorage 不可用或内容损坏：从空对话开始 */
  }
  return { messages: [], appliedCount: 0 };
};

const loadConfig = (): AiConfig => {
  try {
    const saved = JSON.parse(safeGetItem(AI_LOCAL_STORAGE_KEY) || 'null') as Partial<AiConfig> | null;
    if (!saved) return DEFAULT_CONFIG;
    const config = { ...DEFAULT_CONFIG, ...saved };
    // 旧版默认模型已停用或不对新 Key 开放：保存的仍是旧默认值时升级到该服务商的新默认值
    if (LEGACY_DEFAULT_MODELS[config.provider]?.includes(config.model)) config.model = PROVIDER_PRESETS[config.provider].model;
    return config;
  } catch {
    return DEFAULT_CONFIG;
  }
};

interface AIChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_CONFIG: AiConfig = {
  provider: 'gemini',
  apiKey: '',
  baseUrl: '',
  model: DEFAULT_MODEL,
};


/** 提示词要求纯文本，但模型仍可能带 Markdown：去掉常见标记，列表符号换成圆点 */
const plainReply = (text: string) =>
  text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-*]\s+/gm, '• ');

/** 免费获取 Gemini API Key 的页面 */
const GEMINI_KEY_URL = 'https://aistudio.google.com/apikey';

type ApplyMode = 'replace' | 'append';

const QUICK_STARTS = [
  { key: 'quickStart1', icon: MessageCircle, replyKey: 'quickReply4' },
  { key: 'quickStart2', icon: Gamepad2, replyKey: 'quickReply2' },
  { key: 'quickStart3', icon: Music, replyKey: 'quickReply3' },
  { key: 'quickStart4', icon: Users, replyKey: 'quickReply1' },
];

const AIChatPanel: React.FC<AIChatPanelProps> = ({ isOpen, onClose }) => {
  const { t, locale } = useTranslation();
  const { replaceProfileData, undo } = useProfileActions();
  const { profileData } = useProfileDataCtx();
  const abortRef = useRef<AbortController | null>(null);

  // 关闭面板时取消进行中的请求，避免关掉后结果仍然覆盖卡片
  useEffect(() => () => abortRef.current?.abort(), []);
  const [config, setConfig] = useState<AiConfig>(loadConfig);
  const [messages, setMessages] = useState<AiChatMessage[]>(() => loadChat().messages);
  const [input, setInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [appliedCount, setAppliedCount] = useState(() => loadChat().appliedCount);
  const [showSettings, setShowSettings] = useState(false);
  // 本次打开面板后应用过的生成可以就地撤销（不持久化：关闭期间用户可能已经改过内容）
  const [canUndoGeneration, setCanUndoGeneration] = useState(false);
  // 生成结果替换全部卡片，还是追加到现有卡片后面（追加时不改标题）
  const [applyMode, setApplyMode] = useState<ApplyMode>('replace');
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
      sessionStorage.setItem(CHAT_SESSION_KEY, JSON.stringify({ messages, appliedCount } satisfies SavedChat));
    } catch {
      /* 存不下就算了，不影响使用 */
    }
  }, [messages, appliedCount]);


  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, isSubmitting]);

  const resolvedConfig = useMemo(() => resolveAiConfig(config), [config]);
  // 自定义端点（如本地代理）可以不需要 Key，但必须填 Base URL
  const canSend = useMemo(
    () => Boolean(resolvedConfig.config.apiKey) || (resolvedConfig.config.provider === 'custom' && Boolean(config.baseUrl.trim())),
    [resolvedConfig, config.baseUrl],
  );
  const interviewRound = useMemo(() => messages.filter(m => m.role === 'user').length, [messages]);
  const phase = useMemo(() => {
    if (appliedCount > 0) return 'done';
    if (interviewRound > 0) return 'interview';
    return 'ready';
  }, [appliedCount, interviewRound]);

  const updateConfig = (patch: Partial<AiConfig>) => {
    setConfig(prev => {
      const next = { ...prev, ...patch };
      safeSetItem(AI_LOCAL_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const applyGeneratedCards = (generated: unknown) => {
    const raw = generated as { cards?: unknown; userSettings?: { mainTitle?: string; subtitle?: string } };
    const cards = normalizeGeneratedCards(raw?.cards);
    if (!cards.length) throw new Error(t('aiBuilder.emptyCardsError'));

    if (!profileData) return;
    const nextSettings = { ...profileData.userSettings };
    if (applyMode === 'replace' && raw?.userSettings) {
      if (raw.userSettings.mainTitle) nextSettings.mainTitle = raw.userSettings.mainTitle;
      if (raw.userSettings.subtitle) nextSettings.subtitle = raw.userSettings.subtitle;
    }
    // 追加：新卡片的 y 置空，由 fixCardLayouts 依次排到现有卡片下方
    const nextCards = applyMode === 'append'
      ? fixCardLayouts([...profileData.cards, ...cards.map(card => ({ ...card, layout: card.layout && { ...card.layout, y: Number.NaN } }))])
      : cards;
    // 走 replaceProfileData：可通过撤销提示或面板里的按钮撤销
    replaceProfileData({ userSettings: nextSettings, cards: nextCards }, 'ai');
    setAppliedCount(cards.length);
    setCanUndoGeneration(true);
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
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    // 超时与“关闭面板”都会 abort，用标记区分：超时要提示用户，关闭则静默
    let timedOut = false;
    const timer = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, AI_REQUEST_TIMEOUT_MS);
    try {
      const result = await callAiInterviewer(resolvedConfig.config, nextHistory, { ...options, signal: controller.signal, locale });
      if (controller.signal.aborted) return;
      if (result.debug?.error) {
        // 调试信息（请求 / 响应摘要，不含 Key）只打到控制台，方便用户反馈问题时附上
        console.warn('[AI]', result.debug);
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
      if (timedOut) {
        setError(t('aiBuilder.TIMEOUT'));
        return;
      }
      if (controller.signal.aborted) return;
      setError(err instanceof Error ? err.message : t('aiBuilder.unknownError'));
    } finally {
      window.clearTimeout(timer);
      if (abortRef.current === controller) abortRef.current = null;
      if (timedOut || !controller.signal.aborted) setIsSubmitting(false);
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
    if (isSubmitEnter(e) && !e.shiftKey) {
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
            <button type="button" className="ai-panel-header-btn" onClick={onClose} title={t('common.close')}>
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
                  autoComplete="off"
                />
                <small className="ai-settings-note">{t('aiBuilder.keyPrivacy')}</small>
              </label>
              <label className="ai-settings-field">
                <span>{t('aiBuilder.baseUrl')}</span>
                <input
                  type="text"
                  value={config.baseUrl}
                  onChange={e => updateConfig({ baseUrl: e.target.value })}
                  placeholder={PROVIDER_PRESETS[config.provider]?.baseUrl || 'https://…/v1'}
                />
              </label>
              <label className="ai-settings-field">
                <span>{t('aiBuilder.model')}</span>
                <input
                  type="text"
                  value={config.model}
                  onChange={e => updateConfig({ model: e.target.value })}
                  placeholder={PROVIDER_PRESETS[config.provider]?.model || 'model-id'}
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
              {canSend && <div className="ai-welcome-actions">
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
              </div>}
              {!canSend && (
                <div className="ai-onboarding">
                  <p className="ai-onboarding-title">{t('aiBuilder.onboardTitle')}</p>
                  {config.provider === 'gemini' ? (
                    <>
                      <ol className="ai-onboarding-steps">
                        <li>
                          {t('aiBuilder.onboardStep1')}{' '}
                          <a href={GEMINI_KEY_URL} target="_blank" rel="noopener noreferrer">
                            Google AI Studio <ExternalLink size={12} />
                          </a>
                        </li>
                        <li>{t('aiBuilder.onboardStep2')}</li>
                      </ol>
                      <input
                        type="password"
                        className="ai-onboarding-input"
                        value={config.apiKey}
                        onChange={e => updateConfig({ apiKey: e.target.value })}
                        placeholder={t('aiBuilder.apiKeyPlaceholder')}
                        aria-label={t('aiBuilder.apiKey')}
                        autoComplete="off"
                      />
                      <p className="ai-onboarding-note">{t('aiBuilder.onboardPrivacy')}</p>
                    </>
                  ) : (
                    <p className="ai-onboarding-note">{t('aiBuilder.apiKeyRequired')}</p>
                  )}
                  <button type="button" className="ai-welcome-hint" onClick={() => setShowSettings(true)}>
                    <Settings size={14} />
                    {t('aiBuilder.otherProviders')}
                  </button>
                </div>
              )}
            </div>
          )}

          {messages.map((msg, i) => (
              <div key={`${msg.role}-${i}`} className={`ai-msg ${msg.role === 'user' ? 'ai-msg-user' : 'ai-msg-assistant'}`}>
                <div className="ai-msg-bubble">
                  {(msg.role === 'assistant' ? plainReply(msg.content) : msg.content).split('\n').map((line, li, lines) => (
                    <React.Fragment key={li}>
                      {line}
                      {li < lines.length - 1 && <br />}
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
            {canUndoGeneration && (
              <button
                type="button"
                className="ai-panel-success-undo"
                onClick={() => {
                  undo();
                  setCanUndoGeneration(false);
                  setAppliedCount(0);
                }}
              >
                {t('aiBuilder.undoGeneration')}
              </button>
            )}
          </div>
        )}

        {/* Input Area */}
        <div className="ai-panel-input-area">
          {phase !== 'ready' && (
            <div className="ai-suggestion-chips">
              <button type="button" className="ai-chip" onClick={handleForceGenerate} disabled={isSubmitting || !canSend}>
                <Wand2 size={14} /> {t('aiBuilder.generateNow')}
              </button>
              <button type="button" className="ai-chip" onClick={handleResetChat} disabled={isSubmitting}>
                <RotateCcw size={14} /> {t('aiBuilder.resetChat')}
              </button>
              <div className="ai-apply-mode" title={t('aiBuilder.applyModeLabel')}>
                <SegmentedControl<ApplyMode>
                  value={applyMode}
                  options={[{ value: 'replace', label: t('aiBuilder.applyReplace') }, { value: 'append', label: t('aiBuilder.applyAppend') }]}
                  onChange={setApplyMode}
                />
              </div>
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
