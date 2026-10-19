import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, Settings, Sparkles, Send, RotateCcw, Wand2, Gamepad2, Music, Users, ChevronRight, MessageCircle, ExternalLink, Shuffle } from 'lucide-react';
import { SegmentedControl } from './ui/EditorControls';
import { fixCardLayouts } from '../utils/profileSchema';
import { useTranslation } from '../hooks/useTranslation';
import { useProfileActions, useProfileDataCtx } from '../context/ProfileContext';
import { isSubmitEnter } from '../utils/keyboard';
import { safeGetItem, safeSetItem } from '../utils/storage';
import { STYLE_PRESETS, applyStylePreset, resolveAppearance } from '../utils/appearance';
import { defaultFooter } from '../utils/data';
import { LEGACY_SAMPLE_AVATAR, LEGACY_SAMPLE_QR_LINK, MOCK_AVATAR, MOCK_QR } from '../utils/placeholders';
import { escapeHtml } from '../utils/html';
import type { ProfileData } from '../types/data';
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
  normalizeGeneratedLook,
  resolveAiConfig,
  splitQuickReplies,
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

/** 模型给的标题是纯文本，存进去之前转义（标题用 innerHTML 渲染） */
const escapeText = (value: unknown) => (typeof value === 'string' ? escapeHtml(value.trim()) : '');

/** 免费获取 Gemini API Key 的页面 */
const GEMINI_KEY_URL = 'https://aistudio.google.com/apikey';

type ApplyMode = 'replace' | 'append';

// Automatic grid measurements may change layout, but must not invalidate undo.
const generationContent = (data: ProfileData) => JSON.stringify({
  userSettings: data.userSettings,
  cards: data.cards.map(card => ({ ...card, layout: undefined })).sort((a, b) => a.id.localeCompare(b.id)),
});

const QUICK_STARTS = [
  { key: 'quickStart1', icon: MessageCircle, replyKey: 'quickReply4' },
  { key: 'quickStart2', icon: Gamepad2, replyKey: 'quickReply2' },
  { key: 'quickStart3', icon: Music, replyKey: 'quickReply3' },
  { key: 'quickStart4', icon: Users, replyKey: 'quickReply1' },
];

const AIChatPanel: React.FC<AIChatPanelProps> = ({ isOpen, onClose }) => {
  const { t, locale } = useTranslation();
  const { replaceProfileData } = useProfileActions();
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
  // Keep the original snapshot even after more than 30 local style changes.
  // Any intervening content edit or global undo disables this restore.
  const [beforeGeneration, setBeforeGeneration] = useState<ProfileData | null>(null);
  const [lastGenerationContent, setLastGenerationContent] = useState('');
  const canUndoGeneration = Boolean(beforeGeneration && profileData && generationContent(profileData) === lastGenerationContent);
  const [currentStyle, setCurrentStyle] = useState('classic');
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
    const raw = generated as { cards?: unknown; look?: unknown; userSettings?: { mainTitle?: unknown; subtitle?: unknown } } | undefined;
    const cards = normalizeGeneratedCards(raw?.cards);
    if (!cards.length) throw new Error(t('aiBuilder.emptyCardsError'));

    if (!profileData) return;
    const nextSettings = { ...profileData.userSettings };
    let style = 'classic';
    if (applyMode === 'replace') {
      // 标题也按纯文本处理（EditableText 用 innerHTML 渲染）
      const mainTitle = escapeText(raw?.userSettings?.mainTitle);
      const subtitle = escapeText(raw?.userSettings?.subtitle);
      if (mainTitle) nextSettings.mainTitle = mainTitle;
      if (subtitle) nextSettings.subtitle = subtitle;
      // 外观只在“替换全部”时应用：追加时保留用户现在的样子
      const look = normalizeGeneratedLook(raw?.look);
      if (look.style) {
        style = look.style;
        const appearance = applyStylePreset(nextSettings.appearance, look.style);
        nextSettings.appearance = { ...appearance, layout: { ...appearance.layout, fontFamily: look.fontFamily ?? '' } };
      }
      if (look.accentColor) nextSettings.accentColor = look.accentColor;
    }
    // 示例数据里的头像、二维码、页脚是作者本人的（小芝士）：还没换掉的话用占位图 / 用户的称呼代替。
    // 用户自己上传过的不动。
    if (applyMode === 'replace' && nextSettings.avatarSrc === LEGACY_SAMPLE_AVATAR) nextSettings.avatarSrc = MOCK_AVATAR;
    if (applyMode === 'replace' && !nextSettings.qrCodeImage && nextSettings.qrCodeLink === LEGACY_SAMPLE_QR_LINK) {
      nextSettings.qrCodeLink = '';
      nextSettings.qrCodeImage = MOCK_QR;
    }
    // 页脚还是示例的或默认格式的，换成新的称呼
    if (applyMode === 'replace' && (nextSettings.footerText === defaultFooter('小芝士') || nextSettings.footerText === defaultFooter(profileData.userSettings.mainTitle))) {
      nextSettings.footerText = defaultFooter(nextSettings.mainTitle);
    }
    // 追加：整体平移到现有卡片下方（保留自动排好的行），再由 fixCardLayouts 修正
    const bottom = profileData.cards.reduce((max, c) => Math.max(max, (c.layout?.y ?? 0) + (c.layout?.h ?? 0)), 0);
    const nextCards = applyMode === 'append'
      ? fixCardLayouts([...profileData.cards, ...cards.map(card => ({ ...card, layout: card.layout && { ...card.layout, y: card.layout.y + bottom } }))])
      : cards;
    // 走 replaceProfileData：可通过撤销提示或面板里的按钮撤销
    const nextData = { userSettings: nextSettings, cards: nextCards };
    setBeforeGeneration(profileData);
    setLastGenerationContent(generationContent(nextData));
    replaceProfileData(nextData, 'ai');
    setAppliedCount(cards.length);
    setCurrentStyle(style);
  };

  /** 生成后在本地轮换一键风格：内容不变，不再请求 AI */
  const handleShuffleStyle = () => {
    if (!profileData) return;
    const keys = STYLE_PRESETS.map(p => p.key);
    const next = keys[(keys.indexOf(currentStyle) + 1) % keys.length];
    const appearance = applyStylePreset(resolveAppearance(profileData.userSettings.appearance), next);
    const nextData: ProfileData = { ...profileData, userSettings: { ...profileData.userSettings, appearance } };
    replaceProfileData(nextData, 'style');
    if (canUndoGeneration) setLastGenerationContent(generationContent(nextData));
    setCurrentStyle(next);
  };

  const handleUndoGeneration = () => {
    if (!canUndoGeneration || !beforeGeneration) return;
    replaceProfileData(beforeGeneration, 'ai');
    setBeforeGeneration(null);
    setLastGenerationContent('');
    setAppliedCount(0);
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

  /** 点快捷按钮（开场按钮或 AI 给的选项）= 直接发出这句话 */
  const sendText = async (content: string) => {
    if (isSubmitting || !canSend) return;
    const nextHistory: AiChatMessage[] = [...messages, { role: 'user', content }];
    setMessages(nextHistory);
    await runAi(nextHistory);
  };

  const handleQuickStart = (replyKey: string) => sendText(t(`aiBuilder.${replyKey}`));

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

          {messages.map((msg, i) => {
            // AI 提问时最后一行是 [[选项 | 选项]]：显示时去掉，最新一条的选项做成按钮
            const { text, options } = msg.role === 'assistant' ? splitQuickReplies(msg.content) : { text: msg.content, options: [] };
            const showOptions = options.length > 0 && i === messages.length - 1 && !isSubmitting;
            return (
              <div key={`${msg.role}-${i}`} className={`ai-msg ${msg.role === 'user' ? 'ai-msg-user' : 'ai-msg-assistant'}`}>
                <div className="ai-msg-bubble">
                  {(msg.role === 'assistant' ? plainReply(text) : text).split('\n').map((line, li, lines) => (
                    <React.Fragment key={li}>
                      {line}
                      {li < lines.length - 1 && <br />}
                    </React.Fragment>
                  ))}
                </div>
                {showOptions && (
                  <div className="ai-quick-replies">
                    {options.map(option => (
                      <button key={option} type="button" className="ai-quick-reply" onClick={() => sendText(option)} disabled={!canSend}>
                        {option}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

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
            <div className="ai-panel-success-row">
              <span>{t('aiBuilder.appliedCards', { count: appliedCount })}</span>
              {canUndoGeneration && (
                <span className="ai-panel-success-actions">
                  <button type="button" className="ai-panel-success-btn" onClick={handleShuffleStyle} title={t('aiBuilder.shuffleStyleHint')}>
                    <Shuffle size={13} /> {t('aiBuilder.shuffleStyle', { style: t(`customize.preset.${currentStyle}`) })}
                  </button>
                  <button type="button" className="ai-panel-success-undo" onClick={handleUndoGeneration}>
                    {t('aiBuilder.undoGeneration')}
                  </button>
                </span>
              )}
            </div>
            <p className="ai-panel-success-hint">{t('aiBuilder.afterApplyHint')}</p>
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
